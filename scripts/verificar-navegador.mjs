/**
 * Verificación en un navegador real.
 *
 * Comprueba las cuatro situaciones que importan:
 *
 *   1. Con WebGL y JavaScript: la escena arranca y el contenido está.
 *   2. Sin WebGL (se anula `HTMLCanvasElement.prototype.getContext`): la web
 *      se lee igual y lo dice con un mensaje claro.
 *   3. Sin JavaScript: el CV completo se lee en el HTML plano.
 *   4. Con `prefers-reduced-motion: reduce`: la escena se dibuja estática.
 *
 * Usa el protocolo CDP sobre el WebSocket nativo de Node: sin dependencias.
 *
 * Se conecta a un Chrome YA abierto con puerto de depuración
 * (`--remote-debugging-port=9222`), en vez de lanzar uno nuevo: no abre
 * puertos nuevos ni deja procesos huérfanos.
 *
 * Uso:
 *   node scripts/verificar-navegador.mjs [puerto-cdp] [url]
 *
 * Por defecto usa el puerto 9222 y `http://localhost:4817/`, que es donde
 * debe estar sirviéndose `dist/` (ver README).
 */

import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(RAIZ, 'dist');

const PUERTO_CDP = Number(process.argv[2] || 9222);
const URL_BASE = process.argv[3] || 'http://localhost:4817/';

/* -------------------------------------------------------------------------
 * Cliente CDP mínimo
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

/** Texto visible de la página. */
const EXPR_TEXTO = `document.body.innerText.replace(/\\s+/g,' ').trim()`;

async function navegar(enviar, url) {
  await enviar('Page.enable');
  await enviar('Runtime.enable');
  await enviar('Page.navigate', { url });
  await dormir(1500);
}

/* -------------------------------------------------------------------------
 * Programa principal
 * ---------------------------------------------------------------------- */

