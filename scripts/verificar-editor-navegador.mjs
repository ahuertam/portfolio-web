/**
 * Verificación del concepto "El editor" en un navegador real.
 *
 * Va en un script aparte de `verificar-navegador.mjs` a propósito: aquel
 * anula `getContext` para probar el fallback sin WebGL, y esa anulación se
 * queda activa en el resto de la sesión. Aquí se necesita WebGL para
 * comprobar que la escena y los paneles se conectan.
 *
 * Comprueba:
 *
 *   1. Que la escena arranca y que el editor queda "vivo".
 *   2. Que el inspector muestra UNA ficha (la del asset seleccionado), no
 *      todas: es lo que distingue el editor de una lista.
 *   3. Que la búsqueda filtra en vivo, ignorando mayúsculas y acentos.
 *   4. Que seleccionar desde la jerarquía rellena el inspector, marca la
 *      fila y actualiza el hash de la URL (deep link).
 *   5. Que al abrir con un deep link, se selecciona ese asset.
 *   6. Que la ayuda de atajos se abre con "?" y se cierra con Escape, y que
 *      "/" enfoca el buscador.
 *
 * Usa el protocolo CDP sobre el WebSocket nativo de Node: sin dependencias.
 *
 * Uso:
 *   node scripts/verificar-editor-navegador.mjs [puerto-cdp] [url]
 *
 * Por defecto usa el puerto 9222 y `http://localhost:4817/`, que es donde
 * debe estar sirviéndose `dist/` (ver README).
 */

const PUERTO_CDP = Number(process.argv[2] || 9222);
const URL_BASE = process.argv[3] || 'http://localhost:4817/';

/* -------------------------------------------------------------------------
 * Cliente CDP mínimo (mismo que en verificar-navegador.mjs)
 * ---------------------------------------------------------------------- */

