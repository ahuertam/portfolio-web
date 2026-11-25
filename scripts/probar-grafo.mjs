/**
 * Comprobaciones del concepto "El grafo".
 *
 * Sin navegador: el grafo es DOM y SVG, así que con un contenedor de mentira
 * se puede comprobar lo que de verdad importa — que los nodos existan, que las
 * aristas apunten a nodos reales, que nada se solape y que el layout cuadre.
 */

import { NODOS, ARISTAS, CARRILES, TIPOS, tipoDe } from '../src/data/grafo.js';
import { INTRO, TODOS } from '../src/data/projects.js';

let comprobaciones = 0;
let fallos = 0;

function ok(condicion, descripcion, detalle = '') {
  comprobaciones++;
  if (condicion) {
    console.log(`  OK   ${descripcion}${detalle ? ` (${detalle})` : ''}`);
  } else {
    fallos++;
    console.log(`  FALLA ${descripcion}${detalle ? ` (${detalle})` : ''}`);
  }
}

console.log('\n=== Comprobación del grafo ===\n');

/* --- Los datos ------------------------------------------------------------ */

const ids = new Set(TODOS.map((p) => p.id));
ids.add(INTRO.id);

ok(Object.keys(NODOS).length === ids.size,
  'El grafo tiene un nodo por cada proyecto y bloque de trayectoria',
  `${Object.keys(NODOS).length} nodos / ${ids.size} entradas`);

const huerfanos = Object.keys(NODOS).filter((id) => !ids.has(id));
ok(huerfanos.length === 0, 'Todos los nodos existen en el dataset', huerfanos.join(', '));

const sinTipo = Object.keys(NODOS).filter((id) => !TIPOS[NODOS[id].tipo]);
ok(sinTipo.length === 0, 'Todos los nodos tienen un tipo válido', sinTipo.join(', '));

const sinCarril = Object.keys(NODOS).filter((id) => !CARRILES.some((c) => c.id === NODOS[id].carril));
ok(sinCarril.length === 0, 'Todos los nodos tienen un carril válido', sinCarril.join(', '));

ok(Object.keys(TIPOS).length === 4, 'Hay cuatro tipos de nodo', Object.keys(TIPOS).join(', '));

/* --- Las aristas ---------------------------------------------------------- */

const aristasRotas = ARISTAS.filter((a) => !ids.has(a.de) || !ids.has(a.a));
ok(aristasRotas.length === 0, 'Todas las aristas apuntan a nodos que existen',
  aristasRotas.map((a) => `${a.de}→${a.a}`).join(', '));

const bucles = ARISTAS.filter((a) => a.de === a.a);
ok(bucles.length === 0, 'Ninguna arista se apunta a sí misma', bucles.map((a) => a.de).join(', '));

const duplicadas = ARISTAS.map((a) => `${a.de}→${a.a}`).filter((v, i, arr) => arr.indexOf(v) !== i);
ok(duplicadas.length === 0, 'No hay aristas duplicadas', duplicadas.join(', '));

const sinEtiqueta = ARISTAS.filter((a) => !a.etiqueta || !a.etiqueta.trim());
ok(sinEtiqueta.length === 0, 'Todas las aristas llevan etiqueta',
  'una arista sin etiqueta dice menos que ninguna');

/* --- El grafo dibujado ---------------------------------------------------- */

/** Contenedor de mentira: sólo necesita append y un rectángulo. */
function contenedorFalso() {
  const hijos = [];
  return {
    hijos,
    append(...n) {
      hijos.push(...n);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 600, x: 0, y: 0 }),
    addEventListener() {},
    removeEventListener() {},
    setPointerCapture() {},
    releasePointerCapture() {},
    classList: { add() {}, remove() {} },
    tabIndex: 0,
    setAttribute() {},
  };
}

/** Elemento de mentira con lo que el grafo toca de verdad. */
function elementoFalso(tipo) {
  const atributos = {};
  const clases = new Set();
  const elemento = {
    tagName: String(tipo).toUpperCase(),
    className: '',
    dataset: {},
    style: {
      left: '',
      top: '',
      transform: '',
      _vars: {},
      setProperty(nombre, valor) {
        this._vars[nombre] = valor;
      },
      getPropertyValue(nombre) {
        return this._vars[nombre] ?? '';
      },
    },
    children: [],
    textContent: '',
    hidden: false,
    append(...n) {
      this.children.push(...n);
    },
    setAttribute(nombre, valor) {
      atributos[nombre] = valor;
      // El grafo fija la clase por atributo (SVG) y por propiedad (HTML).
      if (nombre === 'class') this.className = valor;
    },
    getAttribute: (nombre) => atributos[nombre] ?? null,
    removeAttribute(nombre) {
      delete atributos[nombre];
    },
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    remove() {
      this.eliminado = true;
    },
    eliminado: false,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, x: 0, y: 0 }),
  };

  // classList tiene que tocar el elemento, no a sí mismo: por eso se
  // define después, con la referencia al elemento ya cerrada.
  elemento.classList = {
    add: (...nombres) => {
      nombres.forEach((n) => clases.add(n));
      elemento.className = [...clases].join(' ');
    },
    remove: (...nombres) => {
      nombres.forEach((n) => clases.delete(n));
      elemento.className = [...clases].join(' ');
    },
    toggle: (nombre, activo) => {
      if (activo) clases.add(nombre);
      else clases.delete(nombre);
      elemento.className = [...clases].join(' ');
    },
    contains: (nombre) => clases.has(nombre),
  };

  return elemento;
}

