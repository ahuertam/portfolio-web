/**
 * Prueba del arranque de la escena con un contexto WebGL simulado.
 *
 * El objetivo no es comprobar el render (eso necesita una GPU), sino que TODO
 * el código que va antes del primer fotograma se ejecuta sin lanzar
 * excepciones: construcción de la escena, luces, cámara, geometría, texturas
 * de las etiquetas y el primer `render()`.
 *
 * Es la forma de verificar el camino con WebGL en un entorno donde la GPU no
 * está disponible (CI, contenedores, el Chrome de una sesión remota).
 *
 * Ejecutar: `node scripts/probar-escena-webgl.mjs`
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// El mismo Three.js que usa el concepto: una sola copia en memoria.
const THREE = await import('three');

/* -------------------------------------------------------------------------
 * Stub de WebGL: implementa lo justo que Three.js necesita para crear un
 * renderer y pintar un fotograma.
 * ---------------------------------------------------------------------- */

function crearContextoGL() {
  const noop = () => {};

  // Three.js consulta varios parámetros con getParameter(). Estos son los que
  // espera recibir como cadena o como array.
  const PARAMETROS = {
    0x1f00: 'WebGL (simulado)',
    0x1f01: 'ANGLE (simulado, Metal)',
    0x1f02: 'WebGL 1.0 (simulado)',
    0x8b8c: 'WebGL GLSL ES 1.0 (simulado)',
    0x8b4d: 8,
    0x8b4c: 8,
    0x8872: 16,
    0x8869: 16,
    0x8dfb: new Int32Array([16, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]),
    0x8dfc: new Int32Array([16, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]),
    0x8dfd: new Int32Array([16, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]),
    0x84e8: 4096,
    0x0d3a: new Int32Array([4096, 4096]),
    0x846e: new Float32Array([1, 1]),
    0x846d: new Float32Array([1, 255]),
    0x84ff: 16,
    0x8b5c: 32768,
    0x0d33: 16,
    0x851c: 16,
  };

  return {
    canvas: { width: 800, height: 600, style: {} },

    // Three.js lee estas constantes como propiedades del contexto.
    VERSION: 0x1f02,
    VENDOR: 0x1f00,
    RENDERER: 0x1f01,
    SHADING_LANGUAGE_VERSION: 0x8b8c,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8b4d,
    MAX_TEXTURE_IMAGE_UNITS: 0x8872,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
    MAX_CUBE_MAP_TEXTURE_IMAGE_UNITS: 0x851c,
    MAX_RENDERBUFFER_SIZE: 0x84e8,
    MAX_VIEWPORT_DIMS: 0x0d3a,
    MAX_VERTEX_ATTRIBS: 0x8869,
    MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb,
    MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfd,
    MAX_VARYING_VECTORS: 0x8dfc,
    MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84ff,
    ALIASED_LINE_WIDTH_RANGE: 0x846e,
    ALIASED_POINT_SIZE_RANGE: 0x846d,
    MAX_VIEWPORT_DIMS_: 0x0d3a,

    getExtension: () => null,
    getParameter: (p) => (p in PARAMETROS ? PARAMETROS[p] : 0),
    getShaderPrecisionFormat: () => ({ precision: 23, rangeMin: 127, rangeMax: 127 }),
    getSupportedExtensions: () => [],
    createBuffer: () => ({}),
    createFramebuffer: () => ({}),
    createProgram: () => ({}),
    createRenderbuffer: () => ({}),
    createShader: () => ({}),
    createTexture: () => ({}),
    createVertexArray: () => ({}),
    bindBuffer: noop,
    bindFramebuffer: noop,
    bindRenderbuffer: noop,
    bindTexture: noop,
    bindVertexArray: noop,
    bufferData: noop,
    bufferSubData: noop,
    checkFramebufferStatus: () => 36053,
    clear: noop,
    clearColor: noop,
    colorMask: noop,
    compileShader: noop,
    compressedTexImage2D: noop,
    compressedTexSubImage2D: noop,
    copyTexImage2D: noop,
    copyTexSubImage2D: noop,
    createBuffer: () => ({}),
    cullFace: noop,
    deleteBuffer: noop,
    deleteFramebuffer: noop,
    deleteProgram: noop,
    deleteRenderbuffer: noop,
    deleteShader: noop,
    deleteTexture: noop,
    deleteVertexArray: noop,
    depthFunc: noop,
    depthMask: noop,
    disable: noop,
    disableVertexAttribArray: noop,
    drawArrays: noop,
    drawElements: noop,
    enable: noop,
    enableVertexAttribArray: noop,
    finish: noop,
    flush: noop,
    frontFace: noop,
    generateMipmap: noop,
    getAttribLocation: () => 0,
    getContextAttributes: () => ({ alpha: false, depth: true, stencil: false, antialias: true }),
    getProgramInfoLog: () => '',
    getProgramParameter: () => 1,
    getShaderInfoLog: () => '',
    getShaderParameter: () => 1,
    getUniformLocation: () => ({}),
    hint: noop,
    lineWidth: noop,
    linkProgram: noop,
    pixelStorei: noop,
    polygonOffset: noop,
    readPixels: noop,
    renderbufferStorage: noop,
    sampleCoverage: noop,
    scissor: noop,
    shaderSource: noop,
    stencilFunc: noop,
    stencilMask: noop,
    stencilOp: noop,
    texImage2D: noop,
    texParameteri: noop,
    texSubImage2D: noop,
    uniform1f: noop,
    uniform1i: noop,
    uniform1iv: noop,
    uniform2f: noop,
    uniform2fv: noop,
    uniform3f: noop,
    uniform3fv: noop,
    uniform4f: noop,
    uniform4fv: noop,
    uniformMatrix3fv: noop,
    uniformMatrix4fv: noop,
    useProgram: noop,
    validateProgram: noop,
    vertexAttribPointer: noop,
    viewport: noop,
    drawBuffers: noop,
    isContextLost: () => false,

    // Métodos de WebGL2.
    texImage3D: noop,
    texSubImage3D: noop,
    texStorage2D: noop,
    texStorage3D: noop,
    bindVertexArray: noop,
    deleteVertexArray: noop,
    drawArraysInstanced: noop,
    drawElementsInstanced: noop,
    blitFramebuffer: noop,
    framebufferTexture2D: noop,
    framebufferRenderbuffer: noop,
    getInternalformatParameter: () => [],
    getActiveUniform: () => ({ name: 'u', type: 0, size: 1 }),
    getActiveAttrib: () => ({ name: 'a', type: 0, size: 1 }),
    getUniformBlockIndex: () => 0,
    getActiveUniformBlockName: () => '',
    uniformBlockBinding: noop,
    transformFeedbackVaryings: noop,
    beginTransformFeedback: noop,
    endTransformFeedback: noop,
    bindBufferBase: noop,
    bindBufferRange: noop,
    fenceSync: () => ({}),
    clientWaitSync: () => 0,
    deleteSync: noop,
    isSync: () => false,
    texParameterfv: noop,
    texParameteriv: noop,
    getTexParameter: () => 0,
    getUniform: () => ({}),
    getActiveUniforms: () => [],
    readBuffer: noop,
    invalidateFramebuffer: noop,
    invalidateSubFramebuffer: noop,
    copyBufferSubData: noop,

    // Métodos de estado y limpieza que faltaban.
    clearDepth: noop,
    clearStencil: noop,
    depthRange: noop,
    depthMask: noop,
    colorMask: noop,
    stencilMask: noop,
    stencilFunc: noop,
    stencilOp: noop,
    blendEquation: noop,
    blendFunc: noop,
    blendFuncSeparate: noop,
    blendEquationSeparate: noop,
    blendColor: noop,
    cullFace: noop,
    frontFace: noop,
    activeTexture: noop,
    pixelStorei: noop,
    readPixels: noop,
    sampleCoverage: noop,
    getError: () => 0,
    getProgramInfoLog: () => '',
    getContextAttributes: () => ({
      alpha: false,
      depth: true,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
    }),

    // Compilación de shaders y enlace de programas.
    attachShader: noop,
    detachShader: noop,
    getAttachedShaders: () => [],
    getShaderSource: () => '',
    getProgramInfoLog: () => '',
    isProgram: () => true,
    isShader: () => true,
    isBuffer: () => true,
    isTexture: () => true,
    isFramebuffer: () => true,
    isRenderbuffer: () => true,
    isVertexArray: () => true,
    getActiveUniformBlockParameter: () => 0,
    getUniformIndices: () => [],
    getActiveAttribs: () => [],
  };
}

