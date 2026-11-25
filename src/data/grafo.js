/**
 * Datos del grafo: qué tipo de nodo es cada proyecto, en qué carril vive y
 * qué relaciones hay entre ellos.
 *
 * Está aparte de `projects.js` a propósito: el dataset de proyectos describe
 * QUÉ es cada cosa; este describe CÓMO se coloca en el grafo. Son dos
 * preguntas distintas y así se editan por separado.
 *
 * Los cuatro tipos de nodo son los mismos del editor de la Forja
 * (`gamelearn/the-adventure-forge`): cada uno con su color, que es lo que
 * permite leer el grafo de un vistazo sin leer una etiqueta.
 */

/**
 * Tipos de nodo. `borde` es el color de la ficha; `texto` es una versión
 * aclarada del mismo color para la etiqueta, que tiene que cumplir contraste
 * AA sobre el fondo de la ficha (el color original no llegaba).
 */
export const TIPOS = {
  act: {
    id: 'act',
    nombre: 'Plataforma y trayectoria',
    borde: '#7c5cbf',
    texto: '#b39ae8',
  },
  puzzle: {
    id: 'puzzle',
    nombre: 'Problema resuelto',
    borde: '#bf7c5c',
    texto: '#e0a67e',
  },
  dialog: {
    id: 'dialog',
    nombre: 'IA y agentes',
    borde: '#5cbf7c',
    texto: '#7fd6a4',
  },
  scene: {
    id: 'scene',
    nombre: 'Producto 3D',
    borde: '#5c9abf',
    texto: '#85b8d6',
  },
};

/**
 * Carriles: las columnas del grafo. Como en la Forja, un carril es un tipo
 * de trabajo, no un proyecto.
 */
export const CARRILES = [
  { id: 'producto', nombre: 'Producto 3D', x: 0 },
  { id: 'ia', nombre: 'IA y agentes', x: 1 },
  { id: 'herramientas', nombre: 'Herramientas', x: 2 },
  { id: 'trayectoria', nombre: 'Trayectoria', x: 3 },
];

/**
 * De qué tipo es cada nodo y en qué carril va.
 *
 * La clave es el `id` del proyecto. Los que no están aquí se colocan solos:
 * el README en el carril de trayectoria y el resto en el que le toque por
 * ámbito.
 */
export const NODOS = {
  // Producto 3D
  'three-roads': { tipo: 'scene', carril: 'producto' },
  edutika: { tipo: 'scene', carril: 'producto' },
  roadrol: { tipo: 'scene', carril: 'producto' },
  imagetron: { tipo: 'scene', carril: 'producto' },

  // IA y agentes
  'godkai-back': { tipo: 'dialog', carril: 'ia' },
  mai: { tipo: 'dialog', carril: 'ia' },
  frodo: { tipo: 'dialog', carril: 'ia' },
  'ai-radar': { tipo: 'dialog', carril: 'ia' },

  // Herramientas
  fotoverse: { tipo: 'puzzle', carril: 'herramientas' },
  akai25: { tipo: 'puzzle', carril: 'herramientas' },
  freeaiapis: { tipo: 'puzzle', carril: 'herramientas' },

  // Trayectoria
  intro: { tipo: 'act', carril: 'trayectoria' },
  'editor-autoria': { tipo: 'act', carril: 'trayectoria' },
  'runtime-webgl': { tipo: 'act', carril: 'trayectoria' },
  'api-plataforma': { tipo: 'act', carril: 'trayectoria' },
  ibm: { tipo: 'act', carril: 'trayectoria' },
  'ia-conversacional': { tipo: 'act', carril: 'trayectoria' },
};

/**
 * Aristas: relaciones reales entre proyectos.
 *
 * Esto es lo que un listado de bullets no puede decir. La etiqueta explica
 * la relación en palabras, no la category: "degradar en vez de fallar" dice
 * algo; "relacionado" no dice nada.
 */
export const ARISTAS = [
  { de: 'intro', a: 'editor-autoria', etiqueta: 'donde empezó' },
  { de: 'ibm', a: 'api-plataforma', etiqueta: 'seguridad antes que producto' },
  { de: 'api-plataforma', a: 'editor-autoria', etiqueta: 'el contrato que lo sostiene' },
  { de: 'editor-autoria', a: 'runtime-webgl', etiqueta: 'el editor alimenta el runtime' },
  { de: 'editor-autoria', a: 'ia-conversacional', etiqueta: 'el mismo equipo' },
  { de: 'runtime-webgl', a: 'ia-conversacional', etiqueta: 'tiempo real' },
  { de: 'ia-conversacional', a: 'godkai-back', etiqueta: 'la línea que lidero' },
  { de: 'mai', a: 'godkai-back', etiqueta: 'del terminal a producción' },
  { de: 'fotoverse', a: 'godkai-back', etiqueta: 'degradar en vez de fallar' },
  { de: 'ai-radar', a: 'mai', etiqueta: 'qué modelo usar' },
  { de: 'freeaiapis', a: 'mai', etiqueta: 'APIs sin coste' },
  { de: 'frodo', a: 'mai', etiqueta: 'agentes en Python' },
  { de: 'akai25', a: 'godkai-back', etiqueta: 'tiempo real: MIDI → voz' },
  { de: 'edutika', a: 'three-roads', etiqueta: '41 minijuegos en 3D' },
  { de: 'roadrol', a: 'edutika', etiqueta: 'PWA y minijuegos' },
  { de: 'three-roads', a: 'imagetron', etiqueta: 'Three.js → splatting' },
];

/** Tipo de un nodo, con el color ya resuelto. */
export function tipoDe(id) {
  return TIPOS[NODOS[id]?.tipo] ?? TIPOS.act;
}

/** Carril de un nodo. */
export function carrilDe(id) {
  return NODOS[id]?.carril ?? 'trayectoria';
}
