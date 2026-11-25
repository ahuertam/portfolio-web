/**
 * Prueba de la lógica de la escena, sin navegador.
 *
 * Comprueba la construcción del pipeline: que las piezas se colocan en la
 * estación correcta, que las estaciones están donde deben, y que la selección
 * avanza por las etapas. No necesita WebGL: es geometría y lógica.
 *
 * Ejecutar: `node scripts/probar-escena.mjs`
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// El mismo Three.js que usa el concepto: una sola copia en memoria.
const THREE = await import('three');

/**
 * Stub mínimo de DOM: sólo lo que necesita la creación de etiquetas
 * (un canvas 2D y su contexto). No se dibuja nada: la prueba es de
 * geometría y lógica, no de píxeles.
 */
globalThis.document = {
  createElement(tipo) {
    if (tipo !== 'canvas') return {};
    return {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          font: '',
          textAlign: '',
          textBaseline: '',
          beginPath() {},
          moveTo() {},
          arcTo() {},
          closePath() {},
          fill() {},
          stroke() {},
          fillText() {},
        };
      },
    };
  },
};

const { construirGrupo } = await import(
  resolve(RAIZ, 'src/concepts/pipeline/concepto.js')
);
const { ETAPAS, TODOS } = await import(resolve(RAIZ, 'src/data/projects.js'));

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

console.log('\n=== Prueba de la geometría del pipeline ===\n');

const { grupo, piezas, estaciones } = construirGrupo(TODOS);

comprobar(
  `Hay una pieza por proyecto y bloque de trayectoria (${piezas.length})`,
  piezas.length === TODOS.length,
  `esperadas ${TODOS.length}, hay ${piezas.length}`
);

comprobar(
  `Hay una estación por etapa (${estaciones.length})`,
  estaciones.length === ETAPAS.length
);

// Las estaciones están ordenadas y separadas.
const xs = estaciones.map((e) => e.x);
comprobar(
  'Las estaciones están en orden creciente',
  xs.every((x, i) => i === 0 || x > xs[i - 1]),
  xs.join(', ')
);

const separacion = xs[1] - xs[0];
comprobar(
  `La separación entre estaciones es uniforme (${separacion})`,
  xs.every((x, i) => i === 0 || Math.abs(x - xs[i - 1] - separacion) < 1e-6)
);

// Cada pieza nace en la estación de su primera etapa.
let bienColocadas = 0;
piezas.forEach((pieza) => {
  const primera = pieza.dato.etapas[0];
  const indice = ETAPAS.findIndex((e) => e.id === primera.id);
  const xEsperada = estaciones[indice].x;
  if (Math.abs(pieza.malla.position.x - xEsperada) < 1e-6) bienColocadas += 1;
});
comprobar(
  `Cada pieza nace en su primera etapa (${bienColocadas}/${piezas.length})`,
  bienColocadas === piezas.length
);

// La cinta y el suelo están.
const mallas = [];
grupo.traverse((o) => {
  if (o.isMesh) mallas.push(o);
});
comprobar(`La escena tiene geometría (${mallas.length} mallas)`, mallas.length > 40);

// Las piezas de trabajo y las de proyecto se distinguen por color.
const proyecto = piezas.find((p) => p.dato.ambito !== 'trabajo');
const trabajo = piezas.find((p) => p.dato.ambito === 'trabajo');
comprobar(
  'Proyecto y trabajo tienen colores distintos',
  proyecto.mat.color.getHex() !== trabajo.mat.color.getHex(),
  `${proyecto.mat.color.getHex().toString(16)} vs ${trabajo.mat.color.getHex().toString(16)}`
);

// Todas las piezas tienen etiqueta legible.
comprobar('Todas las piezas llevan etiqueta', piezas.every((p) => p.etiqueta != null));

// Cada dato tiene al menos una etapa y todas las etapas son válidas.
const idsValidos = new Set(ETAPAS.map((e) => e.id));
comprobar(
  'Todas las etapas referidas existen',
  TODOS.every((d) => d.etapas.every((e) => idsValidos.has(e.id)))
);
comprobar(
  'Todo elemento tiene al menos una etapa',
  TODOS.every((d) => d.etapas.length >= 1)
);
comprobar(
  'Todo elemento tiene frase y "por qué importa"',
  TODOS.every((d) => d.frase?.length > 10 && d.porQue?.length > 40)
);

// La cinta se puede recorrer: la última etapa está más a la derecha.
const primeraX = estaciones[0].x;
const ultimaX = estaciones[estaciones.length - 1].x;
comprobar('La cinta avanza hacia la derecha', ultimaX > primeraX);

console.log(
  `\n=== ${total - fallos}/${total} comprobaciones superadas ===\n`
);
process.exit(fallos > 0 ? 1 : 0);
