/**
 * CONCEPTO 2 — EL EDITOR (el implementado)
 *
 * Un mini editor de autoría 3D: el tipo de herramienta que el propio Alejandro
 * construyó como developer principal en Game Strategies (editor de autoría 3D,
 * Vue 3 + Konva) durante siete años.
 *
 * La decisión de arquitectura que manda sobre todo lo demás:
 *
 *   **Los paneles son HTML real, no 3D.**
 *
 * La jerarquía lateral, el inspector, la barra de estado y la ayuda de atajos
 * son DOM con CSS, superpuestos al canvas. Sólo el viewport es WebGL.
 *
 * De ahí salen cuatro cosas que este módulo tiene que respetar:
 *
 *   1. El inspector muestra texto real seleccionable, con su enlace a GitHub.
 *      Nunca texto pintado sobre un canvas.
 *   2. El fallback sin WebGL y sin JavaScript sigue funcionando: los paneles
 *      HTML se apilan en vertical y siguen siendo un portfolio completo.
 *   3. La accesibilidad sale gratis: los paneles se navegan con teclado y con
 *      lector de pantalla porque son HTML.
 *   4. No hay dos fuentes de verdad: el HTML lee el mismo `src/data/projects.js`
 *      que la escena.
 *
 * Este módulo es autónomo en la escena: recibe el lienzo y devuelve un
 * manejador. Lo que toca el DOM son los paneles, y lo hace de forma opcional:
 * si no están, la escena funciona igual.
 *
 * Ver CONCEPTOS.md para la comparativa con el pipeline y los otros conceptos.
 */

import * as THREE from 'three';
import { crearNucleo, crearPunteria } from '../../scene/nucleo.js';
import { construirArquetipo, RADIO, ALTURA } from './arquetipos.js';
import { conectarPaneles } from './paneles.js';
import { INTRO, TODOS, ETAPAS, colorDe, arquetipoDe } from '../../data/projects.js';

export const id = 'editor';
export const etiqueta = 'El editor';
export const descripcion =
  'Un mini editor de autoría 3D: jerarquía a la izquierda, inspector a la derecha y el viewport en el centro.';

/** Este concepto sí necesita WebGL: el viewport es su contenido principal. */
export const necesitaWebGL = true;

/* --------------------------------------------------------------------------
 * Paleta y medidas
 * -------------------------------------------------------------------------- */

const COLOR_FONDO = 0x0e141c;
const COLOR_SUELO = 0x121a24;
const COLOR_GUIA = 0x2b3949;

/** Distancia a la que se colocan los assets en la rejilla del viewport. */
const PASO_X = 4.6;
const PASO_Z = 4.2;

/* --------------------------------------------------------------------------
 * Disposición de los assets en el viewport
 *
 * La escena se organiza como una rejilla: la intro al frente, los proyectos
 * personales en las dos filas siguientes, y los bloques de trayectoria al
 * fondo. Es un plano de trabajo, no un lineal: en un editor los assets se
 * ven todos a la vez.
 * -------------------------------------------------------------------------- */

/**
 * Calcula la posición de cada elemento en el viewport.
 *
 * @returns {Array<{dato: Object, x: number, z: number}>}
 */
export function distribuir(datos) {
  const intro = datos[0];
  const personales = datos.filter((d) => d.ambito === 'personal');
  const trabajo = datos.filter((d) => d.ambito === 'trabajo');

  const distribucion = [];

  // La intro, al frente y centrada.
  distribucion.push({ dato: intro, x: 0, z: 6.4 });

  // Cada grupo en filas, centrado en X.
  let z = 1.4;
  [personales, trabajo].forEach((grupo) => {
    const columnas = grupo.length > 6 ? 4 : grupo.length;
    const filas = Math.ceil(grupo.length / columnas);

    grupo.forEach((dato, i) => {
      const fila = Math.floor(i / columnas);
      const columna = i % columnas;
      // Centrado por fila: cada fila tiene su propio ancho real.
      const enFila = Math.min(columnas, grupo.length - fila * columnas);
      const anchoFila = (enFila - 1) * PASO_X;
      distribucion.push({
        dato,
        x: -anchoFila / 2 + columna * PASO_X,
        z: z - fila * PASO_Z,
      });
    });

    z -= filas * PASO_Z + 0.6;
  });

  return distribucion;
}

/* --------------------------------------------------------------------------
 * Construcción de la escena
 * -------------------------------------------------------------------------- */

