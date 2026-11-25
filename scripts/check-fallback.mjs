/**
 * Comprobación del fallback: la web debe leerse completa sin JavaScript y sin
 * WebGL.
 *
 * Este script NO usa un navegador: comprueba el HTML estático que se genera en
 * build. Un navegador de verdad lo añade la comprobación manual del README
 * (o el `verificar-navegador.mjs`, si está disponible).
 *
 * Se ejecuta sobre `dist/index.html`, que es lo que se sirve en producción.
 *
 * Ejecutar: `npm run check`
 */

import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = resolve(RAIZ, 'dist/index.html');

let fallos = 0;
let pruebas = 0;

function comprobar(descripcion, condicion, detalle = '') {
  pruebas += 1;
  if (condicion) {
    console.log(`  OK   ${descripcion}`);
  } else {
    fallos += 1;
    console.log(`  FALLA ${descripcion}${detalle ? ` — ${detalle}` : ''}`);
  }
}

console.log('\n=== Comprobación del fallback sin JS y sin WebGL ===\n');

let html;
try {
  html = await readFile(HTML, 'utf8');
} catch {
  console.error(`No se encuentra ${HTML}. Ejecuta \`npm run build\` antes.`);
  process.exit(1);
}

console.log(`Fichero: ${HTML} (${(html.length / 1024).toFixed(1)} kB)\n`);

/* -------------------------------------------------------------------------
 * 1. El contenido está en el HTML, no se genera con JavaScript
 * ---------------------------------------------------------------------- */
console.log('Contenido estático:');

const secciones = [
  ['Cabecera con el nombre', 'Alejandro Huerta'],
  ['Titular', 'Ingeniero senior de plataforma'],
  ['Párrafo de presentación', '200 millones de usuarios mensuales'],
  ['Sección de trayectoria', 'id="trayectoria"'],
  ['Sección de proyectos', 'id="proyectos"'],
  ['Sección de contacto', 'id="contacto"'],
  ['Enlace al CV en PDF', 'cv/Alejandro-Huerta-CV.pdf'],
  ['Enlace a GitHub', 'github.com/ahuertam'],
  ['Enlace a LinkedIn', 'linkedin.com/in/alejandrohuertaengineer'],
  ['Enlace de correo', 'mailto:ahuertam@yahoo.es'],
  ['Teléfono', '+34 687 121 948'],
];

for (const [descripcion, texto] of secciones) {
  comprobar(descripcion, html.includes(texto), `falta "${texto}"`);
}

/* -------------------------------------------------------------------------
 * 2. Los once proyectos están en el HTML
 * ---------------------------------------------------------------------- */
console.log('\nProyectos en el HTML:');

const PROYECTOS = [
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
];

for (const nombre of PROYECTOS) {
  comprobar(`"${nombre}"`, html.includes(nombre));
}

/* -------------------------------------------------------------------------
 * 3. Cada proyecto tiene su "por qué importa" en texto plano
 * ---------------------------------------------------------------------- */
console.log('\nCada proyecto con su "por qué importa":');

// El concepto "El editor" pone las fichas en el inspector, y las tarjetas
// siguen en la sección de proyectos. Los dos sitios cuentan: cada asset
// tiene su "por qué importa" en la ficha del inspector y en su tarjeta.
// La intro sólo tiene ficha: no tiene tarjeta, no es un proyecto.
const { INTRO, TODOS } = await import(resolve(RAIZ, 'src/data/projects.js'));

const nPorQue = (html.match(/Por qué importa/g) || []).length;
comprobar(
  `El "por qué importa" de cada asset está en la ficha y en la tarjeta (hay ${nPorQue})`,
  nPorQue === TODOS.length * 2 + 1,
  `esperadas ${TODOS.length * 2 + 1}, encontradas ${nPorQue}`
);

/* -------------------------------------------------------------------------
 * 4. El detalle de las etapas está en el HTML (lo que muestra la escena 3D)
 * ---------------------------------------------------------------------- */
console.log('\nEtapas en texto plano:');

// Las etapas están en las tarjetas (`class="etapa"`) y en las fichas del
// inspector (`class="ficha-etapa"` o `class="ficha-etapa ficha-etapa-clave"`).
// La intro sólo tiene ficha: no tiene tarjeta, no es un proyecto.
const nEtapas = (html.match(/class="etapa"/g) || []).length;
const nEtapasFicha = (html.match(/class="ficha-etapa[ "]/g) || []).length;
const etapasTarjeta = await contarEtapasEnLosDatos();
const etapasTotal = etapasTarjeta + INTRO.etapas.length;
comprobar(
  `Detalle de etapas en las tarjetas (hay ${nEtapas}, esperados ${etapasTarjeta})`,
  nEtapas === etapasTarjeta,
  `esperados ${etapasTarjeta}, encontrados ${nEtapas}`
);
comprobar(
  `Detalle de etapas en el inspector (hay ${nEtapasFicha}, esperados ${etapasTotal})`,
  nEtapasFicha === etapasTotal,
  `esperados ${etapasTotal}, encontrados ${nEtapasFicha}`
);

for (const etapa of ['Idea', 'Prototipo', 'Plataforma', 'Operación']) {
  comprobar(`Estación "${etapa}"`, html.includes(`>${etapa}</span>`));
}

/* -------------------------------------------------------------------------
 * 5. Sin scripts inline que generen el contenido
 * ---------------------------------------------------------------------- */
console.log('\nSin JavaScript requerido para el contenido:');

