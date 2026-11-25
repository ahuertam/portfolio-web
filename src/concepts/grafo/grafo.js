/**
 * El grafo de nodos: el corazón del concepto "El grafo".
 *
 * Es DOM y SVG, no WebGL. Los nodos son botones HTML con texto real
 * (seleccionable, buscable por lector de pantalla) y las aristas son trazos
 * SVG. Consecuencia que importa: **la web no depende de la GPU** y se ve
 * igual en un portátil corporativo con la aceleración por hardware
 * desactivada.
 *
 * Se parece en la estructura al editor de la Forja
 * (`gamelearn/the-adventure-forge`): tipos de nodo con color, jerarquía a la
 * izquierda, propiedades a la derecha. Aquí el "lienzo" es el grafo.
 */

import { ARISTAS, CARRILES, NODOS, tipoDe } from '../../data/grafo.js';
import { INTRO, TODOS } from '../../data/projects.js';

/** id → { nombre, frase }. El id del grafo es el id del proyecto. */
const DATOS = new Map(
  [INTRO, ...TODOS].map((elemento) => [elemento.id, elemento])
);

const ANCHO_NODO = 208;
const ALTO_NODO = 92;
const ESPACIO_X = 300;
const ESPACIO_Y = 126;
const MARGEN_X = 72;
const MARGEN_Y = 96;
const ESCALA_MIN = 0.3;
const ESCALA_MAX = 1.8;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Crea un elemento con clase y contenido. */
function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

/** Crea un elemento SVG. */
function svgEl(etiqueta, atributos = {}) {
  const nodo = document.createElementNS(SVG_NS, etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    nodo.setAttribute(clave, valor);
  }
  return nodo;
}

/**
 * Monta el grafo dentro de `contenedor`.
 *
 * @param {HTMLElement} contenedor
 * @param {Object} opciones
 * @param {Function} [opciones.alSeleccionar] Se llama con el id del nodo elegido.
 * @param {Function} [opciones.alEnfocar] Se llama con el id al pedir encuadre.
 * @returns {{seleccionar: Function, enfocar: Function, destruir: Function}}
 */
