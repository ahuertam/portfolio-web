/**
 * Los paneles del editor — la parte que es HTML de verdad.
 *
 * Esto es lo que hace que el concepto "El editor" se pueda leer sin WebGL y
 * sin JavaScript: los paneles existen en el HTML estático, generados en build.
 * Aquí sólo está el CÓDIGO que los une con la escena:
 *
 *   - La jerarquía (árbol de assets) con búsqueda en vivo.
 *   - El inspector, que se rellena con la ficha del asset seleccionado.
 *   - La barra de estado, con el modo, la selección y los atajos.
 *   - La ayuda de atajos, en overlay.
 *   - Los deep links (`/#/fotoverse`).
 *
 * Nada de esto pinta texto en el canvas: el inspector muestra texto real
 * seleccionable, con su enlace a GitHub.
 */

import { INTRO, TODOS, ETAPAS, arquetipoDe } from '../../data/projects.js';

/* --------------------------------------------------------------------------
 * Utilidades de texto
 * -------------------------------------------------------------------------- */

/** Escapa texto para insertarlo como HTML. */
export function esc(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convierte texto plano en párrafos. Los `**negrita**` del dataset se
 * convierten en `<strong>`, que es lo que el texto plano del sitio ya hace.
 */
export function parrafos(texto) {
  return String(texto)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${negrita(esc(p))}</p>`)
    .join('\n            ');
}

/** Convierte `**texto**` en `<strong>texto</strong>` sobre texto ya escapado. */
function negrita(texto) {
  return texto.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Normaliza para comparar: minúsculas y sin acentos.
 *
 * El rango de los diacríticos combinantes (U+0300–U+036F) se escribe con
 * escapes unicode: escrito literal, depende de cómo se guarde el fichero.
 */
export function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/* --------------------------------------------------------------------------
 * El árbol de assets
 * -------------------------------------------------------------------------- */

/**
 * Los nodos de la jerarquía, en orden.
 *
 * La jerarquía es: el README de la intro primero, luego los proyectos
 * agrupados por tipo (personal / profesional) y luego los bloques de
 * trayectoria.
 *
 * @returns {Array<{tipo: string, id: string, etiqueta: string, datos: Object|null}>}
 */
export function construirArbol() {
  const nodos = [];

  nodos.push({
    tipo: 'intro',
    id: INTRO.id,
    etiqueta: INTRO.nombre,
    datos: INTRO,
  });

  const personales = TODOS.filter((d) => d.ambito === 'personal');
  const trabajo = TODOS.filter((d) => d.ambito === 'trabajo');

  nodos.push({
    tipo: 'grupo',
    id: 'grupo-personal',
    etiqueta: 'Proyectos propios',
    datos: null,
    hijos: personales.map((d) => ({
      tipo: 'asset',
      id: d.id,
      etiqueta: d.nombre,
      datos: d,
    })),
  });

  nodos.push({
    tipo: 'grupo',
    id: 'grupo-trabajo',
    etiqueta: 'Trayectoria profesional',
    datos: null,
    hijos: trabajo.map((d) => ({
      tipo: 'asset',
      id: d.id,
      etiqueta: d.nombre,
      datos: d,
    })),
  });

  return nodos;
}

/* --------------------------------------------------------------------------
 * Ficha del inspector
 * -------------------------------------------------------------------------- */

/**
 * La ficha HTML de un asset: nombre, frase, la decisión y su coste, las
 * etapas, el stack y los enlaces.
 *
 * @param {Object} dato
 * @returns {string} HTML
 */
export function ficha(dato) {
  if (!dato) return '';

  const arquetipo = arquetipoDe(dato.arquetipo);

  const etapas = dato.etapas
    .map((e) => {
      const nombre = ETAPAS.find((x) => x.id === e.id)?.nombre ?? e.id;
      return `
            <li class="ficha-etapa${e.clave ? ' ficha-etapa-clave' : ''}">
              <span class="ficha-etapa-nombre">${esc(nombre)}</span>
              <span class="ficha-etapa-titulo">${esc(e.titulo)}</span>
              <span class="ficha-etapa-detalle">${esc(e.detalle)}</span>
            </li>`;
    })
    .join('');

  const stack = dato.stack?.length
    ? `<ul class="ficha-stack">
            ${dato.stack.map((t) => `<li>${esc(t)}</li>`).join('\n            ')}
          </ul>`
    : '';

  const enlaces = [];
  if (dato.repo) {
    enlaces.push(
      `<a class="ficha-enlace" href="${esc(dato.repo)}" rel="noopener noreferrer">Código <span aria-hidden="true">↗</span><span class="visualmente-oculto"> (repositorio de ${esc(dato.nombre)} en GitHub)</span></a>`
    );
  }
  if (dato.url) {
    enlaces.push(
      `<a class="ficha-enlace" href="${esc(dato.url)}" rel="noopener noreferrer">En vivo <span aria-hidden="true">↗</span><span class="visualmente-oculto"> (demostración de ${esc(dato.nombre)})</span></a>`
    );
  }

  const anio = dato.anio
    ? `<span class="ficha-anio">${esc(dato.anio)}</span>`
    : '';

  return `
        <header class="ficha-cabecera">
          <h3 class="ficha-titulo">${esc(dato.nombre)}</h3>
          ${anio}
        </header>
        <p class="ficha-arquetipo"><span class="ficha-punto" aria-hidden="true"></span>${esc(arquetipo.nombre)}</p>
        <p class="ficha-frase">${esc(dato.frase)}</p>
        <div class="ficha-porque">
          <h4 class="ficha-subtitulo">Por qué importa</h4>
          ${parrafos(dato.porQue)}
        </div>
        <div class="ficha-etapas">
          <h4 class="ficha-subtitulo">El camino hasta aquí</h4>
          <ol class="ficha-lista-etapas">
            ${etapas}
          </ol>
        </div>
        ${stack}
        <div class="ficha-enlaces">
          ${enlaces.join('\n          ')}
        </div>`;
}

/* --------------------------------------------------------------------------
 * El binding: une los paneles con la escena
 * -------------------------------------------------------------------------- */

/**
 * Conecta los paneles HTML con la escena.
 *
 * Todo es opcional: si un panel no está en el DOM, el resto sigue
 * funcionando. Esto es lo que permite que los tests puedan montar la escena
 * sin panels.
 *
 * @param {Object} opciones
 * @param {Function} opciones.alSeleccionar  Se llama con el id del asset.
 * @param {Function} opciones.alEncuadrar     Se llama con el id del asset.
 * @returns {Object} Manejador de los paneles.
 */
export function conectarPaneles({ alSeleccionar, alEncuadrar } = {}) {
  const lista = document.getElementById('editor-jerarquia-lista');
  const buscador = document.getElementById('editor-buscar');
  const inspector = document.getElementById('editor-inspector');
  const modoEstado = document.getElementById('editor-estado-modo');
  const seleccionEstado = document.getElementById('editor-estado-seleccion');
  const ayuda = document.getElementById('editor-ayuda');
  const botonAyuda = document.getElementById('editor-ayuda-boton');

  const nodos = construirArbol();

  /** Las filas que ahora mismo son visibles, para la navegación con flechas. */
  let filasVisibles = [];

  /* --- Enlazar con las filas que ya están en el HTML ---------------------- */
  //
  // Las filas de la jerarquía YA están en el HTML estático, generadas en
  // build. Eso es lo que hace que la web se pueda usar sin JavaScript.
  //
  // Aquí NO se construyen de nuevo: se enlazan. Si se construyeran, cada
  // fila aparecería dos veces.

  /** Todos los assets, en orden: primero la intro, luego los grupos. */
  const todosLosAssets = nodos.flatMap((n) => (n.hijos ? n.hijos : [n]));

  /** El nombre legible de un asset, por id. */
  const nombresPorId = new Map(todosLosAssets.map((n) => [n.id, n.etiqueta]));

  /** Las filas que hay en el DOM, por id. */
  const filasPorId = new Map(
    [...(lista?.querySelectorAll('.editor-fila-boton') ?? [])].map((b) => [
      b.dataset.archivo,
      b,
    ])
  );

  // Si el HTML no traía alguna fila, se construye. Es una red de seguridad,
  // no el camino normal.
  for (const nodo of todosLosAssets) {
    if (filasPorId.has(nodo.id)) continue;
    const li = document.createElement('li');
    li.className = 'editor-fila';
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'editor-fila-boton';
    boton.dataset.archivo = nodo.id;
    boton.setAttribute('aria-selected', 'false');
    const punto = document.createElement('span');
    punto.className = 'editor-fila-punto';
    punto.setAttribute('aria-hidden', 'true');
    const texto = document.createElement('span');
    texto.className = 'editor-fila-texto';
    texto.textContent = nodo.etiqueta;
    boton.appendChild(punto);
    boton.appendChild(texto);
    li.appendChild(boton);
    lista?.appendChild(li);
    filasPorId.set(nodo.id, boton);
  }

  /** Recoge las filas visibles, en el orden en que se ven. */
  function recogerVisibles() {
    if (!lista) return [];
    return [...lista.querySelectorAll('.editor-fila-boton')].filter(
      (b) => b.offsetParent !== null || b.getClientRects().length > 0
    );
  }

  /* --- Búsqueda en vivo --------------------------------------------------- */

  let filtro = '';

  function filtrar(texto) {
    filtro = normalizar(texto);
    if (!lista) return;

    for (const boton of lista.querySelectorAll('.editor-fila-boton')) {
      const nombre = normalizar(nombresPorId.get(boton.dataset.archivo) ?? '');
      const coincide = !filtro || nombre.includes(filtro);
      boton.closest('.editor-fila').hidden = !coincide;
    }

    // Los grupos que se quedan vacíos se ocultan.
    for (const grupo of lista.querySelectorAll('.editor-grupo')) {
      const visibles = [...grupo.querySelectorAll('.editor-fila')].filter(
        (li) => !li.hidden
      );
      grupo.hidden = visibles.length === 0;
    }

    filasVisibles = recogerVisibles();
    actualizarEstado();
  }

  if (buscador) {
    buscador.addEventListener('input', (e) => filtrar(e.target.value));
    // `/` enfoca el buscador, como en cualquier editor.
    buscador.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        buscador.value = '';
        filtrar('');
        buscador.blur();
        e.stopPropagation();
      }
      if (e.key === 'Enter') {
        const primera = filasVisibles[0] ?? recogerVisibles()[0];
        if (primera) {
          seleccionarFila(primera);
        }
        e.preventDefault();
      }
    });
  }

  /* --- Selección ----------------------------------------------------------- */

  function marcarSeleccion(id) {
    if (!lista) return;
    for (const boton of lista.querySelectorAll('.editor-fila-boton')) {
      const activo = boton.dataset.archivo === id;
      boton.setAttribute('aria-selected', activo ? 'true' : 'false');
      boton.closest('.editor-fila')?.classList.toggle('editor-fila-activa', activo);
    }
  }

  function seleccionarFila(boton) {
    if (!boton) return;
    const id = boton.dataset.archivo;
    marcarSeleccion(id);
    if (alSeleccionar) alSeleccionar(id);
  }

  /**
   * Fija el asset seleccionado (usado por la escena, que es quien sabe qué
   * se ha seleccionado en el viewport).
   */
  function fijarSeleccion(dato) {
    seleccionActual = dato;
    actualizarEstado();
  }

  if (lista) {
    lista.addEventListener('click', (e) => {
      const boton = e.target.closest('.editor-fila-boton');
      if (!boton) return;
      seleccionarFila(boton);
    });

    // Navegación con flechas y Enter, como en el árbol de un editor.
    lista.addEventListener('keydown', (e) => {
      const visibles = filasVisibles.length ? filasVisibles : recogerVisibles();
      if (!visibles.length) return;
      const actual = document.activeElement;
      let indice = visibles.indexOf(actual);
      if (indice < 0) indice = 0;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        visibles[Math.min(visibles.length - 1, indice + 1)]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        visibles[Math.max(0, indice - 1)]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (actual?.dataset?.archivo) {
          seleccionarFila(actual);
          if (alEncuadrar) alEncuadrar(actual.dataset.archivo);
        }
      }
    });
  }

  /* --- Inspector ----------------------------------------------------------- */

  /**
   * Rellena el inspector con la ficha del asset seleccionado.
   *
   * Las fichas de todos los assets ya están en el HTML (para el fallback sin
   * JavaScript). Con JavaScript, sólo se muestra la del asset seleccionado:
   * se ocultan las demás y se marca la activa.
   */
  function rellenarInspector(dato) {
    if (!inspector) return;

    const vacio = inspector.querySelector('.inspector-vacio');

    if (!dato) {
      for (const f of inspector.querySelectorAll('.ficha')) {
        f.classList.remove('inspector-activa');
      }
      if (vacio) vacio.hidden = false;
      return;
    }

    let fichaEl = inspector.querySelector(`.ficha[data-archivo="${dato.id}"]`);

    // Si el HTML estático no traía la ficha, se genera aquí. En el build
    // normal siempre está: esto es sólo una red de seguridad.
    if (!fichaEl) {
      fichaEl = document.createElement('div');
      fichaEl.className = 'ficha';
      fichaEl.dataset.archivo = dato.id;
      fichaEl.innerHTML = ficha(dato);
      inspector.appendChild(fichaEl);
    }

    for (const f of inspector.querySelectorAll('.ficha')) {
      f.classList.toggle('inspector-activa', f === fichaEl);
    }

    if (vacio) vacio.hidden = true;
  }

  /* --- Barra de estado ----------------------------------------------------- */

  /** El asset que está seleccionado ahora mismo. */
  let seleccionActual = null;

  function actualizarEstado(modo) {
    if (modoEstado) {
      modoEstado.textContent = modo ?? 'Navegar';
    }
    if (seleccionEstado) {
      const nombre = seleccionActual?.nombre ?? '—';
      seleccionEstado.textContent = nombre;
    }
  }

  /**
   * Marca el editor como vivo: la escena ha arrancado y el inspector pasa a
   * mostrar una sola ficha (la seleccionada) en vez de todas.
   *
   * Es lo que distingue "con JavaScript" de "sin JavaScript": sin esta
   * marca, las fichas se apilan y la web es el portfolio entero.
   */
  function marcarVivo() {
    const contenedor = document.getElementById('editor');
    if (contenedor) {
      contenedor.dataset.editorVivo = 'true';
    }
  }

  /* --- Ayuda de atajos ----------------------------------------------------- */

  function abrirAyuda(abrir) {
    if (!ayuda) return;
    ayuda.hidden = !abrir;
    if (botonAyuda) botonAyuda.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    if (abrir) {
      ayuda.querySelector('button')?.focus();
    }
  }

  if (botonAyuda) {
    botonAyuda.addEventListener('click', () => {
      abrirAyuda(ayuda.hidden);
    });
  }

  if (ayuda) {
    ayuda.addEventListener('click', (e) => {
      if (e.target === ayuda || e.target.dataset.cerrar !== undefined) {
        abrirAyuda(false);
      }
    });
    ayuda.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        abrirAyuda(false);
        botonAyuda?.focus();
      }
    });
  }

  /* --- Atajos globales ----------------------------------------------------- */

  function alTecla(evento) {
    const objetivo = evento.target;
    const escribiendo =
      objetivo &&
      (objetivo.tagName === 'INPUT' ||
        objetivo.tagName === 'TEXTAREA' ||
        objetivo.isContentEditable);
    if (escribiendo) return;

    if (evento.key === '/') {
      evento.preventDefault();
      buscador?.focus();
      buscador?.select();
      return;
    }

    if (evento.key === '?') {
      evento.preventDefault();
      abrirAyuda(ayuda?.hidden ?? false);
      return;
    }

    if (evento.key === 'Escape' && !ayuda?.hidden) {
      abrirAyuda(false);
    }
  }

  document.addEventListener('keydown', alTecla);

  /* --- Deep links ---------------------------------------------------------- */

  /**
   * Lee el hash de la URL y devuelve el id del asset al que apunta.
   * @returns {string|null}
   */
  function leerHash() {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!hash) return null;
    const valido = [INTRO.id, ...TODOS.map((d) => d.id)].includes(hash);
    return valido ? hash : null;
  }

  /** Escribe el hash sin provocar un salto en la página. */
  function escribirHash(id) {
    if (!id) {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return;
    }
    const nuevo = `#/${id}`;
    if (window.location.hash !== nuevo) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + nuevo);
    }
  }

  /* --- API pública --------------------------------------------------------- */

  return {
    nodos,
    filtrar,
    marcarSeleccion,
    rellenarInspector,
    actualizarEstado,
    fijarSeleccion,
    marcarVivo,
    abrirAyuda,
    leerHash,
    escribirHash,
    /** Todas las filas de la jerarquía, en orden. */
    filas() {
      return [...(lista?.querySelectorAll('.editor-fila-boton') ?? [])];
    },
    dispose() {
      document.removeEventListener('keydown', alTecla);
    },
  };
}
