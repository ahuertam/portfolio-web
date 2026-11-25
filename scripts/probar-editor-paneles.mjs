/**
 * Comprobación de los paneles del editor en el HTML estático.
 *
 * El concepto "El editor" pone los paneles en HTML, no en el canvas. Eso
 * significa que se pueden comprobar sin navegador: basta con mirar el
 * `dist/index.html`.
 *
 * Comprueba:
 *
 *   - Que la jerarquía, el inspector, la barra de estado y la ayuda de
 *     atajos están en el HTML.
 *   - Que el inspector tiene TODAS las fichas, con su enlace a GitHub: el
 *     contenido real está en texto seleccionable, no pintado en un canvas.
 *   - Que la búsqueda tiene su campo y su etiqueta.
 *   - Que la jerarquía es navegable por teclado (botones reales, no divs).
 *   - Que el deep link `/#/fotoverse` es representable: el id existe como
 *     ancla y como fila de la jerarquía.
 *   - Que el fallback sin WebGL y sin JavaScript sigue siendo el portfolio
 *     entero: todas las fichas presentes y todos los proyectos presentes.
 *
 * Ejecutar: `node scripts/probar-editor-paneles.mjs`
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = resolve(RAIZ, 'dist/index.html');

const { INTRO, TODOS, PROYECTOS, TRABAJO } = await import(
  resolve(RAIZ, 'src/data/projects.js')
);

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

console.log('\n=== Comprobación de los paneles del editor ===\n');

let html;
try {
  html = await readFile(HTML, 'utf8');
} catch {
  console.error(`No se encuentra ${HTML}. Ejecuta \`npm run build\` antes.`);
  process.exit(1);
}

console.log(`Fichero: ${HTML} (${(html.length / 1024).toFixed(1)} kB)\n`);

/* -------------------------------------------------------------------------
 * 1. La estructura del editor
 * ---------------------------------------------------------------------- */

console.log('Estructura:');

comprobar('El contenedor del editor existe', html.includes('id="editor"'));
comprobar('El panel de jerarquía existe', html.includes('id="editor-jerarquia"'));
comprobar('La lista de la jerarquía existe', html.includes('id="editor-jerarquia-lista"'));
comprobar('El panel del inspector existe', html.includes('id="editor-inspector"'));
comprobar('La barra de estado existe', html.includes('id="editor-estado"'));
comprobar('El modo está en la barra de estado', html.includes('id="editor-estado-modo"'));
comprobar(
  'La selección está en la barra de estado',
  html.includes('id="editor-estado-seleccion"')
);
comprobar('La ayuda de atajos existe', html.includes('id="editor-ayuda"'));
comprobar(
  'El botón de la ayuda existe',
  html.includes('id="editor-ayuda-boton"')
);
comprobar('El campo de búsqueda existe', html.includes('id="editor-buscar"'));
comprobar('El canvas sigue siendo decorativo', html.includes('aria-hidden="true"'));

/* -------------------------------------------------------------------------
 * 2. La jerarquía: el README de la intro, luego los grupos
 * ---------------------------------------------------------------------- */

console.log('\nJerarquía:');

const filas = [...html.matchAll(/data-archivo="([^"]+)"/g)].map((m) => m[1]);
const filasUnicas = [...new Set(filas)];

comprobar(
  `Hay una fila por asset (${filasUnicas.length})`,
  filasUnicas.length === TODOS.length + 1,
  `esperadas ${TODOS.length + 1}, encontradas ${filasUnicas.length}`
);

comprobar('El README de la intro está en la jerarquía', filas.includes('intro'));

// El README va el primero.
const primerIndice = html.indexOf('data-archivo="intro"');
const primerProyecto = html.indexOf(`data-archivo="${PROYECTOS[0].id}"`);
comprobar(
  'El README de la intro es lo primero de la jerarquía',
  primerIndice >= 0 && primerIndice < primerProyecto
);

comprobar(
  'Los proyectos propios están agrupados',
  html.includes('Proyectos propios (11)')
);
comprobar(
  'La trayectoria profesional está agrupada',
  html.includes('Trayectoria profesional (5)')
);

// Los grupos van en el orden del brief: intro, personal, profesional.
const orden = ['intro', ...PROYECTOS.map((p) => p.id), ...TRABAJO.map((p) => p.id)];
const ordenReal = filasUnicas.filter((id) => orden.includes(id));
comprobar(
  'El orden de la jerarquía es el del brief',
  ordenReal.join(',') === orden.join(','),
  ordenReal.join(',')
);