export function crearGrafo(contenedor, { alSeleccionar, alEnfocar } = {}) {
  const mundo = el('div', 'grafo-mundo');
  const capaAristas = svgEl('svg', { class: 'grafo-aristas', 'aria-hidden': 'true' });
  const capaNodos = el('div', 'grafo-nodos');
  mundo.append(capaAristas, capaNodos);
  contenedor.append(mundo);

  /* --- Nodos y su posición --------------------------------------------- */

  /** @type {Map<string, Object>} id → nodo con su posición en el mundo. */
  const nodos = new Map();
  /** @type {Map<string, HTMLElement>} id → botón del nodo. */
  const botones = new Map();
  /** @type {Map<string, Object[]>} id → aristas que entran o salen. */
  const aristasPorNodo = new Map();

  // Un nodo por cada entrada de NODOS, en el orden en que aparecen: el
  // orden de lectura va de izquierda a derecha por carriles.
  const porCarril = new Map(CARRILES.map((c) => [c.id, []]));
  for (const [id, config] of Object.entries(NODOS)) {
    porCarril.get(config.carril)?.push({ id, config });
  }

  for (const carril of CARRILES) {
    const columna = porCarril.get(carril.id) ?? [];
    columna.forEach((entrada, indice) => {
      const x = MARGEN_X + carril.x * ESPACIO_X;
      const y = MARGEN_Y + indice * ESPACIO_Y;
      nodos.set(entrada.id, { id: entrada.id, x, y, config: entrada.config });
    });
  }

  /* --- Construcción del DOM --------------------------------------------- */

  for (const [id, nodo] of nodos) {
    const tipo = tipoDe(id);
    const boton = el('button', 'grafo-nodo');
    boton.type = 'button';
    boton.dataset.nodo = id;
    boton.style.setProperty('--tipo-borde', tipo.borde);
    boton.style.setProperty('--tipo-texto', tipo.texto);
    boton.style.left = `${nodo.x}px`;
    boton.style.top = `${nodo.y}px`;

    boton.append(el('span', 'grafo-nodo-tipo', tipo.nombre));
    boton.append(el('span', 'grafo-nodo-titulo', DATOS.get(id)?.nombre ?? id));
    boton.append(el('span', 'grafo-nodo-frase', DATOS.get(id)?.frase ?? ''));

    boton.addEventListener('click', (evento) => {
      evento.stopPropagation();
      seleccionar(id);
      alSeleccionar?.(id);
    });

    capaNodos.append(boton);
    botones.set(id, boton);
  }

  /* --- Aristas ----------------------------------------------------------- */

  /** @type {Object[]} */
  const aristas = [];
  for (const arista of ARISTAS) {
    const desde = nodos.get(arista.de);
    const hasta = nodos.get(arista.a);
    if (!desde || !hasta) continue;

    const x1 = desde.x + ANCHO_NODO;
    const y1 = desde.y + ALTO_NODO / 2;
    const x2 = hasta.x;
    const y2 = hasta.y + ALTO_NODO / 2;
    const curva = Math.max(40, Math.abs(x2 - x1) * 0.45);

    const trazo = svgEl('path', {
      class: 'grafo-arista',
      d: `M ${x1} ${y1} C ${x1 + curva} ${y1}, ${x2 - curva} ${y2}, ${x2} ${y2}`,
    });
    const etiqueta = svgEl('text', {
      class: 'grafo-arista-etiqueta',
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2 - 6,
      'text-anchor': 'middle',
    });
    etiqueta.textContent = arista.etiqueta;

    capaAristas.append(trazo, etiqueta);
    const registro = { ...arista, trazo, etiqueta };
    aristas.push(registro);
    for (const id of [arista.de, arista.a]) {
      if (!aristasPorNodo.has(id)) aristasPorNodo.set(id, []);
      aristasPorNodo.get(id).push(registro);
    }
  }

  // El SVG necesita tamaño explícito para que el viewBox escale con el mundo.
  const anchoMundo = MARGEN_X * 2 + CARRILES.length * ESPACIO_X;
  const altoMundo = MARGEN_Y + Math.max(...[...nodos.values()].map((n) => n.y)) + ALTO_NODO + MARGEN_Y;
  capaAristas.setAttribute('viewBox', `0 0 ${anchoMundo} ${altoMundo}`);
  capaAristas.setAttribute('width', anchoMundo);
  capaAristas.setAttribute('height', altoMundo);

  /* --- Vista: desplazamiento y zoom -------------------------------------- */

  const vista = { x: 0, y: 0, escala: 0.82 };

  function aplicarVista() {
    const acotado = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, vista.escala));
    vista.escala = acotado;
    mundo.style.transform = `translate(${vista.x}px, ${vista.y}px) scale(${acotado})`;
  }

  /** ¿El puntero está sobre un nodo? Entonces no se desplaza el lienzo. */
  function sobreNodo(evento) {
    return Boolean(evento.target.closest?.('.grafo-nodo'));
  }

  let arrastrando = false;
  let origen = { x: 0, y: 0, vx: 0, vy: 0 };

  contenedor.addEventListener('pointerdown', (evento) => {
    if (sobreNodo(evento) || evento.button !== 0) return;
    arrastrando = true;
    origen = { x: evento.clientX, y: evento.clientY, vx: vista.x, vy: vista.y };
    contenedor.setPointerCapture?.(evento.pointerId);
    contenedor.classList.add('grafo-arrastrando');
  });

  contenedor.addEventListener('pointermove', (evento) => {
    if (!arrastrando) return;
    vista.x = origen.vx + (evento.clientX - origen.x);
    vista.y = origen.vy + (evento.clientY - origen.y);
    aplicarVista();
  });

  const soltar = (evento) => {
    if (!arrastrando) return;
    arrastrando = false;
    contenedor.releasePointerCapture?.(evento.pointerId);
    contenedor.classList.remove('grafo-arrastrando');
  };
  contenedor.addEventListener('pointerup', soltar);
  contenedor.addEventListener('pointercancel', soltar);

  contenedor.addEventListener(
    'wheel',
    (evento) => {
      evento.preventDefault();
      const rect = contenedor.getBoundingClientRect();
      const px = evento.clientX - rect.left;
      const py = evento.clientY - rect.top;
      const antes = vista.escala;
      const despues = antes * (evento.deltaY < 0 ? 1.12 : 1 / 1.12);
      vista.escala = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, despues));
      // Zoom hacia el puntero: el punto bajo el cursor se queda quieto.
      vista.x = px - ((px - vista.x) * vista.escala) / antes;
      vista.y = py - ((py - vista.y) * vista.escala) / antes;
      aplicarVista();
    },
    { passive: false }
  );

  /* --- Selección --------------------------------------------------------- */

  let seleccionado = null;

  function seleccionar(id) {
    if (seleccionado && botones.has(seleccionado)) {
      botones.get(seleccionado).classList.remove('grafo-nodo--sel');
    }
    seleccionado = id;
    if (!id || !botones.has(id)) return;

    const boton = botones.get(id);
    boton.classList.add('grafo-nodo--sel');

    // Sólo se rotulan las aristas del nodo elegido: si se rotulan todas,
    // el grafo se convierte en una maraña.
    for (const arista of aristas) {
      const activa = arista.de === id || arista.a === id;
      arista.trazo.classList.toggle('grafo-arista--activa', activa);
      arista.etiqueta.classList.toggle('grafo-arista-etiqueta--visible', activa);
    }
  }

  /** Encuadra un nodo: lo pone en el centro del lienzo. */
  function enfocar(id) {
    const nodo = nodos.get(id);
    if (!nodo) return;
    const rect = contenedor.getBoundingClientRect();
    vista.x = rect.width / 2 - (nodo.x + ANCHO_NODO / 2) * vista.escala;
    vista.y = rect.height / 2 - (nodo.y + ALTO_NODO / 2) * vista.escala;
    aplicarVista();
  }

  /* --- Teclado ----------------------------------------------------------- */

  contenedor.addEventListener('keydown', (evento) => {
    const orden = [...nodos.keys()];
    const actual = orden.indexOf(seleccionado);
    let siguiente = null;
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
      siguiente = orden[Math.min(orden.length - 1, actual + 1)];
    } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
      siguiente = orden[Math.max(0, actual - 1)];
    } else if (evento.key === 'Escape') {
      seleccionar(null);
      alSeleccionar?.(null);
      evento.preventDefault();
      return;
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      if (seleccionado) {
        alSeleccionar?.(seleccionado);
        evento.preventDefault();
      }
      return;
    } else {
      return;
    }
    if (siguiente) {
      seleccionar(siguiente);
      enfocar(siguiente);
      alSeleccionar?.(siguiente);
      evento.preventDefault();
    }
  });

  /* --- Arranque ---------------------------------------------------------- */

  // Encuadre inicial: como en cualquier editor de nodos, no se ve el grafo
  // entero de golpe. Se empieza en el nodo de entrada (el README) a un
  // escala legible, y el visitante panea y hace zoom desde ahí.
  const rect = contenedor.getBoundingClientRect();
  const entrada = nodos.get('intro') ?? [...nodos.values()][0];
  vista.escala = 0.85;
  vista.x = rect.width / 2 - (entrada.x + ANCHO_NODO / 2) * vista.escala;
  vista.y = rect.height / 2 - (entrada.y + ALTO_NODO / 2) * vista.escala;
  aplicarVista();

  return {
    seleccionar,
    enfocar,
    destruir() {
      mundo.remove();
    },
  };
}
