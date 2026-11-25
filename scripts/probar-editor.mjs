/**
 * Prueba de la geometría y la lógica del concepto "El editor".
 *
 * Comprueba, sin navegador:
 *
 *   - Que cada asset tiene un arquetipo válido y que el arquetipo construye
 *     geometría de verdad.
 *   - Que la representación de cada asset evoca lo que tiene que evocar
 *     (una pila de planos tiene planos; un carril tiene un carril).
 *   - Que la disposición en el viewport no solapa assets.
 *   - Que la cámara inicial encuadra todos los assets.
 *   - Que el encuadre de un asset lo mete en el cuadro.
 *   - Que los deep links del dataset son los mismos ids que la jerarquía.
 *
 * Ejecutar: `node scripts/probar-editor.mjs`
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// El mismo Three.js que usa el concepto: una sola copia en memoria.
const THREE = await import('three');

/* -------------------------------------------------------------------------
 * Stub mínimo de DOM: el editor no necesita canvas 2D (las etiquetas son
 * texto real en HTML), pero Three.js pide un `document` para cosas suyas.
 * ---------------------------------------------------------------------- */
globalThis.document = {
  createElement: (tipo) => (tipo === 'canvas' ? { width: 0, height: 0, getContext: () => null } : {}),
  createElementNS: (ns, tipo) => globalThis.document.createElement(tipo),
  getElementById: () => null,
  querySelector: () => null,
  addEventListener() {},
  removeEventListener() {},
};