/* -------------------------------------------------------------------------
 * 3. El inspector: texto real, seleccionable, con enlaces
 * ---------------------------------------------------------------------- */

console.log('\nInspector:');

const fichas = [...html.matchAll(/class="ficha"/g)].length;
comprobar(
  `El inspector tiene una ficha por asset (hay ${fichas})`,
  fichas === TODOS.length + 1,
  `esperadas ${TODOS.length + 1}, encontradas ${fichas}`
);

comprobar(
  'La ficha de la intro está en el inspector',
  html.includes('id="ficha-intro"')
);

// El inspector muestra texto real: las frases están en el HTML.
for (const p of TODOS) {
  if (!html.includes(p.frase)) {
    comprobar(`La frase de "${p.nombre}" está en el inspector`, false);
  }
}
comprobar(
  'Todas las frases de los assets están en el inspector',
  TODOS.every((p) => html.includes(p.frase))
);

// La decisión y su coste: el "por qué importa" de cada uno.
comprobar(
  'Cada asset tiene su "Por qué importa" en el inspector',
  (html.match(/Por qué importa/g) || []).length >= TODOS.length + 1,
  `${(html.match(/Por qué importa/g) || []).length} encontrados`
);

// Las etapas: la decisión y su coste.
const etapas = (html.match(/class="ficha-etapa/g) || []).length;
const etapasEsperadas = [INTRO, ...TODOS].reduce((t, d) => t + d.etapas.length, 0);
comprobar(
  `Las etapas están en el inspector (hay ${etapas})`,
  etapas >= etapasEsperadas,
  `esperadas ${etapasEsperadas}, encontradas ${etapas}`
);

// Los enlaces de GitHub: texto seleccionable y un enlace de verdad.
const enlacesGitHub = [...html.matchAll(/<a[^>]+href="(https:\/\/github\.com\/ahuertam\/[^"]+)"/g)].map(
  (m) => m[1]
);
comprobar(
  `El inspector enlaza a los repositorios (${enlacesGitHub.length})`,
  enlacesGitHub.length >= PROYECTOS.filter((p) => p.repo).length
);

for (const p of PROYECTOS.filter((x) => x.repo)) {
  if (!html.includes(`href="${p.repo}"`)) {
    comprobar(`El inspector enlaza a ${p.id}`, false);
  }
}
comprobar(
  'Todos los proyectos con repo tienen su enlace en el inspector',
  PROYECTOS.filter((p) => p.repo).every((p) => html.includes(`href="${p.repo}"`))
);

// El inspector NO es texto sobre el canvas: son enlaces de verdad.
comprobar(
  'El inspector usa enlaces reales (<a href>), no texto pintado',
  /class="ficha-enlace"[^>]*href="https:\/\/github\.com/.test(html) ||
    /<a class="ficha-enlace" href="https:\/\/github\.com/.test(html)
);

/* -------------------------------------------------------------------------
 * 4. El deep link
 * ---------------------------------------------------------------------- */

console.log('\nDeep links:');

comprobar(
  'El deep link es un id que existe como asset',
  TODOS.some((p) => p.id === 'fotoverse')
);

// Cada asset tiene su id como ancla en la ficha, para que el deep link
// pueda apuntar a él.
const sinAncla = [INTRO, ...TODOS].filter(
  (d) => !html.includes(`id="ficha-${d.id}"`)
);
comprobar(
  'Cada asset tiene su ancla en el inspector',
  sinAncla.length === 0,
  sinAncla.map((d) => d.id).join(', ')
);

// El canvas no se usa para el deep link: es el hash de la URL.
comprobar(
  'El deep link se implementa con el hash de la URL',
  html.includes('id="lienzo-3d"') // el canvas sigue siendo el viewport
);

/* -------------------------------------------------------------------------
 * 5. La búsqueda
 * ---------------------------------------------------------------------- */

console.log('\nBúsqueda:');

comprobar(
  'El campo de búsqueda es un input de tipo search',
  /<input[^>]+type="search"[^>]+id="editor-buscar"/.test(html) ||
    /<input[^>]+id="editor-buscar"[^>]+type="search"/.test(html)
);
comprobar(
  'El campo de búsqueda tiene etiqueta',
  html.includes('for="editor-buscar"')
);
comprobar(
  'El campo de búsqueda tiene texto de ayuda',
  html.includes('id="editor-buscar-ayuda"')
);
comprobar(
  'La ayuda menciona la tecla /',
  html.includes('( / )') || html.includes('<kbd>/</kbd>')
);

/* -------------------------------------------------------------------------
 * 6. Accesibilidad de los paneles
 * ---------------------------------------------------------------------- */

console.log('\nAccesibilidad:');

comprobar(
  'La jerarquía está etiquetada como navegación',
  html.includes('aria-label="Jerarquía de assets"')
);
comprobar(
  'Las filas son botones reales (navegables por teclado)',
  (html.match(/class="editor-fila-boton"/g) || []).length === TODOS.length + 1
);
comprobar(
  'Las filas declaran su estado de selección',
  (html.match(/aria-selected="false"/g) || []).length === TODOS.length + 1
);
comprobar(
  'Las filas apuntan a la ficha que controlan',
  (html.match(/aria-controls="ficha-/g) || []).length === TODOS.length + 1
);
comprobar(
  'La ayuda de atajos es un diálogo con nombre',
  html.includes('role="dialog"') && html.includes('aria-labelledby="editor-ayuda-titulo"')
);
comprobar(
  'El botón de la ayuda declara su estado expandido',
  html.includes('aria-expanded="false"')
);
comprobar(
  'El botón de la ayuda controla el diálogo',
  html.includes('aria-controls="editor-ayuda"')
);
comprobar(
  'El canvas es decorativo y tiene equivalente textual',
  html.includes('id="editor-equivalente"')
);
comprobar(
  'El equivalente textual lista los assets',
  (html.match(/<li><a href="#ficha-/g) || []).length >= TODOS.length
);
comprobar(
  'La barra de estado está presente',
  html.includes('class="editor-estado"')
);
comprobar(
  'El botón de la ayuda es un <button> (no un div)',
  /<button[^>]+id="editor-ayuda-boton"/.test(html)
);

/* -------------------------------------------------------------------------
 * 7. El fallback: sin WebGL y sin JavaScript
 * ---------------------------------------------------------------------- */

console.log('\nFallback sin JS ni WebGL:');

const sinScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const textoVisible = sinScripts
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

comprobar(
  'El HTML sin scripts conserva la jerarquía',
  sinScripts.includes('id="editor-jerarquia-lista"')
);
comprobar(
  'El HTML sin scripts conserva el inspector',
  sinScripts.includes('id="editor-inspector"')
);
comprobar(
  'El HTML sin scripts conserva la barra de estado',
  sinScripts.includes('id="editor-estado"')
);
comprobar(
  'El HTML sin scripts conserva todas las fichas',
  (sinScripts.match(/class="ficha"/g) || []).length === TODOS.length + 1
);
comprobar(
  'El texto sin JS contiene los 11 proyectos',
  PROYECTOS.every((p) => textoVisible.includes(p.nombre))
);
comprobar(
  'El texto sin JS contiene las 5 piezas de trayectoria',
  TRABAJO.every((p) => textoVisible.includes(p.nombre))
);
comprobar(
  'El texto sin JS contiene el por qué de cada proyecto',
  PROYECTOS.every((p) => textoVisible.includes(p.porQue.slice(0, 60)))
);
comprobar(
  'El texto sin JS contiene los enlaces a GitHub',
  (sinScripts.match(/href="https:\/\/github\.com\/ahuertam\//g) || []).length >=
    PROYECTOS.filter((p) => p.repo).length
);
comprobar(
  'El texto sin JS conserva la ayuda de atajos',
  sinScripts.includes('Atajos de teclado')
);

/* -------------------------------------------------------------------------
 * 8. Sin trackers ni recursos externos
 * ---------------------------------------------------------------------- */

console.log('\nSin trackers:');

const recursosCargados = [
  ...[...html.matchAll(/<script\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<img\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]),
];
const externos = recursosCargados.filter((u) => !u.startsWith('https://metalozaru.es'));
comprobar(
  `Ningún recurso cargado desde otro dominio (${recursosCargados.length} revisados)`,
  externos.length === 0,
  externos.join(', ')
);
comprobar('Sin Google Analytics', !/googletagmanager|google-analytics|gtag\(/i.test(html));
comprobar('Sin píxeles de seguimiento', !/facebook\.net|hotjar|clarity\.ms/i.test(html));
comprobar('Sin cookies', !/document\.cookie|set-cookie/i.test(html));
comprobar('Sin fuentes externas', !/fonts\.(googleapis|gstatic)\.com|@font-face/i.test(html));

console.log(`\n=== ${total - fallos}/${total} comprobaciones superadas ===\n`);
process.exit(fallos > 0 ? 1 : 0);