/**
 * Construye el grupo con el suelo, la retícula y las representaciones.
 * Se separa del render para poder montarla sin WebGL (en tests, por ejemplo).
 *
 * @param {Array<Object>} datos Elementos a representar, el primero es la intro.
 */
export function construirGrupo(datos) {
  const grupo = new THREE.Group();
  const activos = [];

  const distribucion = distribuir(datos);

  distribucion.forEach(({ dato, x, z }) => {
    const color = colorDe(dato);
    const arquetipo = arquetipoDe(dato.arquetipo);

    const soporte = construirArquetipo(dato.arquetipo, color);

    // Sombra de contacto: un disco oscuro bajo el asset. Barato y da la
    // sensación de que el objeto está apoyado en el suelo.
    const sombra = new THREE.Mesh(
      new THREE.CircleGeometry(RADIO * 0.95, 20),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = 0.012;
    sombra.renderOrder = -1;
    soporte.add(sombra);

    // El grupo del asset se posiciona; su contenido se anima dentro.
    const contenedor = new THREE.Group();
    contenedor.position.set(x, 0, z);
    contenedor.add(soporte);
    grupo.add(contenedor);

    activos.push({
      dato,
      contenedor,
      soporte,
      arquetipo,
      color,
      x,
      z,
      resalte: 0,
      fase: (datos.indexOf(dato) * 0.7) % (Math.PI * 2),
    });
  });

  /* --- Suelo y retícula --------------------------------------------------- */
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 52),
    new THREE.MeshStandardMaterial({
      color: COLOR_SUELO,
      roughness: 0.94,
      metalness: 0,
    })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = -0.005;
  suelo.receiveShadow = true;
  grupo.add(suelo);

  // La retícula: líneas que marcan el plano de trabajo. Es lo que
  // distingue visualmente un viewport de un decorado.
  const materialGuia = new THREE.LineBasicMaterial({
    color: COLOR_GUIA,
    transparent: true,
    opacity: 0.55,
  });
  const puntosGuia = [];
  for (let i = -7; i <= 7; i++) {
    puntosGuia.push(i * PASO_X, 0.006, -22, i * PASO_X, 0.006, 22);
    puntosGuia.push(-22, 0.006, i * PASO_Z, 22, 0.006, i * PASO_Z);
  }
  const geometriaGuia = new THREE.BufferGeometry();
  geometriaGuia.setAttribute('position', new THREE.Float32BufferAttribute(puntosGuia, 3));
  const guias = new THREE.LineSegments(geometriaGuia, materialGuia);
  grupo.add(guias);

  return { grupo, activos, guias };
}

/* --------------------------------------------------------------------------
 * El concepto: crea la escena y devuelve el manejador
 * -------------------------------------------------------------------------- */

/**
 * @param {HTMLCanvasElement} lienzo
 * @param {Object} opciones
 * @param {Function} opciones.onSeleccion  Recibe el dato seleccionado (o null).
 */
