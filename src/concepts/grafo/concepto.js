/**
 * Concepto "El grafo" — nodos en un lienzo 2D, con una capa 3D de fondo.
 *
 * La estructura imita el editor de la Forja (`gamelearn/the-adventure-forge`):
 * nodos tipados por color, jerarquía a la izquierda, propiedades a la derecha.
 * Lo que cambia es el fondo: en vez de un viewport con piezas, hay un grafo
 * plano con las relaciones entre proyectos, y detrás una escena 3D muy
 * discreta (niebla, rejilla y partículas lentas) que da profundidad sin
 * competir con la información.
 *
 * El grafo es DOM y SVG; el 3D es solo atmósfera. Si el WebGL no está, el
 * grafo sigue intacto: por eso la escena va en `bajoDemanda: false` pero
 * cualquier fallo suyo no puede romper la página.
 */

import * as THREE from 'three';

import { crearNucleo, quiereMenosMovimiento } from '../../scene/nucleo.js';
import { crearGrafo } from './grafo.js';
import { INTRO, TODOS } from '../../data/projects.js';
// Los paneles (jerarquía, inspector, barra de estado, ayuda) son HTML y los
// comparten todos los conceptos de editor. Viven en editor/ por historia;
// cuando seFourth el concepto editor, se mueven a scene/.
import { conectarPaneles } from '../editor/paneles.js';

const COLOR_FONDO = 0x0b0f14;

/**
 * El grafo es DOM: no necesita WebGL para nada. El 3D es solo atmósfera.
 */
export const necesitaWebGL = false;

/**
 * Escena de fondo: rejilla en el suelo, niebla y partículas a la deriva.
 * Es atmósfera: nunca tapa el grafo ni compite con el texto.
 */
function montarFondo() {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(COLOR_FONDO);
  escena.fog = new THREE.Fog(COLOR_FONDO, 26, 78);

  // Rejilla: da suelo y escala sin necesidad de geometría pesada.
  const rejilla = new THREE.GridHelper(160, 32, 0x1d2a3d, 0x141c28);
  rejilla.position.y = -6;
  escena.add(rejilla);

  // Partículas: un campo lento que da la sensación de profundidad.
  const cantidad = 260;
  const posiciones = new Float32Array(cantidad * 3);
  for (let i = 0; i < cantidad; i++) {
    posiciones[i * 3] = (Math.random() - 0.5) * 120;
    posiciones[i * 3 + 1] = Math.random() * 34 - 6;
    posiciones[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  const material = new THREE.PointsMaterial({
    color: 0x5ee3c4,
    size: 0.16,
    transparent: true,
    opacity: 0.32,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const puntos = new THREE.Points(geometria, material);
  escena.add(puntos);

  const camara = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
  camara.position.set(0, 6, 26);
  camara.lookAt(0, 2, 0);

  const luz = new THREE.HemisphereLight(0x9fc4e0, 0x05080c, 0.7);
  escena.add(luz);

  let t = 0;
  function actualizar(delta) {
    t += delta;
    puntos.rotation.y = t * 0.012;
    puntos.position.y = Math.sin(t * 0.12) * 0.5;
    return true; // sigue pidiendo fotogramas: es una escena viva.
  }

  return { escena, camara, actualizar };
}

/**
 * Punto de entrada del concepto. Mismo contrato que el resto: recibe el
 * lienzo 3D y un callback de selección.
 *
 * @param {HTMLCanvasElement} lienzo
 * @param {Object} opciones
 * @param {Function} [opciones.onSeleccion]
 */
export function create(lienzo, { onSeleccion } = {}) {
  const contenedor = document.getElementById('editor-grafo');

  let grafo = null;
  let nucleo = null;

  /* --- El grafo ---------------------------------------------------------- */

  if (contenedor) {
    grafo = crearGrafo(contenedor, {
      alSeleccionar(id) {
        if (id) {
          const url = new URL(window.location.href);
          url.hash = `#/${id}`;
          window.history.replaceState(null, '', url);
        } else {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        onSeleccion?.(id);
      },
      alEnfocar(id) {
        grafo?.enfocar(id);
      },
    });
    contenedor.tabIndex = 0;
    contenedor.setAttribute('role', 'application');
    contenedor.setAttribute(
      'aria-label',
      'Grafo de proyectos. Usa las flechas para moverte entre nodos y Enter para ver la ficha.'
    );
  }

  /* --- Los paneles (HTML) ------------------------------------------------ */

  const paneles = conectarPaneles({
    alSeleccionar(id) {
      grafo?.seleccionar(id);
      grafo?.enfocar(id);
    },
    alEncuadrar(id) {
      grafo?.enfocar(id);
    },
  });

  // La jerarquía y el inspector se mueven desde el grafo también: cada nodo
  // lleva su frase, que es lo que un visitor lee sin abrir el inspector.
  const frases = {};
  for (const elemento of [INTRO, ...TODOS]) {
    if (elemento?.id && elemento.frase) frases[elemento.id] = elemento.frase;
  }

  // Marca el editor como vivo: el inspector pasa a mostrar una sola ficha (la
  // seleccionada) en vez de apilarlas todas. Sin esta marca, la página se
  // convierte en una columna de 16.000 px de fichas.
  paneles?.marcarVivo?.();

  /* --- El fondo 3D ------------------------------------------------------- */

  if (lienzo) {
    const fondo = montarFondo();
    try {
      nucleo = crearNucleo(lienzo, {
        escena: fondo.escena,
        camara: fondo.camara,
        actualizar: fondo.actualizar,
        bajoDemanda: false,
      });
    } catch {
      // Sin WebGL no pasa nada: el grafo es DOM. Se oculta el lienzo vacío.
      lienzo.hidden = true;
      nucleo = null;
    }
  }

  /* --- Aviso de movimiento reducido --------------------------------------- */

  // El grafo no se anima (es DOM), pero el fondo 3D sí. Con movimiento
  // reducido, `crearNucleo` dibuja un único fotograma y para el bucle; el
  // aviso va aquí, en el concepto, que es quien sabe qué parte es 3D.
  if (quiereMenosMovimiento()) {
    const estado = document.getElementById('escena-estado');
    if (estado) {
      estado.innerHTML =
        '<p><strong>Escena estática (movimiento reducido)</strong></p>' +
        '<p>Has pedido movimiento reducido, así que el fondo 3D no se anima. ' +
        'El grafo se sigue usando igual.</p>';
    }
  }

  /* --- Deep link --------------------------------------------------------- */

  function desdeHash() {
    const id = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
    if (!id) return;
    grafo?.seleccionar(id);
    grafo?.enfocar(id);
  }

  window.addEventListener('hashchange', desdeHash);
  desdeHash();

  return {
    dispose() {
      window.removeEventListener('hashchange', desdeHash);
      grafo?.destruir();
      nucleo?.dispose();
      paneles?.destruir?.();
    },
  };
}

export const id = 'grafo';
export const etiqueta = 'El grafo';
export const descripcion =
  'Nodos tipados por color sobre un lienzo 2D, con las relaciones entre proyectos como aristas. Detrás, una escena 3D de fondo.';