/* -------------------------------------------------------------------------
 * Stub de DOM
 * ---------------------------------------------------------------------- */

const eventos = new Map();

/** Contexto 2D mínimo: sólo para poder pintar las etiquetas de texto. */
function crearContexto2D() {
  const noop = () => {};
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    beginPath: noop,
    moveTo: noop,
    arcTo: noop,
    closePath: noop,
    fill: noop,
    stroke: noop,
    fillText: noop,
    strokeText: noop,
    measureText: () => ({ width: 10 }),
    save: noop,
    restore: noop,
    scale: noop,
    translate: noop,
    clearRect: noop,
    fillRect: noop,
    drawImage: noop,
  };
}

globalThis.document = {
  createElement(tipo) {
    if (tipo === 'canvas') {
      return {
        width: 0,
        height: 0,
        style: {},
        clientWidth: 800,
        clientHeight: 600,
        parentElement: { clientWidth: 800, clientHeight: 600 },
        getContext: (tipoCtx) =>
          tipoCtx === '2d' ? crearContexto2D() : crearContextoGL(),
        addEventListener() {},
        removeEventListener() {},
        setAttribute() {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      };
    }
    // Un elemento de mentira con lo que el código realmente toca. Antes esto
    // devolvía `{}` y reventaba en cuanto algo asignaba `dataset` o añadía
    // hijos, lo que hacía que el test no llegara ni a la mitad.
    return {
      tagName: String(tipo).toUpperCase(),
      dataset: {},
      style: { setProperty() {}, removeProperty() {} },
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      children: [],
      textContent: '',
      innerHTML: '',
      hidden: false,
      append(...nodos) {
        this.children.push(...nodos);
      },
      appendChild(nodo) {
        this.children.push(nodo);
        return nodo;
      },
      setAttribute() {},
      getAttribute: () => null,
      removeAttribute() {},
      addEventListener() {},
      removeEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
      closest: () => null,
      focus() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, x: 0, y: 0 }),
    };
  },
  getElementById: () => null,
  querySelector: () => null,
  addEventListener() {},
  removeEventListener() {},
  // Three.js lo usa para crear elementos SVG/canvas con espacio de nombres.
  createElementNS(ns, tipo) {
    return globalThis.document.createElement(tipo);
  },
};

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener: (tipo, fn) => eventos.set(tipo, fn),
  removeEventListener: (tipo) => eventos.delete(tipo),
  matchMedia: (q) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }),
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  setTimeout,
  clearTimeout,
  // El editor lee el hash de la URL (deep links) y lo escribe con
  // history.replaceState.
  location: { hash: '', pathname: '/', search: '' },
  history: { replaceState() {} },
};

