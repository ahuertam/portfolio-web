/**
 * Registro de conceptos.
 *
 * Cambiar de concepto = cambiar la constante ACTIVO de aquí abajo.
 * Los módulos de los otros conceptos no se importan, así que no entran en el
 * bundle y no cuestan nada en descarga.
 *
 * Ver CONCEPTOS.md.
 */

/**
 * Concepto activo. Para el futuro: 'grafo' | 'editor' | 'pipeline' | 'estudio' | 'nivel'.
 */
export const ACTIVO = 'grafo';

/**
 * Sólo se importa el módulo del concepto activo. Los demás quedan en el disco
 * pero fuera del bundle.
 */
const MODULOS = {
  grafo: () => import('./grafo/concepto.js'),
  editor: () => import('./editor/concepto.js'),
  pipeline: () => import('./pipeline/concepto.js'),
  // estudio: () => import('./estudio/concepto.js'),
  // nivel:   () => import('./nivel/concepto.js'),
};

export async function cargarConcepto(id = ACTIVO) {
  const cargador = MODULOS[id];
  if (!cargador) {
    throw new Error(
      `Concepto desconocido: "${id}". Disponibles: ${Object.keys(MODULOS).join(', ')}`
    );
  }
  return cargador();
}