export function create(lienzo, { onSeleccion } = {}) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(COLOR_FONDO);
  escena.fog = new THREE.Fog(COLOR_FONDO, 34, 78);

  const camara = new THREE.PerspectiveCamera(48, 1, 0.1, 220);

  // Luces: una clave suave y un relleno frío, para que los assets se lean.
  escena.add(new THREE.HemisphereLight(0x9fc4e0, 0x0a0e13, 1.0));
  const clave = new THREE.DirectionalLight(0xffffff, 1.35);
  clave.position.set(12, 20, 16);
  clave.castShadow = true;
  clave.shadow.mapSize.set(1024, 1024);
  clave.shadow.camera.left = -26;
  clave.shadow.camera.right = 26;
  clave.shadow.camera.top = 20;
  clave.shadow.camera.bottom = -20;
  clave.shadow.camera.near = 1;
  clave.shadow.camera.far = 70;
  escena.add(clave);
  const relleno = new THREE.DirectionalLight(0x5ee3c4, 0.3);
  relleno.position.set(-16, 8, -12);
  escena.add(relleno);

  const { grupo, activos } = construirGrupo([INTRO, ...TODOS]);
  escena.add(grupo);

  /* --- Los paneles --------------------------------------------------------- */
  // Los paneles son HTML: existen en el documento, generados en build. Aquí
  // sólo se conectan con la escena. Si no están (por ejemplo, en una prueba
  // sin DOM), la escena funciona igual.
  const paneles = conectarPaneles({
    alSeleccionar(id) {
      const activo = activoPorId(id);
      if (!activo) return;
      seleccionar(activo.dato);
    },
    alEncuadrar(id) {
      const activo = activoPorId(id);
      if (activo) encuadrar(activo);
    },
  });

  // El inspector pasa a mostrar una sola ficha (la seleccionada) en vez de
  // apilarlas todas: sin esta marca, la página es una columna larguísima.
  paneles?.marcarVivo?.();

  /* --- Estado de la cámara ------------------------------------------------ */
  // La cámara orbital: un punto de mira y una distancia y ángulo.
  // Volar con WASD mueve el punto de mira; orbitar con el ratón cambia los
  // ángulos; el encuadre (F) ajusta la distancia para que quepa el asset.
  const mirada = new THREE.Vector3(0, 0.6, 0);
  const objetivoMirada = mirada.clone();
  const spherical = new THREE.Spherical(34, 1.05, 0.62);
  const objetivoSpherical = spherical.clone();

  camara.position.set(0, 18, 28);
  camara.lookAt(mirada);

  /* --- Selección ---------------------------------------------------------- */
  let seleccionada = null;
  const apuntar = crearPunteria(lienzo, camara);

  const objetosSeleccionables = activos.map((a) => a.soporte);

  /** Busca el activo que corresponde a un dato. */
  function activoDe(dato) {
    return activos.find((a) => a.dato === dato);
  }

  /** Busca el activo por su id. */
  function activoPorId(id) {
    return activos.find((a) => a.dato.id === id);
  }

  function seleccionar(dato) {
    if (seleccionada === dato) return;
    seleccionada = dato;
    if (onSeleccion) onSeleccion(dato);
    // La jerarquía y el inspector se mueven con la selección.
    if (paneles) {
      paneles.marcarSeleccion(dato?.id ?? null);
      paneles.rellenarInspector(dato);
      paneles.fijarSeleccion(dato);
      paneles.escribirHash(dato?.id ?? null);
    }
  }

  function alMover(evento) {
    const impacto = apuntar(evento, objetosSeleccionables);
    lienzo.style.cursor = impacto ? 'pointer' : 'grab';
  }

  function alClic(evento) {
    const impacto = apuntar(evento, objetosSeleccionables);
    if (!impacto) {
      seleccionar(null);
      return;
    }
    const activo = activos.find((a) => a.soporte === impacto.object);
    if (!activo) return;
    seleccionar(activo.dato);
    encuadrar(activo);
  }

  /* --- Encuadre ------------------------------------------------------------ */

  /**
   * Encuadra un asset: la cámara vuela hasta él y lo mira.
   * @param {Object} activo
   */
  function encuadrar(activo) {
    objetivoMirada.set(activo.x, ALTURA * 0.6, activo.z);
    // Se acerca lo justo: la distancia del asset, con un margen.
    objetivoSpherical.radius = 7.4;
    objetivoSpherical.phi = 1.12;
  }

  /**
   * Vuelve al plano general.
   */
  function encuadreGeneral() {
    objetivoMirada.set(0, 0.6, 0);
    objetivoSpherical.radius = 34;
    objetivoSpherical.phi = 1.05;
    objetivoSpherical.theta = 0.62;
  }

  /* --- Cámara: ratón ------------------------------------------------------- */

  let arrastrando = false;
  let ultimoX = 0;
  let ultimoY = 0;
  const velocidad = { x: 0, y: 0 };

  function alBajar(evento) {
    arrastrando = true;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    lienzo.style.cursor = 'grabbing';
    lienzo.setPointerCapture?.(evento.pointerId);
  }

  function alSubir(evento) {
    arrastrando = false;
    lienzo.style.cursor = 'grab';
    lienzo.releasePointerCapture?.(evento.pointerId);
  }

  function alMoverRaton(evento) {
    if (!arrastrando) {
      alMover(evento);
      return;
    }
    const dx = evento.clientX - ultimoX;
    const dy = evento.clientY - ultimoY;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;

    // Orbitar: theta alrededor de Y, phi de polo a polo, con límites.
    objetivoSpherical.theta -= dx * 0.006;
    objetivoSpherical.phi = Math.max(
      0.18,
      Math.min(Math.PI * 0.46, objetivoSpherical.phi - dy * 0.005)
    );
  }

  /** Pan: arrastrar con el botón secundario o con Shift. */
  function alBoton(evento) {
    if (evento.button === 2 || evento.shiftKey) {
      evento.preventDefault();
      arrastrando = true;
      ultimoX = evento.clientX;
      ultimoY = evento.clientY;
      lienzo.style.cursor = 'move';
      lienzo.setPointerCapture?.(evento.pointerId);
    }
  }

  /* --- Teclado ------------------------------------------------------------- */

  const teclas = new Set();

  function alPulsarTecla(evento) {
    const objetivo = evento.target;
    // Si el foco está en un campo de texto (la búsqueda), el editor no
    // captura las teclas: el usuario está escribiendo, no volando.
    if (
      objetivo &&
      (objetivo.tagName === 'INPUT' ||
        objetivo.tagName === 'TEXTAREA' ||
        objetivo.isContentEditable)
    ) {
      return;
    }

    const clave = evento.key.toLowerCase();

    if (['w', 'a', 's', 'd', 'q', 'e', 'f', 'escape', '?'].includes(clave)) {
      evento.preventDefault();
    }

    teclas.add(clave);

    if (clave === 'f') {
      const activo = activos.find((a) => a.dato === seleccionada);
      if (activo) encuadrar(activo);
      else encuadreGeneral();
      return;
    }

    if (clave === 'escape') {
      seleccionar(null);
      encuadreGeneral();
      return;
    }
  }

  function alSoltarTecla(evento) {
    teclas.delete(evento.key.toLowerCase());
  }

  /* --- Bucle --------------------------------------------------------------- */

  let tiempo = 0;

  /**
   * Un fotograma de la escena.
   *
   * Devuelve `true` si hace falta otro fotograma. En el modo "bajo demanda"
   * del núcleo, esto decide si se sigue dibujando o si la vista se queda
   * quieta sin gastar CPU. Un editor con la vista quieta no debería
   * quemar batería.
   *
   * @returns {boolean} true si la escena sigue moviéndose.
   */
  function actualizar(delta) {
    tiempo += delta;
    let enMovimiento = false;

    /* Vuelo con WASD: mueve el punto de mira en el plano de la cámara y en
     * vertical. La cámara sigue al punto de mira, así que "volar" es
     * exactamente eso: desplazar el punto de mira. */
    const adelante = new THREE.Vector3();
    camara.getWorldDirection(adelante);
    adelante.y = 0;
    if (adelante.lengthSq() > 0) adelante.normalize();

    const derecha = new THREE.Vector3()
      .crossVectors(adelante, new THREE.Vector3(0, 1, 0))
      .normalize();

    const velocidadVuelo = 14 * delta;
    if (teclas.has('w')) objetivoMirada.addScaledVector(adelante, velocidadVuelo);
    if (teclas.has('s')) objetivoMirada.addScaledVector(adelante, -velocidadVuelo);
    if (teclas.has('d')) objetivoMirada.addScaledVector(derecha, velocidadVuelo);
    if (teclas.has('a')) objetivoMirada.addScaledVector(derecha, -velocidadVuelo);
    if (teclas.has('e')) objetivoMirada.y += velocidadVuelo;
    if (teclas.has('q')) objetivoMirada.y -= velocidadVuelo;

    if (
      teclas.has('w') || teclas.has('a') || teclas.has('s') ||
      teclas.has('d') || teclas.has('q') || teclas.has('e')
    ) {
      enMovimiento = true;
    }

    // El punto de mira no se sale del plano de trabajo.
    objetivoMirada.x = Math.max(-24, Math.min(24, objetivoMirada.x));
    objetivoMirada.z = Math.max(-20, Math.min(20, objetivoMirada.z));
    objetivoMirada.y = Math.max(0, Math.min(8, objetivoMirada.y));

    /* La cámara viaja hacia su objetivo. Mientras viaja hay que seguir
     * dibujando; cuando llega, la vista se queda quieta. */
    const distanciaAntes = mirada.distanceToSquared(objetivoMirada);
    const radioAntes = spherical.radius;
    const phiAntes = spherical.phi;
    const thetaAntes = spherical.theta;

    mirada.lerp(objetivoMirada, Math.min(1, delta * 3.4));
    spherical.radius += (objetivoSpherical.radius - spherical.radius) * Math.min(1, delta * 3.4);
    spherical.phi += (objetivoSpherical.phi - spherical.phi) * Math.min(1, delta * 3.4);
    spherical.theta += (objetivoSpherical.theta - spherical.theta) * Math.min(1, delta * 3.4);

    if (
      distanciaAntes - mirada.distanceToSquared(objetivoMirada) > 1e-6 ||
      Math.abs(radioAntes - spherical.radius) > 1e-6 ||
      Math.abs(phiAntes - spherical.phi) > 1e-6 ||
      Math.abs(thetaAntes - spherical.theta) > 1e-6
    ) {
      enMovimiento = true;
    }

    camara.position.setFromSpherical(spherical).add(mirada);
    camara.lookAt(mirada);

    /* Los assets: resalte del seleccionado y un flotar muy leve. */
    for (const activo of activos) {
      const objetivoResalte = activo.dato === seleccionada ? 1 : 0;
      const antes = activo.resalte;
      activo.resalte += (objetivoResalte - activo.resalte) * Math.min(1, delta * 6);
      if (Math.abs(antes - activo.resalte) > 1e-4) enMovimiento = true;

      // Los assets no giran: en un editor, un objeto que se moviera solo
      // parecería un adorno. Sólo flotan un poco, para que la escena no
      // parezca congelada.
      activo.contenedor.position.y =
        Math.sin(tiempo * 0.9 + activo.fase) * 0.02 * (1 - activo.resalte * 0.7);

      // El resalte: se ilumina y crece un poco.
      const escala = 1 + activo.resalte * 0.12;
      activo.soporte.scale.setScalar(escala);

      activo.soporte.traverse((objeto) => {
        if (!objeto.isMesh || !objeto.material?.emissive) return;
        if (objeto.material.opacity !== undefined && objeto.material.wireframe) return;
        objeto.material.emissiveIntensity = 0.16 + activo.resalte * 0.75;
      });
    }

    return enMovimiento;
  }

  /* --- Deep links ---------------------------------------------------------- */
  // Al abrir con un hash (#/fotoverse) se selecciona ese asset y se encuadra.
  // Y si el hash cambia (por ejemplo, el visitante pega un enlace), se sigue.

  function aplicarHash() {
    const id = paneles?.leerHash?.();
    if (!id) return false;
    const activo = activoPorId(id);
    if (!activo) return false;
    seleccionar(activo.dato);
    encuadrar(activo);
    paneles?.actualizarEstado?.('Encuadrar');
    return true;
  }

  /**
   * Selecciona el asset inicial.
   *
   * En un editor, al abrir, hay algo seleccionado: el asset raíz. Aquí es el
   * README de la intro, que es lo primero que se lee. Si la URL trae un
   * deep link, manda el deep link.
   */
  function seleccionarInicial() {
    if (aplicarHash()) return;
    const activo = activoPorId(INTRO.id);
    if (!activo) return;
    seleccionar(activo.dato);
    // No se encuadra: el plano general es el encuadre de partida.
  }

  function alCambiarHash() {
    // Si el hash no apunta a ningún asset, se deshace la selección.
    if (!aplicarHash() && !window.location.hash) {
      seleccionar(null);
    }
  }

  const nucleo = crearNucleo(lienzo, {
    escena,
    camara,
    actualizar,
    encender() {
      lienzo.addEventListener('pointerdown', alBoton);
      lienzo.addEventListener('pointermove', alMoverRaton, { passive: true });
      lienzo.addEventListener('pointerup', alSubir);
      lienzo.addEventListener('pointerleave', alSubir);
      lienzo.addEventListener('click', alClic);
      lienzo.addEventListener('contextmenu', (e) => e.preventDefault());
      window.addEventListener('keydown', alPulsarTecla);
      window.addEventListener('keyup', alSoltarTecla);
      window.addEventListener('hashchange', alCambiarHash);

      // El deep link se aplica al arrancar; si no hay, se selecciona la intro.
      seleccionarInicial();
      // Con la escena viva, el inspector pasa a mostrar una sola ficha.
      paneles?.marcarVivo?.();
      paneles?.actualizarEstado?.('Navegar');
    },
  });

  return {
    nucleo,
    activos,
    camara,
    paneles,
    seleccionar,
    encuadrar,
    encuadreGeneral,
    activoPorId,
    get seleccionada() {
      return seleccionada;
    },
    dispose() {
      lienzo.removeEventListener('pointerdown', alBoton);
      lienzo.removeEventListener('pointermove', alMoverRaton);
      lienzo.removeEventListener('pointerup', alSubir);
      lienzo.removeEventListener('pointerleave', alSubir);
      lienzo.removeEventListener('click', alClic);
      window.removeEventListener('keydown', alPulsarTecla);
      window.removeEventListener('keyup', alSoltarTecla);
      window.removeEventListener('hashchange', alCambiarHash);
      paneles?.dispose?.();
      nucleo.dispose();
    },
  };
}

export { ETAPAS };
