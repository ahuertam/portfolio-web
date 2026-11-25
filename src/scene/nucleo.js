/**
 * Núcleo de la escena 3D.
 *
 * Es la parte que comparten TODOS los conceptos (ver CONCEPTOS.md). Aquí vive
 * todo lo que no tiene que ver con qué se está enseñando:
 *
 *   - Detección de WebGL y degradación elegante.
 *   - `prefers-reduced-motion`.
 *   - Renderer, cámara, bucle de render, resize.
 *   - Raycasting y teclado.
 *
 * Cambiar de concepto no toca nada de este fichero.
 */

import * as THREE from 'three';

/** Detecta si el navegador puede dar un contexto WebGL. */
export function hayWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const lienzo = document.createElement('canvas');
    const gl =
      lienzo.getContext('webgl2') ||
      lienzo.getContext('webgl') ||
      lienzo.getContext('experimental-webgl');
    if (!gl) return false;
    // Libera el contexto: algunos navegadores tienen un límite alto.
    const pierde = gl.getExtension('WEBGL_lose_context');
    if (pierde) pierde.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** ¿El usuario ha pedido menos movimiento? */
export function quiereMenosMovimiento() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Crea el renderer, la cámara y el bucle.
 *
 * El bucle puede ser de dos clases:
 *
 *   - **Continuo** (por defecto): se dibuja un fotograma tras otro. Es lo
 *     que necesita una escena con animación propia.
 *   - **Bajo demanda**: sólo se dibuja cuando algo ha cambiado. Es lo que
 *     necesita un editor: una vista quieta no debe gastar CPU, y en un
 *     portátil con la batería justa cada fotograma cuenta.
 *
 * En modo bajo demanda, `actualizar` puede devolver `true` para pedir otro
 * fotograma (por ejemplo, mientras la cámara está volando).
 *
 * @param {HTMLCanvasElement} lienzo
 * @param {Object} opciones
 * @param {THREE.Scene} opciones.escena
 * @param {THREE.Camera} opciones.camara
 * @param {Function} opciones.actualizar  Se llama en cada fotograma con el delta.
 * @param {Function} opciones.encender      Se llama una vez para montar la escena.
 * @param {boolean} [opciones.bajoDemanda]  Dibujar sólo cuando algo cambia.
 * @returns {{renderer: THREE.WebGLRenderer, pedirFotograma: Function, dispose: Function}}
 */
export function crearNucleo(
  lienzo,
  { escena, camara, actualizar, encender, bajoDemanda = false }
) {
  const renderer = new THREE.WebGLRenderer({
    lienzo,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x111823, 1);

  const reloj = new THREE.Clock();
  let rafId = null;
  let activo = true;
  /** ¿Hay un fotograma pendiente? En modo bajo demanda, esto es la señal. */
  let pendiente = true;

  function dimensionar() {
    const ancho = lienzo.clientWidth || lienzo.parentElement?.clientWidth || 600;
    const alto = lienzo.clientHeight || lienzo.parentElement?.clientHeight || 400;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    // Cambia el tamaño: hay que redibujar.
    pendiente = true;
  }

  function bucle() {
    rafId = requestAnimationFrame(bucle);
    if (!activo) return;

    const delta = reloj.getDelta();

    if (bajoDemanda && !pendiente) {
      // Nada ha cambiado: no se dibuja. Esto es lo que hace que un editor
      // no queme CPU con la vista quieta.
      return;
    }
    pendiente = false;

    const sigue = actualizar(delta);
    renderer.render(escena, camara);

    // El concepto puede pedir otro fotograma (cámara en movimiento, por
    // ejemplo). Si no, el bucle se para solo hasta que llegue un `pedir`.
    if (bajoDemanda && sigue) pendiente = true;
  }

  function alRedimensionar() {
    dimensionar();
  }

  dimensionar();
  window.addEventListener('resize', alRedimensionar, { passive: true });

  if (encender) encender();

  // Con menos movimiento: un único fotograma y nada de bucle.
  if (quiereMenosMovimiento()) {
    activo = false;
    const delta = reloj.getDelta();
    actualizar(delta);
    renderer.render(escena, camara);
  } else {
    bucle();
  }

  return {
    renderer,
    /**
     * Pide un fotograma. En modo bajo demanda, es la forma de decir "algo ha
     * cambiado, redibuja".
     */
    pedirFotograma() {
      pendiente = true;
    },
    dispose() {
      activo = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', alRedimensionar);
      renderer.dispose();
    },
  };
}

/**
 * Detecta el rayo del puntero sobre el lienzo.
 *
 * @returns {THREE.Vector3|null} Punto de impacto en coordenadas de mundo.
 */
export function crearPunteria(lienzo, camara) {
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();

  return function apuntar(evento, objetos) {
    const rect = lienzo.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    puntero.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
    puntero.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(puntero, camara);
    const impactos = raycaster.intersectObjects(objetos, true);
    return impactos.length ? impactos[0] : null;
  };
}

/**
 * Redondea un número a un múltiplo de `paso`.
 * Se usa para que las piezas de la cinta caigan en rejilla y no "flotan".
 */
export function aRejilla(valor, paso) {
  return Math.round(valor / paso) * paso;
}