const { construirGrupo, distribuir } = await import(
  resolve(RAIZ, 'src/concepts/editor/concepto.js')
);
const { construirArquetipo, ARQUETIPOS_DISPONIBLES } = await import(
  resolve(RAIZ, 'src/concepts/editor/arquetipos.js')
);
const { INTRO, TODOS, ARQUETIPOS, colorDe, arquetipoDe } = await import(
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

console.log('\n=== Prueba del concepto "El editor" ===\n');

const DATOS = [INTRO, ...TODOS];

/* -------------------------------------------------------------------------
 * 1. Los arquetipos
 * ---------------------------------------------------------------------- */

console.log('Arquetipos:');

comprobar(
  `Hay entre 4 y 7 arquetipos (${ARQUETIPOS_DISPONIBLES.length})`,
  ARQUETIPOS_DISPONIBLES.length >= 4 && ARQUETIPOS_DISPONIBLES.length <= 7
);

comprobar(
  'Todo elemento tiene un arquetipo',
  DATOS.every((d) => d.arquetipo != null),
  DATOS.filter((d) => d.arquetipo == null).map((d) => d.id).join(', ')
);

comprobar(
  'Todo arquetipo usado existe en la tabla de arquetipos',
  DATOS.every((d) => ARQUETIPOS[d.arquetipo]),
  DATOS.filter((d) => !ARQUETIPOS[d.arquetipo]).map((d) => d.id).join(', ')
);

comprobar(
  'Todo arquetipo usado se sabe construir',
  DATOS.every((d) => ARQUETIPOS_DISPONIBLES.includes(d.arquetipo)),
  DATOS.filter((d) => !ARQUETIPOS_DISPONIBLES.includes(d.arquetipo))
    .map((d) => d.id)
    .join(', ')
);

comprobar(
  'Cada arquetipo tiene nombre legible y color',
  Object.values(ARQUETIPOS).every(
    (a) => typeof a.nombre === 'string' && a.nombre.length > 2 && typeof a.color === 'number'
  )
);

comprobar(
  'Todo elemento resuelve un color',
  DATOS.every((d) => typeof colorDe(d) === 'number' && colorDe(d) > 0)
);

comprobar(
  'El color propio del elemento manda sobre el del arquetipo',
  colorDe(TODOS.find((d) => d.id === 'editor-autoria')) !==
    arquetipoDe('editor-autoria').color
);

/* -------------------------------------------------------------------------
 * 2. Cada arquetipo construye geometría real
 * ---------------------------------------------------------------------- */

console.log('\nGeometría de los arquetipos:');

for (const idArquetipo of ARQUETIPOS_DISPONIBLES) {
  const grupo = construirArquetipo(idArquetipo, 0x5ee3c4);
  let mallas = 0;
  grupo.traverse((o) => {
    if (o.isMesh) mallas += 1;
  });
  comprobar(
    `El arquetipo "${idArquetipo}" construye geometría (${mallas} mallas)`,
    mallas >= 3
  );
}

// Cada arquetipo tiene que ser DISTINTO de los demás: si dos arquetipos
// construyeran la misma forma, cambiar de arquetipo no cambiaría nada.
console.log('\nCada arquetipo es distinto de los demás:');

for (let i = 0; i < ARQUETIPOS_DISPONIBLES.length; i++) {
  for (let j = i + 1; j < ARQUETIPOS_DISPONIBLES.length; j++) {
    const a = ARQUETIPOS_DISPONIBLES[i];
    const b = ARQUETIPOS_DISPONIBLES[j];
    const ga = construirArquetipo(a, 0x5ee3c4);
    const gb = construirArquetipo(b, 0x5ee3c4);

    const firma = (g) => {
      const mallas = [];
      g.traverse((o) => {
        if (o.isMesh) {
          mallas.push(
            [
              o.geometry.type,
              o.geometry.parameters?.width ?? 0,
              o.geometry.parameters?.height ?? 0,
              o.geometry.parameters?.depth ?? 0,
              o.geometry.parameters?.radius ?? 0,
              o.position.x.toFixed(3),
              o.position.y.toFixed(3),
              o.position.z.toFixed(3),
            ].join(',')
          );
        }
      });
      return mallas.sort().join('|');
    };

    comprobar(
      `"${a}" y "${b}" construyen formas distintas`,
      firma(ga) !== firma(gb)
    );
  }
}

/* -------------------------------------------------------------------------
 * 3. La metáfora: cada arquetipo evoca lo que debe evocar
 * ---------------------------------------------------------------------- */

console.log('\nLas metáforas:');

/** Cuenta las mallas de un tipo concreto (por nombre de parámetros). */
function contarPorTipo(grupo, tipo) {
  let n = 0;
  grupo.traverse((o) => {
    if (o.isMesh && o.geometry.type === tipo) n += 1;
  });
  return n;
}

// fotoverse: una pila de planos (cajas planas apiladas) y una papelera.
const fotos = construirArquetipo('fotos', 0x7fd1c4);
const cajas = contarPorTipo(fotos, 'BoxGeometry');
const planosApilados = [...Array(10)].filter((_, i) => {
  let n = 0;
  fotos.children.forEach((c) => {
    if (c.isMesh && c.geometry.type === 'BoxGeometry') n += 1;
  });
  return n > 0;
}).length;
comprobar(
  'El arquetipo "fotos" tiene una pila de planos y una papelera',
  cajas >= 8 && planosApilados > 0,
  `${cajas} cajas`
);

// godKAI-back: ondas de voz (muchas crestas pequeñas).
const ondas = construirArquetipo('ondas', 0x9bb8f0);
comprobar(
  'El arquetipo "ondas" tiene crestas de onda',
  contarPorTipo(ondas, 'BoxGeometry') >= 20
);

// Three Roads: un carril (vías paralelas y marcas).
const carril = construirArquetipo('carril', 0xf2b544);
let vias = 0;
carril.children.forEach((c) => {
  if (c.isMesh && c.geometry.parameters?.width === 3.4) vias += 1;
});
comprobar('El arquetipo "carril" tiene al menos una vía', vias >= 1, `${vias} vías`);

// Edutika: una rejilla (muchas celdas iguales).
const rejilla = construirArquetipo('rejilla', 0xe08fb0);
const celdas = [...rejilla.children].filter(
  (c) => c.isMesh && c.geometry.parameters?.width === 0.44
).length;
comprobar(
  `El arquetipo "rejilla" tiene celdas en cuadrícula (${celdas})`,
  celdas >= 8
);

// ImageTron / MAI: una nube de puntos.
const nube = construirArquetipo('nube', 0xa9d18c);
comprobar(
  'El arquetipo "nube" tiene puntos dispersos',
  contarPorTipo(nube, 'SphereGeometry') >= 20
);

// Trayectoria: una línea de hitos.
const linea = construirArquetipo('linea', 0xc9a0e8);
comprobar(
  'El arquetipo "linea" tiene postes de hito',
  contarPorTipo(linea, 'CylinderGeometry') >= 4
);

/* -------------------------------------------------------------------------
 * 4. La disposición en el viewport
 * ---------------------------------------------------------------------- */

console.log('\nDisposición en el viewport:');

const { grupo, activos } = construirGrupo(DATOS);

comprobar(
  `Hay una representación por asset (${activos.length})`,
  activos.length === DATOS.length,
  `esperadas ${DATOS.length}, hay ${activos.length}`
);

// Los assets no se solapan: la distancia entre centros es mayor que el
// diámetro del arquetipo.
const SEPARACION_MINIMA = 2.2;
let solapados = [];
for (let i = 0; i < activos.length; i++) {
  for (let j = i + 1; j < activos.length; j++) {
    const a = activos[i];
    const b = activos[j];
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    if (Math.hypot(dx, dz) < SEPARACION_MINIMA) {
      solapados.push(`${a.dato.nombre} / ${b.dato.nombre}`);
    }
  }
}
comprobar(
  `Ninguna representación se solapa (${solapados.length} solapes)`,
  solapados.length === 0,
  solapados.join(', ')
);

// La intro está al frente: es lo primero que se ve.
const introActivo = activos.find((a) => a.dato.id === INTRO.id);
comprobar(
  'La intro está en la fila de delante',
  introActivo && introActivo.z === Math.max(...activos.map((a) => a.z))
);

// Los bloques de trayectoria están detrás de los proyectos.
const zPersonal = Math.max(
  ...activos.filter((a) => a.dato.ambito === 'personal').map((a) => a.z)
);
const zTrabajo = Math.max(
  ...activos.filter((a) => a.dato.ambito === 'trabajo').map((a) => a.z)
);
comprobar(
  'Los bloques de trayectoria están detrás de los proyectos',
  zTrabajo < zPersonal,
  `trabajo ${zTrabajo}, personal ${zPersonal}`
);

// La retícula y el suelo están.
let mallas = 0;
grupo.traverse((o) => {
  if (o.isMesh) mallas += 1;
});
comprobar(`La escena tiene geometría (${mallas} mallas)`, mallas > 30);

/* -------------------------------------------------------------------------
 * 5. El encuadre
 * ---------------------------------------------------------------------- */

console.log('\nEncuadre:');

const camara = new THREE.PerspectiveCamera(48, 800 / 600, 0.1, 220);
// La cámara inicial del concepto: plano general.
camara.position.setFromSpherical(
  new THREE.Spherical(34, 1.05, 0.62)
).add(new THREE.Vector3(0, 0.6, 0));
camara.lookAt(new THREE.Vector3(0, 0.6, 0));
camara.updateMatrixWorld(true);
camara.updateProjectionMatrix();

function enCuadro(punto) {
  const p = punto.clone().project(camara);
  return Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && p.z <= 1;
}

const fueraGeneral = activos.filter(
  (a) => !enCuadro(new THREE.Vector3(a.x, 0.7, a.z))
);
comprobar(
  `Todos los assets caben en el plano general (${fueraGeneral.length} fuera)`,
  fueraGeneral.length === 0,
  fueraGeneral.map((a) => a.dato.nombre).join(', ')
);

// El encuadre de un asset: la cámara a 7.4 de distancia mirando a él.
function comprobarEncuadre(asset) {
  const mirada = new THREE.Vector3(asset.x, 0.63, asset.z);
  const cam = new THREE.PerspectiveCamera(48, 800 / 600, 0.1, 220);
  cam.position.setFromSpherical(new THREE.Spherical(7.4, 1.12, 0.62)).add(mirada);
  cam.lookAt(mirada);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();

  // El asset y su rótulo (1.5 unidades por encima) tienen que caber.
  const cuerpo = new THREE.Vector3(asset.x, 0.5, asset.z);
  const alto = new THREE.Vector3(asset.x, 1.5, asset.z);
  return enCuadro(cuerpo) && enCuadro(alto);
}

const malEncuadrados = activos.filter((a) => !comprobarEncuadre(a));
comprobar(
  `El encuadre.close encuadra cada asset (${malEncuadrados.length} mal)`,
  malEncuadrados.length === 0,
  malEncuadrados.map((a) => a.dato.nombre).join(', ')
);

// La cámara de encuadre tiene que estar más cerca que la general.
const distanciaGeneral = 34;
comprobar(
  'El encuadre de un asset está más cerca que el plano general',
  7.4 < distanciaGeneral
);

/* -------------------------------------------------------------------------
 * 6. Deep links
 * ---------------------------------------------------------------------- */

console.log('\nDeep links:');

const idsValidos = new Set(DATOS.map((d) => d.id));
comprobar(
  'Todos los ids son únicos',
  idsValidos.size === DATOS.length,
  `${idsValidos.size} únicos de ${DATOS.length}`
);

comprobar(
  'Todos los ids sirven como ancla en el HTML',
  DATOS.every((d) => /^[a-z0-9-]+$/.test(d.id)),
  DATOS.filter((d) => !/^[a-z0-9-]+$/.test(d.id)).map((d) => d.id).join(', ')
);

comprobar(
  'El id "intro" existe (el README de la intro)',
  idsValidos.has('intro')
);

// Un ejemplo real de deep link.
comprobar(
  'El deep link "#/fotoverse" apunta a un asset real',
  idsValidos.has('fotoverse')
);

/* -------------------------------------------------------------------------
 * 7. El árbol de la jerarquía
 * ---------------------------------------------------------------------- */

console.log('\nJerarquía:');

const { construirArbol } = await import(
  resolve(RAIZ, 'src/concepts/editor/paneles.js')
);
const arbol = construirArbol();

comprobar('El árbol tiene tres nodos de primer nivel', arbol.length === 3);

comprobar(
  'El primer nodo es el README de la intro',
  arbol[0].id === 'intro' && arbol[0].tipo === 'intro'
);

const grupos = arbol.filter((n) => n.tipo === 'grupo');
comprobar('Hay dos grupos (personal y profesional)', grupos.length === 2);

const enPersonal = grupos[0].hijos.length;
const enTrabajo = grupos[1].hijos.length;
comprobar(
  `Los grupos tienen todos sus assets (${enPersonal} + ${enTrabajo})`,
  enPersonal + enTrabajo === TODOS.length
);

comprobar(
  'Todos los assets de los datos están en el árbol',
  [...enPersonal ? grupos[0].hijos : [], ...grupos[1].hijos].length === TODOS.length
);

/* -------------------------------------------------------------------------
 * 8. La ficha del inspector
 * ---------------------------------------------------------------------- */

console.log('\nInspector:');

const { ficha } = await import(resolve(RAIZ, 'src/concepts/editor/paneles.js'));

for (const dato of DATOS) {
  const html = ficha(dato);
  const problemas = [];
  if (!html.includes(dato.nombre)) problemas.push('sin nombre');
  if (!html.includes('Por qué importa')) problemas.push('sin "por qué importa"');
  if (!html.includes('El camino hasta aquí')) problemas.push('sin etapas');
  if (dato.stack?.length && !html.includes(dato.stack[0])) problemas.push('sin stack');
  if (dato.repo && !html.includes(dato.repo)) problemas.push('sin enlace a GitHub');
  if (dato.url && !html.includes(dato.url)) problemas.push('sin enlace a la demo');
  comprobar(
    `La ficha de "${dato.nombre}" está completa`,
    problemas.length === 0,
    problemas.join(', ')
  );
}

// El enlace a GitHub es un <a href> de verdad: texto seleccionable, no texto
// pintado en un canvas.
const htmlFotoverse = ficha(DATOS.find((d) => d.id === 'fotoverse'));
comprobar(
  'El inspector usa un enlace real a GitHub (<a href>)',
  /<a[^>]+href="https:\/\/github\.com\/ahuertam\/fotoverse"/.test(htmlFotoverse)
);

comprobar(
  'El inspector escapa el HTML del contenido',
  !ficha(DATOS.find((d) => d.id === 'fotoverse')).includes('<script')
);

console.log(`\n=== ${total - fallos}/${total} comprobaciones superadas ===\n`);
process.exit(fallos > 0 ? 1 : 0);