globalThis.self = globalThis.window;
globalThis.HTMLCanvasElement = globalThis.document.createElement('canvas').constructor;

// requestAnimationFrame es un global en el navegador, no una propiedad de window.
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

/* -------------------------------------------------------------------------
 * Prueba
 * ---------------------------------------------------------------------- */

// Se usa el mismo módulo de Three.js que el concepto, para no cargar dos
// copias (que es lo que provoca el aviso "Multiple instances of Three.js").
const { construirGrupo } = await import(
  resolve(RAIZ, 'src/concepts/editor/concepto.js')
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

console.log('\n=== Prueba de arranque de la escena (WebGL simulado) ===\n');

const concepto = await import(
  resolve(RAIZ, 'src/concepts/editor/concepto.js')
);

const lienzo = globalThis.document.createElement('canvas');
const lienzoReal = {
  ...lienzo,
  clientWidth: 800,
  clientHeight: 600,
  getContext: () => crearContextoGL(),
  addEventListener(tipo, fn) {
    eventos.set('canvas:' + tipo, fn);
  },
  removeEventListener(tipo) {
    eventos.delete('canvas:' + tipo);
  },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
};

let instancia = null;
let error = null;
try {
  instancia = concepto.create(lienzoReal, { onSeleccion() {} });
} catch (e) {
  error = e;
}

comprobar('La escena se crea sin lanzar excepciones', error === null, error?.message);

if (instancia) {
  comprobar('Devuelve un manejador con nucleo', !!instancia.nucleo);
  comprobar('Devuelve un método dispose', typeof instancia.dispose === 'function');

  const info = instancia.nucleo.renderer.info;
  comprobar('El renderer tiene información de render', !!info);
  console.log(
    `  (info) draw calls: ${info.render.calls}, geometrías: ${info.memory.geometries}, texturas: ${info.memory.textures}`
  );
  comprobar(
    'Se han creado geometrías',
    info.memory.geometries > 0,
    `${info.memory.geometries}`
  );

  // Se simula un clic en el lienzo: el manejador no debe lanzar.
  let errorClic = null;
  try {
    eventos.get('canvas:click')?.({ clientX: 400, clientY: 300 });
  } catch (e) {
    errorClic = e;
  }
  comprobar('El manejador de clic no lanza excepciones', errorClic === null, errorClic?.message);

  // Se comprueba el resize.
  let errorResize = null;
  try {
    eventos.get('resize')?.();
  } catch (e) {
    errorResize = e;
  }
  comprobar('El manejador de resize no lanza excepciones', errorResize === null, errorResize?.message);

  /* --- Encuadre: ¿se ven todos los assets desde la cámara inicial? -------- */
  const { INTRO, TODOS } = await import(resolve(RAIZ, 'src/data/projects.js'));

  const { activos } = construirGrupo([INTRO, ...TODOS]);

  // La cámara inicial, tal y como la monta el concepto: el plano general.
  const camara = new THREE.PerspectiveCamera(48, 800 / 600, 0.1, 220);
  camara.position
    .setFromSpherical(new THREE.Spherical(34, 1.05, 0.62))
    .add(new THREE.Vector3(0, 0.6, 0));
  camara.lookAt(new THREE.Vector3(0, 0.6, 0));
  camara.updateMatrixWorld(true);
  camara.updateProjectionMatrix();

  const fueraDeCuadro = [];
  for (const activo of activos) {
    const p = new THREE.Vector3(activo.x, 0.7, activo.z).project(camara);
    // Fuera del encuadre si sale del cubo [-1, 1] en X o Y.
    if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1) {
      fueraDeCuadro.push(
        `${activo.dato.nombre} (x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)})`
      );
    }
  }
  comprobar(
    `Todos los assets están dentro del encuadre inicial (${fueraDeCuadro.length} fuera)`,
    fueraDeCuadro.length === 0,
    fueraDeCuadro.join('; ')
  );

  // El plano de trabajo completo debe caber en el campo de visión.
  const extremos = [-14, 14].map((x) => {
    const p = new THREE.Vector3(x, 0.7, 6.4).project(camara);
    return p.x;
  });
  comprobar(
    `El plano de trabajo cabe en el encuadre (x de ${extremos[0].toFixed(2)} a ${extremos[1].toFixed(2)})`,
    extremos.every((x) => Math.abs(x) <= 1)
  );

  // Y el encuadre cercano de un asset tiene que meterlo en el cuadro.
  const malEncuadrados = [];
  for (const activo of activos) {
    const mirada = new THREE.Vector3(activo.x, 0.63, activo.z);
    const cam = new THREE.PerspectiveCamera(48, 800 / 600, 0.1, 220);
    cam.position.setFromSpherical(new THREE.Spherical(7.4, 1.12, 0.62)).add(mirada);
    cam.lookAt(mirada);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    const p = new THREE.Vector3(activo.x, 1.2, activo.z).project(cam);
    if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) {
      malEncuadrados.push(activo.dato.nombre);
    }
  }
  comprobar(
    `El encuadre cercano mete cada asset en el cuadro (${malEncuadrados.length} mal)`,
    malEncuadrados.length === 0,
    malEncuadrados.join('; ')
  );

  instancia.dispose();
  comprobar('dispose() no lanza excepciones', true);
}

console.log(`\n=== ${total - fallos}/${total} comprobaciones superadas ===\n`);
process.exit(fallos > 0 ? 1 : 0);
