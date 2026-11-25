/**
 * Genera el HTML estático a partir de los datos.
 *
 * El HTML es el artefacto principal de esta web: es lo que lee el recruiter con
 * el portátil corporativo bloqueado, sin JavaScript y sin WebGL. Este script
 * existe sólo para que el HTML y el fichero de datos no se separen.
 *
 * Ejecutar: `npm run build` (lo invoca Vite antes de empaquetar) o
 * `node scripts/build-html.mjs` a mano.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = resolve(RAIZ, 'index.html');

const { PROYECTOS, TRABAJO, ETAPAS, INTRO, ARQUETIPOS, colorDe } = await import(
  resolve(RAIZ, 'src/data/projects.js')
);

/** Todos los assets del editor, en el orden de la jerarquía. */
const TODOS_HTML = [...PROYECTOS, ...TRABAJO];

/** Escapa texto para insertarlo en HTML. */
function esc(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escapa texto para un atributo. */
function escAttr(texto) {
  return esc(texto);
}

/** Convierte texto plano en párrafos, respetando los saltos de línea en blanco. */
function parrafos(texto) {
  return String(texto)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('\n          ');
}

/** Enlace al repositorio, si lo hay. */
function enlaces(p) {
  const salida = [];
  if (p.repo) {
    salida.push(
      `<a class="enlace-repo" href="${escAttr(p.repo)}" rel="noopener noreferrer">Código <span aria-hidden="true">↗</span><span class="visualmente-oculto"> (repositorio de ${esc(p.nombre)} en GitHub)</span></a>`
    );
  }
  if (p.url) {
    salida.push(
      `<a class="enlace-repo" href="${escAttr(p.url)}" rel="noopener noreferrer">En vivo <span aria-hidden="true">↗</span><span class="visualmente-oculto"> (demostración de ${esc(p.nombre)})</span></a>`
    );
  }
  return salida.join('\n          ');
}

/** Lista de tecnologías. */
function stack(p) {
  if (!p.stack || p.stack.length === 0) return '';
  return `<ul class="lista-stack">
            ${p.stack.map((t) => `<li>${esc(t)}</li>`).join('\n            ')}
          </ul>`;
}

/**
 * Una tarjeta de proyecto.
 *
 * La tarjeta incluye las etapas del pipeline como texto plano. Así, la
 * información de la escena 3D también está disponible sin WebGL.
 */
function tarjeta(p, etiqueta) {
  const etapas = p.etapas
    .map(
      (e) => `
            <li class="etapa">
              <span class="etapa-nombre">${esc(
                ETAPAS.find((x) => x.id === e.id)?.nombre ?? e.id
              )}</span>
              <span class="etapa-titulo">${esc(e.titulo)}</span>
              <span class="etapa-detalle">${esc(e.detalle)}</span>
            </li>`
    )
    .join('');

  return `
      <article class="tarjeta" id="${escAttr(p.id)}" data-tipo="${escAttr(
        etiqueta
      )}">
        <header class="tarjeta-cabecera">
          <h3 class="tarjeta-titulo">${esc(p.nombre)}</h3>
          ${p.anio ? `<span class="tarjeta-anio">${esc(p.anio)}</span>` : ''}
        </header>
        <p class="tarjeta-frase">${esc(p.frase)}</p>
        <div class="tarjeta-porque">
          <h4 class="subtitulo">Por qué importa</h4>
          ${parrafos(p.porQue)}
        </div>
        <details class="tarjeta-etapas">
          <summary>El camino hasta aquí (${p.etapas.length} ${
    p.etapas.length === 1 ? 'etapa' : 'etapas'
  })</summary>
          <ol class="lista-etapas">
            ${etapas}
          </ol>
        </details>
        ${stack(p)}
        ${enlaces(p)}
      </article>`;
}

/**
 * Convierte texto plano en párrafos, respetando los saltos de línea en blanco.
 * Además convierte los `**negrita**` del dataset en <strong>.
 */
function parrafosConNegrita(texto) {
  return String(texto)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
    .join('\n            ');
}

/**
 * La ficha de un asset, tal y como la pinta el inspector.
 *
 * Es la misma información que la tarjeta, pero en el formato del inspector:
 * con la etapa como etiqueta, la decisión con su coste destacada y los
 * enlaces como botones. El inspector es donde vive el contenido real.
 */
function fichaInspector(p) {
  const arquetipo = ARQUETIPOS[p.arquetipo];
  const color = colorDe(p);

  const etapas = p.etapas
    .map(
      (e) => `
              <li class="ficha-etapa${e.clave ? ' ficha-etapa-clave' : ''}">
                <span class="ficha-etapa-nombre">${esc(
                  ETAPAS.find((x) => x.id === e.id)?.nombre ?? e.id
                )}</span>
                <span class="ficha-etapa-titulo">${esc(e.titulo)}</span>
                <span class="ficha-etapa-detalle">${esc(e.detalle)}</span>
              </li>`
    )
    .join('');

  const stack = p.stack?.length
    ? `<ul class="ficha-stack">
              ${p.stack.map((t) => `<li>${esc(t)}</li>`).join('\n              ')}
            </ul>`
    : '';

  const enlaces = [];
  if (p.repo) {
    enlaces.push(
      `<a class="ficha-enlace" href="${escAttr(p.repo)}" rel="noopener noreferrer">Código <span aria-hidden="true">↗</span><span class="visualmente-oculto"> (repositorio de ${esc(p.nombre)} en GitHub)</span></a>`
    );
  }
  if (p.url) {
    enlaces.push(
      `<a class="ficha-enlace" href="${escAttr(p.url)}" rel="noopener noreferrer">En vivo <span aria-hidden="true">↗</span><span class="visualmente-oculto"> (demostración de ${esc(p.nombre)})</span></a>`
    );
  }

  const anio = p.anio ? `<span class="ficha-anio">${esc(p.anio)}</span>` : '';

  return `
            <article class="ficha" id="ficha-${escAttr(p.id)}" data-archivo="${escAttr(
              p.id
            )}" style="--color-asset: #${color.toString(16).padStart(6, '0')}">
              <header class="ficha-cabecera">
                <h3 class="ficha-titulo">${esc(p.nombre)}</h3>
                ${anio}
              </header>
              <p class="ficha-arquetipo">
                <span class="ficha-punto" aria-hidden="true"></span>${esc(
                  arquetipo?.nombre ?? 'Sin arquetipo'
                )}
              </p>
              <p class="ficha-frase">${esc(p.frase)}</p>
              <div class="ficha-porque">
                <h4 class="ficha-subtitulo">Por qué importa</h4>
                ${parrafosConNegrita(p.porQue)}
              </div>
              <div class="ficha-etapas">
                <h4 class="ficha-subtitulo">El camino hasta aquí</h4>
                <ol class="ficha-lista-etapas">
                  ${etapas}
                </ol>
              </div>
              ${stack}
              <div class="ficha-enlaces">
                ${enlaces.join('\n                ')}
              </div>
            </article>`;
}

/**
 * Una fila de la jerarquía lateral.
 *
 * En el editor es un botón: al pulsarlo se selecciona el asset, se vuela la
 * cámara hasta su representación 3D y se llena el inspector.
 */
function filaJerarquia(p, etiquetaGrupo) {
  const color = colorDe(p);
  return `
              <li class="editor-fila">
                <button type="button" class="editor-fila-boton" data-archivo="${escAttr(
                  p.id
                )}" aria-selected="false" aria-controls="ficha-${escAttr(p.id)}">
                  <span class="editor-fila-punto" aria-hidden="true" style="--color-asset: #${color
                    .toString(16)
                    .padStart(6, '0')}"></span>
                  <span class="editor-fila-texto">${esc(p.nombre)}</span>
                </button>
              </li>`;
}

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Alejandro Huerta — Ingeniero senior de plataforma, WebGL e IA aplicada</title>
  <meta name="description" content="Ingeniero senior en Madrid (remoto en la UE). Ocho años en la capa de servicios y APIs de una plataforma con ~200M de usuarios mensuales, dueño de partes del runtime WebGL y del editor de autoría 3D, y desde 2025 leader de la línea de IA conversacional en producción.">
  <meta name="author" content="Alejandro Huerta">
  <meta name="color-scheme" content="dark light">
  <meta property="og:title" content="Alejandro Huerta — Ingeniero senior de plataforma, WebGL e IA aplicada">
  <meta property="og:description" content="APIs a escala, runtime WebGL en tiempo real e IA conversacional en producción. Madrid, remoto en la UE.">
  <meta property="og:type" content="profile">
  <meta property="og:locale" content="es_ES">
  <meta property="profile:first_name" content="Alejandro">
  <meta property="profile:last_name" content="Huerta">
  <link rel="canonical" href="https://metalozaru.es/">

  <!-- Sin fuentes externas, sin trackers, sin cookies. -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230d1117'/%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='30' font-weight='700' fill='%2350e3c2'%3EAH%3C/text%3E%3C/svg%3E">
  <link rel="stylesheet" href="/src/styles.css">
  <link rel="stylesheet" href="/src/editor.css">
  <link rel="preload" href="/cv/Alejandro-Huerta-CV.pdf" as="fetch" crossorigin="anonymous">
</head>
<body>
  <a class="saltar-al-contenido" href="#contenido">Saltar al contenido</a>

  <header class="cabecera">
    <div class="cabecera-interior">
      <p class="marca">
        <span class="marca-inicial" aria-hidden="true">AH</span>
        <span class="marca-nombre">Alejandro Huerta</span>
      </p>
      <nav class="navegacion" aria-label="Principal">
        <ul>
          <li><a href="#presentacion">Presentación</a></li>
          <li><a href="#trayectoria">Trayectoria</a></li>
          <li><a href="#proyectos">Proyectos</a></li>
          <li><a href="#contacto">Contacto</a></li>
          <li><a class="boton-cv" href="/cv/Alejandro-Huerta-CV.pdf" download>CV (PDF)</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="contenido">

    <!-- ============ Portada ============ -->
    <section class="portada" id="presentacion">
      <div class="portada-texto">
        <h1 class="portada-titular">Ingeniero senior de plataforma, WebGL e IA aplicada</h1>
        <p class="portada-resumen">
          Ocho años construyendo la capa de servicios y APIs de una plataforma viva de
          <strong>~200 millones de usuarios mensuales</strong>, dueño de partes del
          runtime WebGL y del editor de autoría 3D que la alimenta, y desde 2025
          responsable de la línea de IA conversacional en producción. Antes de programar,
          diez años de IBM security y pre-sales: por eso diseño para quien tiene que
          <em>operar</em> lo que entrego.
        </p>
        <div class="portada-datos">
          <dl>
            <div>
              <dt>Dónde</dt>
              <dd>Madrid, España · Remoto en la UE</dd>
            </div>
            <div>
              <dt>Desde 2025</dt>
              <dd>Liderando IA conversacional: NPCs y mentores de voz en producción</dd>
            </div>
            <div>
              <dt>Contacto</dt>
              <dd>
                <a href="mailto:ahuertam@yahoo.es">ahuertam@yahoo.es</a>
                · <a href="tel:+34687121948">+34 687 121 948</a>
              </dd>
            </div>
          </dl>
        </div>
        <p class="portada-acciones">
          <a class="boton boton-principal" href="/cv/Alejandro-Huerta-CV.pdf" download>Descargar CV (PDF)</a>
          <a class="boton" href="https://github.com/ahuertam" rel="noopener noreferrer">GitHub</a>
          <a class="boton" href="https://linkedin.com/in/alejandrohuertaengineer" rel="noopener noreferrer">LinkedIn</a>
        </p>
      </div>

      <!--
        ==========================================================
        EL EDITOR — concepto activo de la capa interactiva.

        Los paneles son HTML de verdad: la jerarquía, el inspector,
        la barra de estado y la ayuda de atajos son DOM con CSS.
        Sólo el viewport es WebGL.

        Sin JavaScript y sin WebGL, los paneles se apilan en vertical
        y el inspector muestra todas las fichas: sigue siendo el
        portfolio entero.
        ==========================================================
      -->
      <div class="editor" id="editor">

        <!-- ============ Jerarquía (panel izquierdo) ============ -->
        <div class="editor-panel editor-panel-izquierda" id="editor-jerarquia">
          <div class="editor-panel-cabecera">
            <h2 class="editor-panel-titulo">Jerarquía</h2>
          </div>

          <div class="editor-buscar">
            <label class="visualmente-oculto" for="editor-buscar">Buscar en la jerarquía</label>
            <input
              type="search"
              id="editor-buscar"
              class="editor-buscar-campo"
              placeholder="Buscar…  ( / )"
              autocomplete="off"
              spellcheck="false"
              aria-describedby="editor-buscar-ayuda"
            >
            <p class="editor-buscar-ayuda" id="editor-buscar-ayuda">
              Escribe para filtrar. <kbd>/</kbd> enfoca el campo.
            </p>
          </div>

          <nav class="editor-jerarquia" aria-label="Jerarquía de assets">
            <ul class="editor-jerarquia-lista" id="editor-jerarquia-lista">

              <!-- El README de la intro, primero -->
              <li class="editor-fila">
                <button type="button" class="editor-fila-boton" data-archivo="intro" aria-selected="false" aria-controls="ficha-intro">
                  <span class="editor-fila-punto" aria-hidden="true" style="--color-asset: #${colorDe(INTRO).toString(16).padStart(6, '0')}"></span>
                  <span class="editor-fila-texto">${esc(INTRO.nombre)}</span>
                </button>
              </li>

              <!-- Proyectos agrupados por tipo -->
              <li class="editor-grupo">
                <p class="editor-grupo-titulo">Proyectos propios (${PROYECTOS.length})</p>
                <ul class="editor-grupo-lista">
${PROYECTOS.map((p) => filaJerarquia(p)).join('\n')}
                </ul>
              </li>

              <li class="editor-grupo">
                <p class="editor-grupo-titulo">Trayectoria profesional (${TRABAJO.length})</p>
                <ul class="editor-grupo-lista">
${TRABAJO.map((p) => filaJerarquia(p)).join('\n')}
                </ul>
              </li>
            </ul>
          </nav>
        </div>

        <!-- ============ Viewport ============ -->
        <div class="editor-viewport">
          <div id="escena" class="escena" aria-hidden="true">
            <canvas id="lienzo-3d"></canvas>
          </div>
          <div
            class="editor-grafo"
            id="editor-grafo"
            role="application"
            tabindex="0"
            aria-label="Grafo de proyectos. Usa las flechas para moverte entre nodos y Enter para ver la ficha."
          ></div>
          <div id="escena-estado" class="escena-estado" role="status"></div>

          <!--
            El contenido textual equivalente al grafo. El grafo es una capa
            interactiva sobre este texto: sin JavaScript, esta lista es la
            que se ve.
          -->
          <div class="editor-equivalente" id="editor-equivalente">
            <h3 class="editor-equivalente-titulo">Contenido del grafo</h3>
            <p>
              El grafo coloca cada proyecto en un nodo y une los que se
              relacionan. La información completa de cada uno está en la
              jerarquía de la izquierda y en el inspector de la derecha.
            </p>
            <ul class="editor-equivalente-lista">
              <li><a href="#ficha-intro">${esc(INTRO.nombre)}</a> — ${esc(INTRO.frase)}</li>
${TODOS_HTML.map((p) => `              <li><a href="#ficha-${escAttr(p.id)}">${esc(p.nombre)}</a> — ${esc(p.frase)}</li>`).join('\n')}
            </ul>
          </div>
        </div>

        <!-- ============ Inspector (panel derecho) ============ -->
        <div class="editor-panel editor-panel-derecha" id="editor-inspector-panel">
          <div class="editor-panel-cabecera">
            <h2 class="editor-panel-titulo">Inspector</h2>
          </div>
          <div class="editor-inspector" id="editor-inspector">
            <p class="inspector-vacio">
              Selecciona un asset en la jerarquía o en el viewport para ver su
              ficha: la decisión que lo define y su coste.
            </p>
${[INTRO, ...PROYECTOS, ...TRABAJO].map((p) => fichaInspector(p)).join('\n')}
          </div>
        </div>

        <!-- ============ Barra de estado ============ -->
        <div class="editor-estado" id="editor-estado">
          <p class="editor-estado-campo">
            <span class="editor-estado-etiqueta">Modo</span>
            <span class="editor-estado-valor" id="editor-estado-modo">Navegar</span>
          </p>
          <p class="editor-estado-campo">
            <span class="editor-estado-etiqueta">Selección</span>
            <span class="editor-estado-valor" id="editor-estado-seleccion">—</span>
          </p>
          <p class="editor-estado-campo editor-estado-atajos">
            <span class="editor-estado-etiqueta">Atajos</span>
            <span class="editor-estado-valor">
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> volar ·
              <kbd>F</kbd> encuadrar · <kbd>Esc</kbd> deseleccionar ·
              <kbd>/</kbd> buscar · <kbd>?</kbd> ayuda
            </span>
          </p>
          <button type="button" class="editor-ayuda-boton" id="editor-ayuda-boton" aria-expanded="false" aria-controls="editor-ayuda">
            Atajos
          </button>
        </div>
      </div>

      <!-- ============ Ayuda de atajos (overlay) ============ -->
      <div class="editor-ayuda" id="editor-ayuda" role="dialog" aria-modal="true" aria-labelledby="editor-ayuda-titulo" hidden>
        <div class="editor-ayuda-caja">
          <h2 class="editor-ayuda-titulo" id="editor-ayuda-titulo">Atajos de teclado</h2>
          <dl class="editor-ayuda-lista">
            <dt><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></dt>
            <dd>Volar por el viewport</dd>
            <dt><kbd>Q</kbd> <kbd>E</kbd></dt>
            <dd>Bajar y subir el punto de mira</dd>
            <dt><kbd>F</kbd></dt>
            <dd>Encuadrar la selección</dd>
            <dt><kbd>Esc</kbd></dt>
            <dd>Deseleccionar y volver al plano general</dd>
            <dt><kbd>/</kbd></dt>
            <dd>Buscar en la jerarquía</dd>
            <dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd></dt>
            <dd>Recorrer la jerarquía y seleccionar</dd>
            <dt><kbd>?</kbd></dt>
            <dd>Abrir y cerrar esta ayuda</dd>
          </dl>
          <p class="editor-ayuda-pie">
            Con el ratón: arrastrar para orbitar, <kbd>Shift</kbd> + arrastrar para
            desplazar, clic en un asset para seleccionarlo.
          </p>
          <button type="button" class="editor-ayuda-cerrar" data-cerrar>Cerrar</button>
        </div>
      </div>
    </section>

    <!-- ============ Trayectoria ============ -->
    <section class="seccion" id="trayectoria">
      <h2>Trayectoria</h2>
      <p class="seccion-intro">
        El resumen, en cuatro bloques. Cada uno tiene su "por qué importa", que es
        donde está la información que no se lee en un CV de una página.
      </p>

      <div class="bloques-trayectoria">
        <article class="bloque">
          <h3>El servicio de definición de juegos</h3>
          <p>
            La API contra la que se construyen todas las herramientas internas y el
            runtime de la plataforma. <strong>401 commits en siete años y sigue siendo
            la API de registro</strong>: por eso cada cambio es una decisión de
            versionado con compatibilidad hacia atrás, no un refactor. Con una base de
            ~200M de usuarios mensuales, cada decisión de contrato tiene miles de
            clientes detrás.
          </p>
        </article>

        <article class="bloque">
          <h3>IA conversacional en producción</h3>
          <p>
            NPCs y mentores de voz en tiempo real: servidor de agentes en FastAPI
            (async, streaming, WebSockets), RAG sobre Milvus, caché de voz en
            Elixir/Phoenix y agentes de test con Playwright. 752 commits en 2026, su
            año más productivo.
          </p>
          <p>
            La regla que sostiene todo esto: <strong>cada dependencia externa detrás de
            una interfaz, para que el servicio degrade en vez de caer</strong>. Cuando el
            vector store o un proveedor no están, el servicio sigue respondiendo con
            menos. En producción, degradar y caerse no son sinónimos.
          </p>
        </article>

        <article class="bloque">
          <h3>El editor de autoría 3D y el runtime WebGL</h3>
          <p>
            Developer principal del editor de autoría durante siete años
            (<strong>576 commits</strong>), con Vue 3 y Konva. En 2023 creé el
            <code>CODEOWNERS</code> del repositorio, que convirtió una barra de calidad
            de opinión en algo exigible.
          </p>
          <p>
            Del runtime WebGL (React 19, Three.js, React Three Fiber) soy dueño de
            partes: escena con undo/redo, post-procesado, light probes y navmesh,
            distribuida como librería de componentes publicada. Es la otra mitad del
            producto: el editor es el que dibuja, el runtime es el que ejecuta.
          </p>
        </article>

        <article class="bloque">
          <h3>Diez años de IBM security y pre-sales</h3>
          <p>
            Security Systems Engineer sobre DB2, Web Application Server y Tivoli Identity
            Manager, con conectores propios sobre LDAP y directorios corporativos. Luego
            formador oficial de WebSphere 7, Tivoli Storage Manager y Acronis, con el
            laboratorio de formación bajo mi responsabilidad.
          </p>
          <p>
            En 2013 formé parte del equipo de siete que recibió el mejor VAD de software
            de IBM España. Es la etapa que explica el resto: <strong>un API es un
            contrato</strong>, y quien lo opera también es usuario. Más de 1.100 pull
            requests revisados en 30+ repositorios y seis ecosistemas.
          </p>
        </article>
      </div>

      <details class="detalle-experiencia">
        <summary>Ver el experiencia completa, año a año</summary>
        <div class="linea-tiempo">
          <div class="linea-item">
            <p class="linea-periodo">2018 — hoy</p>
            <p class="linea-puesto">Full Stack Engineer · Game Strategies (Gamelearn) · Madrid (remoto)</p>
            <p class="linea-nota">Plataforma de juegos educativos 3D. Developer principal del editor de autoría (576 commits en 7 años), dueño de partes del runtime WebGL (327 commits), y desde 2025 responsable de la línea de IA conversacional (752 commits en 2026).</p>
          </div>
          <div class="linea-item">
            <p class="linea-periodo">2017 — 2018</p>
            <p class="linea-puesto">Front End Engineer · Adglow · Madrid</p>
            <p class="linea-nota">Angular 2 y 5: subida y recorte de medios, operaciones en lote, edición de presupuestos y constructores de formularios.</p>
          </div>
          <div class="linea-item">
            <p class="linea-periodo">2011 — 2017</p>
            <p class="linea-puesto">IT Channel Specialist / Business Developer · GTI Software &amp; Networking (Neovalia) · Madrid</p>
            <p class="linea-nota">Pre-sales, licencias y renovaciones del portfolio de IBM. Responsable del centro de certificación Pearson VUE de IBM España y formación técnica a partners y clientes empresariales. En 2013, parte del equipo de siete con el mejor VAD de software de IBM España.</p>
          </div>
          <div class="linea-item">
            <p class="linea-periodo">2010 — 2011</p>
            <p class="linea-puesto">Pre-Sales Systems Engineer · GTI Software &amp; Networking (Neovalia) · Madrid</p>
            <p class="linea-nota">Formador oficial de WebSphere 7, Tivoli Storage Manager y Acronis. Responsable del laboratorio de formación: montaje del entorno, material y impartición.</p>
          </div>
          <div class="linea-item">
            <p class="linea-periodo">2008 — 2010</p>
            <p class="linea-puesto">Security Systems Engineer · Morse (hoy Logicalis) · Madrid</p>
            <p class="linea-nota">Despliegues de DB2, Web Application Server y Tivoli Identity Manager; conectores propios sobre Tivoli Directory Integrator (LDAP y directorios corporativos); operaciones de seguridad.</p>
          </div>
          <div class="linea-item">
            <p class="linea-periodo">2007 — 2008</p>
            <p class="linea-puesto">Systems Engineer · Siemens · Madrid</p>
            <p class="linea-nota">Despliegue y mantenimiento de servidores Windows, monitorización de Oracle sobre SAP R3, gestión de incidencias y documentación de operaciones.</p>
          </div>
        </div>
      </details>
    </section>

    <!-- ============ Proyectos ============ -->
    <section class="seccion" id="proyectos">
      <h2>Proyectos</h2>
      <p class="seccion-intro">
        Once proyectos, cada uno con su "por qué importa". Un stack no dice por qué
        un proyecto existe; la decisión que tomó alguien al construirlo, sí. Al final
        de cada tarjeta tienes también el camino: las etapas por las que pasó, que es
        lo que la escena 3D muestra.
      </p>

      <h3 class="subtitulo-seccion">Proyectos propios</h3>
      <div class="rejilla-proyectos">
${PROYECTOS.map((p) => tarjeta(p, 'proyecto')).join('\n')}
      </div>

      <h3 class="subtitulo-seccion">Trabajo profesional</h3>
      <p class="seccion-intro seccion-intro-menor">
        Esto no es un repositorio, pero es la mayor parte del CV. Los mismos bloques,
        con el mismo criterio.
      </p>
      <div class="rejilla-proyectos">
${TRABAJO.map((p) => tarjeta(p, 'trabajo')).join('\n')}
      </div>
    </section>

    <!-- ============ Contacto ============ -->
    <section class="seccion seccion-contacto" id="contacto">
      <h2>Contacto</h2>
      <p class="seccion-intro">
        Abierto a posiciones Senior, Staff o Principal en plataforma, backend e IA
        aplicada, en remoto dentro de la UE.
      </p>
      <ul class="lista-contacto">
        <li>
          <span class="contacto-etiqueta">Correo</span>
          <a href="mailto:ahuertam@yahoo.es">ahuertam@yahoo.es</a>
        </li>
        <li>
          <span class="contacto-etiqueta">Teléfono</span>
          <a href="tel:+34687121948">+34 687 121 948</a>
        </li>
        <li>
          <span class="contacto-etiqueta">GitHub</span>
          <a href="https://github.com/ahuertam" rel="noopener noreferrer">github.com/ahuertam</a>
        </li>
        <li>
          <span class="contacto-etiqueta">LinkedIn</span>
          <a href="https://linkedin.com/in/alejandrohuertaengineer" rel="noopener noreferrer">linkedin.com/in/alejandrohuertaengineer</a>
        </li>
        <li>
          <span class="contacto-etiqueta">CV</span>
          <a href="/cv/Alejandro-Huerta-CV.pdf" download>Alejandro-Huerta-CV.pdf</a>
        </li>
      </ul>
    </section>
  </main>

  <footer class="pie">
    <p>
      Hecho por Alejandro Huerta. Sitio estático: sin cookies, sin trackers, sin
      fuentes externas que rastreen. Toda la información de esta página está en el
      HTML, también sin JavaScript y sin WebGL.
    </p>
    <p class="pie-dominio">
      <a href="https://metalozaru.es">metalozaru.es</a>
    </p>
  </footer>

  <!--
    El módulo de la escena se carga como módulo ES. Si falla la carga —sin red,
    sin JS, bloqueado por una política de empresa— el resto de la página sigue
    funcionando, porque la escena es sólo una capa encima.
  -->
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`;

await mkdir(dirname(SALIDA), { recursive: true });
await writeFile(SALIDA, html, 'utf8');
console.log(`HTML generado: ${SALIDA} (${html.length} bytes)`);
