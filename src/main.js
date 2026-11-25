/**
 * Punto de entrada.
 *
 * Este fichero NO es imprescindible para leer la web. Todo el contenido está en
 * el HTML que se genera en build —los paneles del editor incluidos— y lo que
 * hay aquí es la capa interactiva, que es un extra:
 *
 *   - Si no hay WebGL o no hay JS, la web se lee igual. Se avisa con un texto
 *     breve y se sigue.
 *   - Si el usuario pidió menos movimiento, la escena se dibuja un único
 *     fotograma, estática, y se puede interactuar con el ratón y el teclado.
 *
 * El concepto activo ("El editor") tiene los paneles en HTML: este fichero
 * sólo tiene que arrancar la escena y avisar cuando no puede.
 */

import { hayWebGL, quiereMenosMovimiento } from './scene/nucleo.js';
import { cargarConcepto } from './concepts/registry.js';

const contenedor = document.getElementById('escena');
const lienzo = document.getElementById('lienzo-3d');
const estado = document.getElementById('escena-estado');

/**
 * Mensaje que se muestra cuando la escena no puede arrancar.
 *
 * Los paneles del editor son HTML: no dependen de la escena. Por eso, cuando
 * la escena no arranca, sólo se oculta el lienzo y se deja el aviso. La
 * jerarquía y el inspector siguen ahí, con todo el contenido.
 */
function mostrarEstado(titulo, cuerpo) {
  if (!estado) return;
  // Un <p> con entradilla en negrita, no un encabezado: es un mensaje de
  // estado, no una sección del documento. Si fuera un h3, rompería la
  // jerarquía de encabezados (h1 -> h3).
  estado.innerHTML = `<p><strong>${titulo}</strong></p><p>${cuerpo}</p>`;
  if (contenedor) contenedor.hidden = true;
  // Sin escena, el inspector muestra todas las fichas apiladas: la web
  // entera sigue siendo el portfolio.
  const editor = document.getElementById('editor');
  if (editor) editor.dataset.editorVivo = 'false';
}

async function arrancar() {
  if (!contenedor || !lienzo) return;

  let concepto;
  try {
    concepto = await cargarConcepto();
  } catch (error) {
    console.error('No se pudo cargar el concepto 3D:', error);
    mostrarEstado(
      'El grafo no se ha podido cargar',
      'La jerarquía y el inspector siguen funcionando; el proyecto entero se lee más abajo.'
    );
    return;
  }

  // No todos los conceptos necesitan WebGL: el grafo es DOM y funciona sin
  // aceleración por hardware. Sólo se avisa si el concepto lo pide de verdad.
  if (concepto.necesitaWebGL && !hayWebGL()) {
    mostrarEstado(
      'El viewport 3D no está disponible en este navegador',
      'No pasa nada: la jerarquía y el inspector de la derecha tienen todo el contenido, y el proyecto entero se lee más abajo. El viewport es un extra visual, no la fuente de la información.'
    );
    return;
  }

  try {
    const instancia = concepto.create(lienzo, {
      onSeleccion(dato) {
        if (!dato) return;
        // Al seleccionar, se localiza la tarjeta equivalente en el texto.
        const tarjeta = document.getElementById(dato.id);
        if (tarjeta) {
          tarjeta.classList.add('tarjeta-resaltada');
          window.setTimeout(() => tarjeta.classList.remove('tarjeta-resaltada'), 1800);
        }
      },
    });

    // Expuesto para depuración desde la consola del navegador.
    window.__escena = instancia;
  } catch (error) {
    console.error('La escena 3D falló al arrancar:', error);
    mostrarEstado(
      'El grafo no se ha podido arrancar',
      'La jerarquía y el inspector siguen funcionando; el proyecto entero se lee más abajo.'
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arrancar, { once: true });
} else {
  arrancar();
}