const sinScript = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const largoSinScript = sinScript.length;
comprobar(
  `El HTML sin scripts conserva el contenido (${largoSinScript} bytes)`,
  largoSinScript > 40000,
  `sólo quedan ${largoSinScript} bytes sin los scripts`
);

// El texto visible (lo que un lector sin JS leería) debe contener lo esencial.
const textoVisible = sinScript
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

comprobar(
  'El texto sin JS contiene el titular',
  textoVisible.includes('Ingeniero senior de plataforma')
);
comprobar(
  'El texto sin JS contiene los 11 proyectos',
  PROYECTOS.every((p) => textoVisible.includes(p))
);
comprobar(
  'El texto sin JS contiene el enlace al CV',
  textoVisible.includes('CV (PDF)')
);
comprobar(
  'El texto sin JS contiene el correo',
  textoVisible.includes('ahuertam@yahoo.es')
);

/* -------------------------------------------------------------------------
 * 6. Accesibilidad
 * ---------------------------------------------------------------------- */
console.log('\nAccesibilidad:');

comprobar('lang="es" declarado', html.includes('<html lang="es">'));
comprobar('Enlace de salto al contenido', html.includes('saltar-al-contenido'));
comprobar('Título de la página', /<title>[^<]{10,}<\/title>/.test(html));
comprobar(
  'Meta description para buscadores',
  html.includes('name="description"')
);
comprobar('Navegación etiquetada', html.includes('aria-label="Principal"'));

// Las imágenes (etiquetas 3D) son decorativas y el canvas va con aria-hidden.
comprobar('Canvas 3D marcado como decorativo', html.includes('aria-hidden="true"'));

// Enlaces externos con noopener.
const externos = [...html.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g)].map((m) => m[0]);
const sinNoopener = externos.filter(
  (a) => !a.includes('target="_blank"') || a.includes('rel="noopener')
);
comprobar(
  `Enlaces externos con rel="noopener" (${externos.length} revisados)`,
  sinNoopener.length === externos.length,
  `${sinNoopener.length} sin noopener`
);

/* -------------------------------------------------------------------------
 * 7. Sin trackers, cookies ni recursos externos
 * ---------------------------------------------------------------------- */
console.log('\nSin trackers ni recursos externos:');

// Lo que se CARGA desde otro sitio: scripts, hojas de estilo, imágenes.
// Los enlaces <a href="https://..."> no cargan nada: son enlaces a las
// proyectos y al perfil, que es justo lo que la web tiene que ofrecer.
const recursosCargados = [
  ...[...html.matchAll(/<script\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<img\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<iframe\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]),
];

// El canonical apunta al propio dominio: no es un recurso externo.
const recursosExternos = recursosCargados.filter(
  (u) => !u.startsWith('https://metalozaru.es')
);
comprobar(
  `Ningún recurso cargado desde otro dominio (${recursosCargados.length} revisados)`,
  recursosExternos.length === 0,
  recursosExternos.join(', ')
);

// Y al revés: los enlaces a GitHub/LinkedIn sí deben estar.
comprobar('Enlaces a GitHub presentes', html.includes('https://github.com/ahuertam'));
comprobar('Enlaces a LinkedIn presentes', html.includes('linkedin.com/in/alejandrohuertaengineer'));

comprobar('Sin Google Analytics', !/googletagmanager|google-analytics|gtag\(/i.test(html));
comprobar('Sin píxeles de seguimiento', !/facebook\.net|hotjar|clarity\.ms/i.test(html));
comprobar('Sin cookies', !/document\.cookie|set-cookie/i.test(html));
comprobar(
  'Sin fuentes externas (sólo system-ui)',
  !/fonts\.(googleapis|gstatic)\.com|@font-face/i.test(html)
);

/* -------------------------------------------------------------------------
 * 8. Los ficheros que la web necesita existen
 * ---------------------------------------------------------------------- */
console.log('\nFicheros en dist/:');

for (const fichero of [
  'index.html',
  'cv/Alejandro-Huerta-CV.pdf',
  'assets/index-B0ihWdnl.js',
]) {
  // El nombre del bundle JS cambia con cada build: se comprueba el patrón.
  if (fichero.includes('index-B')) {
    const assets = await readFile(resolve(RAIZ, 'dist'), 'utf8').catch(() => null);
    const { readdir } = await import('node:fs/promises');
    const lista = await readdir(resolve(RAIZ, 'dist/assets'));
    comprobar(
      'Hay un bundle JS en dist/assets/',
      lista.some((f) => f.endsWith('.js'))
    );
    break;
  }
  try {
    await access(resolve(RAIZ, 'dist', fichero));
    comprobar(`Existe ${fichero}`, true);
  } catch {
    comprobar(`Existe ${fichero}`, false, 'no encontrado');
  }
}

/* -------------------------------------------------------------------------
 * Resultado
 * ---------------------------------------------------------------------- */

/**
 * Cuenta las etapas que hay en el fichero de datos, para comprobar que el
 * HTML generado las contiene todas. Si el HTML y los datos se separan, esto
 * salta.
 */
async function contarEtapasEnLosDatos() {
  const { INTRO, TODOS } = await import(resolve(RAIZ, 'src/data/projects.js'));
  // La intro tiene etapas en su ficha, pero no tiene tarjeta de proyecto.
  return TODOS.reduce((total, p) => total + p.etapas.length, 0);
}
console.log(
  `\n=== ${pruebas - fallos}/${pruebas} comprobaciones superadas ===\n`
);

if (fallos > 0) {
  console.error(`${fallos} comprobación(es) fallida(s).\n`);
  process.exit(1);
}

console.log('El fallback sin JavaScript y sin WebGL está verificado.\n');