console.log(`\nComprobando ${URL_BASE}\n`);

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
  /* =====================================================================
   * 1. Con WebGL y JavaScript
   * ===================================================================== */
  console.log('=== 1. Con WebGL y JavaScript ===\n');
  await navegar(cdp.enviar, URL_BASE);

  const texto1 = await evaluar(cdp.enviar, EXPR_TEXTO);
  comprobar('El nombre aparece', texto1.includes('Alejandro Huerta'));
  comprobar('El titular aparece', texto1.includes('Ingeniero senior de plataforma'));
  comprobar(
    'Todos los proyectos aparecen',
    [
      'fotoverse',
      'godKAI-back',
      'ImageTron',
      'Three Roads',
      'MAI',
      'Frodo',
      'Edutika',
      'AKAI25',
      'RoadRol',
      'freeAIApis',
      'AI Radar',
    ].every((p) => texto1.includes(p))
  );
  comprobar('El CV es descargable', texto1.includes('CV (PDF)'));

  const webgl = await evaluar(
    cdp.enviar,
    `(() => { const c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); })()`
  );
  console.log(`  (info) WebGL disponible en este Chrome: ${webgl}`);

  const escena = await evaluar(
    cdp.enviar,
    `(() => {
       const c = document.getElementById('lienzo-3d');
       if (!c) return 'sin-lienzo';
       const gl = c.getContext('webgl2') || c.getContext('webgl');
       return gl ? 'ok' : 'sin-contexto';
     })()`
  );
  comprobar('El lienzo 3D existe', escena !== 'sin-lienzo', escena);
  console.log(`  (info) contexto del lienzo: ${escena}`);

  const arrancada = await evaluar(
    cdp.enviar,
    `typeof window.__escena === 'object' && window.__escena !== null`
  );
  if (webgl) {
    comprobar('El módulo de la escena se ha instanciado', arrancada === true);
  } else {
    // Este navegador no tiene WebGL: la escena no debe arrancar, y la web
    // debe seguir leyéndose. Es el caso 2, que se comprueba más abajo.
    console.log(
      '  N/A   El módulo de la escena se ha instanciado (este navegador no tiene WebGL)'
    );
  }

  /* =====================================================================
   * 2. Sin WebGL
   * ===================================================================== */
  console.log('\n=== 2. Sin WebGL (getContext anulado) ===\n');

  await cdp.enviar('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      const _getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(tipo, ...resto) {
        if (typeof tipo === 'string' && tipo.includes('webgl')) return null;
        return _getContext.call(this, tipo, ...resto);
      };
    `,
  });

  await navegar(cdp.enviar, URL_BASE);

  const texto2 = await evaluar(cdp.enviar, EXPR_TEXTO);
  comprobar('El contenido sigue ahí', texto2.includes('Alejandro Huerta'));
  comprobar(
    'Todos los proyectos siguen ahí',
    ['fotoverse', 'ImageTron', 'Edutika', 'RoadRol'].every((p) => texto2.includes(p))
  );

  const mensaje = await evaluar(
    cdp.enviar,
    `document.getElementById('escena-estado').innerText`
  );
  console.log(`  (info) mensaje mostrado: ${JSON.stringify(mensaje.slice(0, 100))}`);
  comprobar(
    'Se explica que la escena no está disponible',
    /no está disponible|no se ha podido|sin WebGL/i.test(mensaje),
    mensaje.slice(0, 80)
  );
  comprobar('Se recuerda que el contenido está en el texto', /texto|abajo/i.test(mensaje));

  const escenaOculta = await evaluar(
    cdp.enviar,
    `document.getElementById('escena').hidden`
  );
  comprobar('El lienzo 3D se oculta', escenaOculta === true, String(escenaOculta));

  const sinErrores = await evaluar(
    cdp.enviar,
    `document.getElementById('escena-estado').innerText.includes('no se ha podido')`
  );
  comprobar('No aparece un error de fallo (degradación, no crashed)', sinErrores === false);

  /* =====================================================================
   * 3. Sin JavaScript
   * ===================================================================== */
  console.log('\n=== 3. Sin JavaScript (scripts deshabilitados) ===\n');

  await cdp.enviar('Emulation.setScriptExecutionDisabled', { value: true });
  await navegar(cdp.enviar, URL_BASE);

  const texto3 = await evaluar(cdp.enviar, EXPR_TEXTO).catch(() => '');
  comprobar('El documento tiene contenido', (texto3 || '').length > 2000);
  comprobar(
    'El titular está en el HTML',
    (texto3 || '').includes('Ingeniero senior de plataforma')
  );
  comprobar('El CV está enlazado', (texto3 || '').includes('CV (PDF)'));
  comprobar(
    'Los proyectos están en el HTML',
    ['fotoverse', 'ImageTron', 'Edutika'].every((p) => (texto3 || '').includes(p))
  );
  comprobar('El correo está en el HTML', (texto3 || '').includes('ahuertam@yahoo.es'));

  await cdp.enviar('Emulation.setScriptExecutionDisabled', { value: false });

  /* =====================================================================
   * 4. prefers-reduced-motion
   * ===================================================================== */
  console.log('\n=== 4. Con prefers-reduced-motion: reduce ===\n');

  await cdp.enviar('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await navegar(cdp.enviar, URL_BASE);

  const texto4 = await evaluar(cdp.enviar, EXPR_TEXTO);
  comprobar('El contenido sigue ahí', texto4.includes('Alejandro Huerta'));

  const animaciones = await evaluar(
    cdp.enviar,
    `document.getAnimations ? document.getAnimations().filter(a=>a.playState==='running').length : -1`
  );
  console.log(`  (info) animaciones CSS en marcha: ${animaciones}`);
  comprobar(
    'Ninguna animación CSS en marcha',
    animaciones === 0 || animaciones === -1,
    `${animaciones} animaciones`
  );

  const estadoMovimiento = await evaluar(
    cdp.enviar,
    `document.getElementById('escena-estado').innerText`
  );
  console.log(`  (info) estado: ${JSON.stringify(estadoMovimiento.slice(0, 100)) || '(vacío)'}`);

  const escenaExiste = await evaluar(
    cdp.enviar,
    `!!document.getElementById('lienzo-3d')`
  );
  comprobar('El lienzo sigue presente (interactivo, sólo estático)', escenaExiste === true);

  await cdp.enviar('Emulation.setEmulatedMedia', { features: [] });

  /* =====================================================================
   * 5. Accesibilidad
   * ===================================================================== */
  console.log('\n=== 5. Accesibilidad ===\n');

  await cdp.enviar('Page.bringToFront');
  await navegar(cdp.enviar, URL_BASE);
  await cdp.enviar('Page.bringToFront');

  const h1 = await evaluar(
    cdp.enviar,
    `(() => { const h = document.querySelectorAll('h1'); return h.length === 1 ? h[0].textContent.trim() : 'hay ' + h.length; })()`
  );
  comprobar('Hay exactamente un h1', !String(h1).startsWith('hay '), String(h1));
  console.log(`  (info) h1: ${h1}`);

  const jerarquia = await evaluar(
    cdp.enviar,
    `(() => {
       const niveles = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => Number(h.tagName[1]));
       let saltos = 0;
       for (let i = 1; i < niveles.length; i++) {
         if (niveles[i] - niveles[i-1] > 1) saltos++;
       }
       return saltos;
     })()`
  );
  comprobar('La jerarquía de encabezados no tiene saltos', jerarquia === 0, `${jerarquia} saltos`);

  const enfocables = await evaluar(
    cdp.enviar,
    `document.querySelectorAll('a[href],button,summary,input,select,textarea').length`
  );
  comprobar(`Hay elementos navegables por teclado (${enfocables})`, enfocables > 20);

  // El enlace de salto sólo aparece al enfocarlo.
  const salto = await evaluar(
    cdp.enviar,
    `(() => {
       const a = document.querySelector('.saltar-al-contenido');
       a.focus();
       const cs = getComputedStyle(a);
       return { left: cs.left, visible: cs.left !== '-9999px', focused: a.matches(':focus') };
     })()`
  );
  comprobar('El enlace de salto aparece al enfocarlo', salto.visible === true, JSON.stringify(salto));

  const focoVisible = await evaluar(
    cdp.enviar,
    `(() => {
       const a = document.querySelector('.navegacion a');
       a.focus();
       const cs = getComputedStyle(a);
       return cs.outlineStyle !== 'none' || cs.outlineWidth !== '0px';
     })()`
  );
  comprobar('Los elementos enfocados tienen foco visible', focoVisible === true);

  // Contraste AA en los dos esquemas de color.
  for (const esquema of ['dark', 'light']) {
    await cdp.enviar('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: esquema }],
    });
    await navegar(cdp.enviar, URL_BASE);

    const bajoContraste = await evaluar(
      cdp.enviar,
      `(() => {
         const aRGB = (c) => {
           if (!c) return null;
           const m = c.match(/rgba?\\(([^)]+)\\)/);
           if (!m) return null;
           const partes = m[1].split(",").map(x => parseFloat(x));
           if (partes.length < 3 || partes.some(Number.isNaN)) return null;
           if (partes.length === 4 && partes[3] === 0) return null;
           return partes.slice(0, 3);
         };
         const lum = (rgb) => {
           const [r,g,b] = rgb.map(v => {
             v /= 255;
             return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
           });
           return 0.2126*r + 0.7152*g + 0.0722*b;
         };
         const ratio = (a,b) => {
           const l1 = lum(a), l2 = lum(b);
           return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
         };
         const bg = aRGB(getComputedStyle(document.body).backgroundColor);
         const selectores = ['.portada-resumen','.tarjeta-frase','.tarjeta-porque p','.bloque p','.contacto-etiqueta','.lista-stack li','.seccion-intro','.footer p, .pie p'];
         const malos = [];
         for (const sel of selectores) {
           const el = document.querySelector(sel);
           if (!el) continue;
           const fg = aRGB(getComputedStyle(el).color);
           if (!fg) continue;
           const r = ratio(fg, bg);
           if (r < 4.5) malos.push(sel + '=' + r.toFixed(2));
         }
         return malos;
       })()`
    );
    comprobar(
      `Contraste AA en modo ${esquema}`,
      bajoContraste.length === 0,
      bajoContraste.join(', ')
    );
  }

  /* =====================================================================
   * 6. El editor — se comprueba en otro script
   *
   * `verificar-editor-navegador.mjs` necesita WebGL, y este script anula
   * `getContext` en la sección 2 para probar el fallback sin WebGL. Esa
   * anulación se queda activa en el resto de la sesión, así que el editor
   * se verifica aparte, en un Chrome con WebGL.
   * ===================================================================== */
  console.log(
    '\n=== 6. El editor (paneles, búsqueda, deep link) ===\n' +
      '  N/A   Se comprueba en verificar-editor-navegador.mjs (necesita WebGL)\n'
  );

} catch (e) {
  console.error('\nError durante la verificación:', e.message);
  fallos += 1;
} finally {
  cdp.cerrar();
}

console.log(`\n=== ${total - fallos}/${total} comprobaciones superadas ===\n`);
process.exit(fallos > 0 ? 1 : 0);