globalThis.document = {
  createElement: (tipo) => elementoFalso(tipo),
  createElementNS: (_ns, tipo) => elementoFalso(tipo),
};

const { crearGrafo } = await import('../src/concepts/grafo/grafo.js');
const contenedor = contenedorFalso();
const grafo = crearGrafo(contenedor, {});

const mundo = contenedor.hijos[0];
const capaNodos = mundo?.children?.[1];
const capaAristas = mundo?.children?.[0];

const botones = (capaNodos?.children ?? []).filter((n) => n.className === 'grafo-nodo');
const trazos = (capaAristas?.children ?? []).filter((n) => n.className === 'grafo-arista');
const textos = (capaAristas?.children ?? []).filter((n) => n.className === 'grafo-arista-etiqueta');

ok(botones.length === Object.keys(NODOS).length,
  'Se dibuja un nodo por cada entrada', `${botones.length} nodos`);
ok(trazos.length === ARISTAS.length,
  'Se dibuja una arista por cada relación', `${trazos.length} aristas`);
ok(textos.length === ARISTAS.length,
  'Cada arista lleva su etiqueta', `${textos.length} etiquetas`);

// Posiciones: los nodos no se pueden solapar y cada uno cae en su carril.
const posiciones = botones.map((b) => ({
  id: b.dataset.nodo,
  x: Number.parseFloat(b.style.left),
  y: Number.parseFloat(b.style.top),
}));

const solapados = [];
for (let i = 0; i < posiciones.length; i++) {
  for (let j = i + 1; j < posiciones.length; j++) {
    const a = posiciones[i];
    const b = posiciones[j];
    if (Math.abs(a.x - b.x) < 200 && Math.abs(a.y - b.y) < 80) solapados.push(`${a.id}/${b.id}`);
  }
}
ok(solapados.length === 0, 'Ningún nodo se solapa con otro', solapados.join(', '));

const fueraDeCarril = posiciones.filter((p) => {
  const carril = CARRILES.find((c) => c.id === NODOS[p.id]?.carril);
  return !carril || Math.abs(p.x - (72 + carril.x * 300)) > 1;
});
ok(fueraDeCarril.length === 0, 'Cada nodo cae en la columna de su carril',
  fueraDeCarril.map((p) => p.id).join(', '));

const conFrase = botones.filter((b) => {
  const frase = b.children?.find((c) => c.className === 'grafo-nodo-frase');
  return frase && frase.textContent && frase.textContent.length > 3;
});
ok(conFrase.length === botones.length,
  'Todos los nodos llevan su frase (no solo un título)', `${conFrase.length}/${botones.length}`);

const conTipo = botones.filter((b) => {
  const tipo = b.children?.find((c) => c.className === 'grafo-nodo-tipo');
  return tipo && tipo.textContent && tipo.textContent.length > 2;
});
ok(conTipo.length === botones.length,
  'Todos los nodos llevan su etiqueta de tipo', `${conTipo.length}/${botones.length}`);

// Los tipos tienen color propio: es lo que permite leer el grafo de un vistazo.
const colores = new Set(
  botones.map((b) => b.style.getPropertyValue('--tipo-borde')).filter(Boolean)
);
ok(colores.size === 4, 'Los cuatro tipos tienen color distinto', [...colores].join(' '));

// La selección y el encuadre no rompen con datos raros.
let fallo = null;
try {
  grafo.seleccionar('fotoverse');
  grafo.enfocar('fotoverse');
  const marcado = botones.find((b) => b.className.includes('grafo-nodo--sel'));
  ok(marcado?.dataset.nodo === 'fotoverse', 'La selección marca el nodo');

  grafo.seleccionar('no-existe');
  grafo.enfocar('no-existe');
} catch (e) {
  fallo = e.message;
}
ok(!fallo, 'Seleccionar y enfocar un id inexistente no rompe', fallo ?? '');

grafo.destruir();
ok(mundo.eliminado === true, 'destruir() quita el grafo del DOM');

console.log(`\n=== ${comprobaciones - fallos}/${comprobaciones} comprobaciones superadas ===\n`);
process.exit(fallos === 0 ? 0 : 1);