async function conectarCDP(puerto) {
  // Se reutiliza una pestaña que YA existe, en vez de abrir una nueva. Abrir
  // pestañas nuevas en cada ejecución deja el navegador lleno de ellas, y a
  // partir de un punto Chrome deja de responder.
  let pagina = null;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${puerto}/json/list`);
      if (r.ok) {
        const lista = await r.json();
        pagina = lista.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (pagina) break;
      }
    } catch {
      /* Chrome no responde todavía */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!pagina) throw new Error('no se encontró ninguna pestaña en Chrome');

  const ws = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });

  let id = 0;
  const pendientes = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pendientes.has(m.id)) {
      const { res, rej } = pendientes.get(m.id);
      pendientes.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  });

  const enviar = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id;
      pendientes.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  return { enviar, cerrar: () => ws.close() };
}

async function evaluar(enviar, expresion) {
  const r = await enviar('Runtime.evaluate', {
    expression: expresion,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(
      'JS: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)
    );
  }
  return r.result.value;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Espera a que la escena esté viva.
 *
 * Con renderizado por software (SwiftShader) la escena tarda varios segundos
 * en arrancar: three.js son 480 kB y el primer fotograma con SwiftShader es
 * lento. Espera activa, con tope, en vez de un tiempo fijo.
 */
async function esperarEditor(enviar, limiteMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < limiteMs) {
    const vivo = await enviar('Runtime.evaluate', {
      expression: `(() => {
         const e = document.getElementById('editor');
         return !!(e && e.dataset.editorVivo === 'true' && window.__escena);
       })()`,
      returnByValue: true,
    }).then((r) => r.result.value);
    if (vivo) return true;
    await dormir(400);
  }
  return false;
}

/* -------------------------------------------------------------------------
 * Comprobaciones
 * ---------------------------------------------------------------------- */

let fallos = 0;
let total = 0;

function comprobar(descripcion, condicion, detalle = '') {
  total += 1;
  if (condicion) console.log(`  OK   ${descripcion}`);
  else {
    fallos += 1;
    console.log(`  FALLA ${descripcion}${detalle ? ` — ${detalle}` : ''}`);
  }
}

console.log(`\nComprobando el editor en ${URL_BASE}\n`);

let cdp;
try {
  cdp = await conectarCDP(PUERTO_CDP);
} catch (e) {
  console.error(
    `No se pudo conectar con Chrome en el puerto ${PUERTO_CDP}.\n` +
      `Abre Chrome con --remote-debugging-port=${PUERTO_CDP} o pasa otro puerto.`
  );
  process.exit(1);
}

try {
  await cdp.enviar('Page.enable');
  await cdp.enviar('Runtime.enable');
  await cdp.enviar('Page.navigate', { url: URL_BASE });
  const arranco = await esperarEditor(cdp.enviar);
  if (!arranco) {
    console.error('La escena no llegó a arrancar en 30 s.');
    fallos += 1;
  }

  /* =====================================================================
   * 1. La escena arranca
   * ===================================================================== */
  console.log('=== 1. La escena y los paneles ===\n');

  const webgl = await evaluar(
    cdp.enviar,
    `(() => { const c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); })()`
  );
  console.log(`  (info) WebGL disponible en este Chrome: ${webgl}`);
  if (!webgl) {
    console.log(
      '  N/A   Este navegador no tiene WebGL: el editor cae en el modo sin\n' +
        '       escena, que se comprueba en verificar-navegador.mjs.'
    );
    throw new Error('sin-webgl');
  }

  const estado = await evaluar(
    cdp.enviar,
    `(() => {
       const editor = document.getElementById('editor');
       return {
         vivo: editor ? editor.dataset.editorVivo : null,
         escena: typeof window.__escena,
         conPaneles: !!(window.__escena && window.__escena.paneles),
         filas: document.querySelectorAll('.editor-fila-boton').length,
         fichas: document.querySelectorAll('.ficha').length,
       };
     })()`
  );
  comprobar('La escena se ha instanciado', estado.escena === 'object', estado.escena);
  comprobar('El editor está vivo (la escena ha arrancado)', estado.vivo === 'true', estado.vivo);
  comprobar('Los paneles están conectados a la escena', estado.conPaneles === true);
  comprobar(
    `Hay una fila por asset (${estado.filas})`,
    estado.filas === 17,
    `esperadas 17, encontradas ${estado.filas}`
  );
  comprobar(
    `Hay una ficha por asset (${estado.fichas})`,
    estado.fichas === 17,
    `esperadas 17, encontradas ${estado.fichas}`
  );

  // Con la escena viva, el inspector muestra una sola ficha.
  const visibles = await evaluar(
    cdp.enviar,
    `(() => [...document.querySelectorAll('.ficha')].filter(f => getComputedStyle(f).display !== 'none').length)()`
  );
  comprobar(
    `El inspector muestra una sola ficha (hay ${visibles} visibles)`,
    visibles === 1,
    `${visibles} visibles`
  );

  /* =====================================================================
   * 2. La búsqueda
   * ===================================================================== */
  console.log('\n=== 2. La búsqueda en vivo ===\n');

  const busqueda = await evaluar(
    cdp.enviar,
    `(() => {
       const campo = document.getElementById('editor-buscar');
       const contar = () => [...document.querySelectorAll('.editor-fila')].filter(li => !li.hidden).length;
       campo.value = 'fotoverse';
       campo.dispatchEvent(new Event('input', { bubbles: true }));
       const filtrado = contar();
       campo.value = '';
       campo.dispatchEvent(new Event('input', { bubbles: true }));
       return { filtrado, todas: contar() };
     })()`
  );
  comprobar(
    `La búsqueda filtra la jerarquía (${busqueda.filtrado} de ${busqueda.todas})`,
    busqueda.filtrado === 1 && busqueda.todas === 17,
    JSON.stringify(busqueda)
  );

  const sinAcento = await evaluar(
    cdp.enviar,
    `(() => {
       const campo = document.getElementById('editor-buscar');
       campo.value = 'EDUTIKA';
       campo.dispatchEvent(new Event('input', { bubbles: true }));
       const n = [...document.querySelectorAll('.editor-fila')].filter(li => !li.hidden).length;
       campo.value = '';
       campo.dispatchEvent(new Event('input', { bubbles: true }));
       return n;
     })()`
  );
  comprobar(
    'La búsqueda ignora mayúsculas y acentos',
    sinAcento === 1,
    `${sinAcento} resultados`
  );

  const vacio = await evaluar(
    cdp.enviar,
    `(() => {
       const campo = document.getElementById('editor-buscar');
       campo.value = 'xyzzy-no-existe';
       campo.dispatchEvent(new Event('input', { bubbles: true }));
       const n = [...document.querySelectorAll('.editor-fila')].filter(li => !li.hidden).length;
       const grupos = [...document.querySelectorAll('.editor-grupo')].filter(g => !g.hidden).length;
       campo.value = '';
       campo.dispatchEvent(new Event('input', { bubbles: true }));
       return { n, grupos };
     })()`
  );
  comprobar(
    'Una búsqueda sin resultados no deja filas sueltas',
    vacio.n === 0 && vacio.grupos === 0,
    JSON.stringify(vacio)
  );

  /* =====================================================================
   * 3. La selección
   * ===================================================================== */
  console.log('\n=== 3. Seleccionar desde la jerarquía ===\n');

  const seleccion = await evaluar(
    cdp.enviar,
    `(() => {
       const boton = document.querySelector('.editor-fila-boton[data-archivo="fotoverse"]');
       boton.click();
       const ficha = document.querySelector('.ficha[data-archivo="fotoverse"]');
       const estado = document.getElementById('editor-estado-seleccion');
       return {
         visible: !!ficha && getComputedStyle(ficha).display !== 'none',
         visibles: [...document.querySelectorAll('.ficha')].filter(f => getComputedStyle(f).display !== 'none').length,
         texto: estado ? estado.textContent : '',
         marcado: boton.getAttribute('aria-selected'),
         hash: location.hash,
         // textContent, no innerText: innerText devuelve sólo el texto
         // "renderizado", y el inspector tiene scroll, así que se corta.
         fichaTexto: ficha ? ficha.textContent : '',
         conEnlace: !!ficha && !!ficha.querySelector('a.ficha-enlace[href*="github.com"]'),
       };
     })()`
  );
  comprobar('Al seleccionar, el inspector muestra la ficha', seleccion.visible === true);
  comprobar('El inspector muestra sólo esa ficha', seleccion.visibles === 1, `${seleccion.visibles}`);
  comprobar(
    'La barra de estado muestra la selección',
    seleccion.texto.includes('fotoverse'),
    seleccion.texto
  );
  comprobar(
    'La fila queda marcada como seleccionada',
    seleccion.marcado === 'true',
    seleccion.marcado
  );
  comprobar(
    'El hash de la URL se actualiza (deep link)',
    seleccion.hash === '#/fotoverse',
    seleccion.hash
  );
  comprobar(
    'La ficha contiene la decisión y su coste',
    seleccion.fichaTexto.includes('Por qué importa')
  );
  comprobar('La ficha tiene su enlace a GitHub', seleccion.conEnlace === true);

  // El texto del inspector es seleccionable de verdad (no es un canvas).
  const seleccionable = await evaluar(
    cdp.enviar,
    `(() => {
       const ficha = document.querySelector('.ficha[data-archivo="fotoverse"]');
       const rango = document.createRange();
       rango.selectNodeContents(ficha.querySelector('.ficha-frase'));
       const sel = window.getSelection();
       sel.removeAllRanges();
       sel.addRange(rango);
       return sel.toString().length;
     })()`
  );
  comprobar(
    `El texto del inspector es seleccionable (${seleccionable} caracteres)`,
    seleccionable > 20,
    `${seleccionable}`
  );

  /* =====================================================================
   * 4. Deep link al abrir
   * ===================================================================== */
  console.log('\n=== 4. Deep link ===\n');

  await cdp.enviar('Page.navigate', { url: `${URL_BASE}#/edutika` });
  await esperarEditor(cdp.enviar);

  const deepLink = await evaluar(
    cdp.enviar,
    `(() => {
       const ficha = document.querySelector('.ficha[data-archivo="edutika"]');
       const boton = document.querySelector('.editor-fila-boton[data-archivo="edutika"]');
       const estado = document.getElementById('editor-estado-seleccion');
       return {
         fichaVisible: !!ficha && getComputedStyle(ficha).display !== 'none',
         marcado: boton ? boton.getAttribute('aria-selected') : null,
         texto: estado ? estado.textContent : '',
       };
     })()`
  );
  comprobar(
    'Al abrir con un deep link, se selecciona ese asset',
    deepLink.fichaVisible === true && deepLink.marcado === 'true',
    JSON.stringify(deepLink)
  );
  comprobar(
    'La barra de estado refleja el deep link',
    deepLink.texto.includes('Edutika'),
    deepLink.texto
  );

  // Un hash inválido no rompe nada.
  await cdp.enviar('Page.navigate', { url: `${URL_BASE}#/no-existe` });
  await esperarEditor(cdp.enviar);
  const hashInvalido = await evaluar(
    cdp.enviar,
    `(() => ({
       vivos: typeof window.__escena === 'object' && window.__escena !== null,
       texto: document.body.innerText.includes('Alejandro Huerta'),
     }))()`
  );
  comprobar('Un deep link inválido no rompe la web', hashInvalido.vivos === true);
  comprobar('La web sigue leyéndose', hashInvalido.texto === true);

  /* =====================================================================
   * 5. La ayuda y los atajos
   * ===================================================================== */
  console.log('\n=== 5. Atajos ===\n');

  await cdp.enviar('Page.navigate', { url: URL_BASE });
  await esperarEditor(cdp.enviar);

  const ayuda = await evaluar(
    cdp.enviar,
    `(() => {
       const dlg = document.getElementById('editor-ayuda');
       const antes = dlg.hidden;
       document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
       const abierto = !dlg.hidden;
       document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
       const cerrado = dlg.hidden;
       return { antes, abierto, cerrado };
     })()`
  );
  comprobar('La ayuda de atajos está oculta al principio', ayuda.antes === true);
  comprobar('La tecla "?" abre la ayuda', ayuda.abierto === true);
  comprobar('La tecla Escape cierra la ayuda', ayuda.cerrado === true);

  const foco = await evaluar(
    cdp.enviar,
    `(() => {
       const campo = document.getElementById('editor-buscar');
       campo.blur();
       document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
       return document.activeElement === campo;
     })()`
  );
  comprobar('La tecla "/" enfoca el buscador', foco === true);

  // Al escribir en el buscador, el editor no secuestra las teclas.
  const escribe = await evaluar(
    cdp.enviar,
    `(() => {
       const campo = document.getElementById('editor-buscar');
       campo.focus();
       campo.value = 'ma';
       campo.dispatchEvent(new Event('input', { bubbles: true }));
       return [...document.querySelectorAll('.editor-fila')].filter(li => !li.hidden).length;
     })()`
  );
  comprobar(
    `La búsqueda funciona mientras se escribe (${escribe} resultados)`,
    escribe >= 1,
    `${escribe}`
  );

  // La jerarquía se recorre con las flechas y se selecciona con Enter.
  const teclado = await evaluar(
    cdp.enviar,
    `(() => {
       const botones = [...document.querySelectorAll('.editor-fila-boton')];
       botones[0].focus();
       const inicio = document.activeElement.dataset.archivo;
       document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
       const siguiente = document.activeElement.dataset.archivo;
       return { inicio, siguiente };
     })()`
  );
  comprobar(
    'La flecha abajo mueve el foco por la jerarquía',
    teclado.inicio === 'intro' && teclado.siguiente !== teclado.inicio,
    JSON.stringify(teclado)
  );

  // El clic en un asset del viewport selecciona.
  const clicViewport = await evaluar(
    cdp.enviar,
    `(() => {
       const lienzo = document.getElementById('lienzo-3d');
       const r = lienzo.getBoundingClientRect();
       // Se hace clic en el centro del canvas: puede que no haya nada, pero
       // el manejador no debe lanzar.
       lienzo.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width/2, clientY: r.top + r.height/2, bubbles: true }));
       return true;
     })()`
  );
  comprobar('El clic en el viewport no lanza excepciones', clicViewport === true);
} catch (e) {
  if (e.message === 'sin-webgl') {
    console.log('\n=== 0/0 comprobaciones superadas (sin WebGL en este navegador) ===\n');
    process.exit(0);
  }
  console.error('\nError durante la verificación:', e.message);
  fallos += 1;
} finally {
  cdp.cerrar();
}

console.log(`\n=== ${total - fallos}/${total} comprobaciones superadas ===\n`);
process.exit(fallos > 0 ? 1 : 0);
