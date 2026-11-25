/**
 * ARQUETIPOS — las representaciones 3D reutilizables del concepto "El editor".
 *
 * Un arquetipo es una forma física de mostrar un proyecto en el viewport. Este
 * fichero contiene la geometría; la decisión de qué arquetipo usa cada
 * proyecto está en los DATOS (`src/data/projects.js`, campo `arquetipo`).
 *
 * La regla del concepto: **cambiar de arquetipo es cambiar datos, no código**.
 * Aquí sólo hay una función por arquetipo y una tabla que las enumera. Añadir
 * un proyecto no añade geometría; cambiar la geometría de un arquetipo sólo
 * se toca aquí.
 *
 * Lo que estas formas representan es una METÁFORA, no una réplica: no hay
 * functionality en la escena, no hay botones que hagan nada. La escena evoca;
 * el inspector (HTML) es el que cuenta la verdad.
 */

import * as THREE from 'three';

/* --------------------------------------------------------------------------
 * Medidas compartidas
 *
 * Todos los arquetipos se construyen con el mismo "radio" para que quepan en
 * el encuadre y se puedan comparar de un vistazo. Es el equivalente visual de
 * una celda en una rejilla de assets.
 * -------------------------------------------------------------------------- */

export const RADIO = 1.35;   // radio de la esfera que envuelve cada arquetipo
export const ALTURA = 1.05;  // media altura del arquetipo sobre el suelo

/* --------------------------------------------------------------------------
 * Materiales
 *
 * Se crean por llamada, no compartidos entre arquetipos: cada representación
 * tiene su propio material para poder animarlo (resaltado) sin tocar el
 * estado de los demás.
 * -------------------------------------------------------------------------- */

function materialBase(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.18,
    emissive: new THREE.Color(color).multiplyScalar(0.16),
  });
}

/** Material para las partes "secundarias" de un arquetipo (detalles, marco). */
function materialSecundario(color) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.55),
    roughness: 0.6,
    metalness: 0.3,
  });
}

/* --------------------------------------------------------------------------
 * Geometrías compartidas por arquetipo
 * -------------------------------------------------------------------------- */

const geo = {
  lamina: new THREE.BoxGeometry(2.1, 0.12, 1.5),
  marco: new THREE.BoxGeometry(2.3, 0.16, 1.7),
  poste: new THREE.CylinderGeometry(0.09, 0.09, 1, 8),
  cubo: new THREE.BoxGeometry(0.52, 0.52, 0.52),
  esfera: new THREE.SphereGeometry(0.16, 10, 8),
  cilindro: new THREE.CylinderGeometry(0.26, 0.26, 0.7, 14),
  barra: new THREE.BoxGeometry(0.16, 0.16, 2.4),
  cuboPapelera: new THREE.BoxGeometry(0.72, 0.9, 0.72),
  aro: new THREE.TorusGeometry(0.42, 0.05, 8, 24),
  cresta: new THREE.BoxGeometry(0.13, 0.13, 0.13),
  via: new THREE.BoxGeometry(3.4, 0.09, 0.42),
  linea: new THREE.BoxGeometry(0.1, 0.02, 3.2),
  celda: new THREE.BoxGeometry(0.44, 0.44, 0.06),
};

/* --------------------------------------------------------------------------
 * Utilidades
 * -------------------------------------------------------------------------- */

/**
 * Anida mallas en un grupo para poder mover la representación entera.
 * @param {THREE.BufferGeometry} g
 * @param {THREE.Material} m
 * @param {[number,number,number]} [pos]
 * @param {[number,number,number]} [rot]
 */
function pieza(g, m, pos, rot) {
  const mesh = new THREE.Mesh(g, m);
  if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Coloca una figura en la superficie de un arco: útil para las ondas y la
 * línea de hitos, donde las piezas se alinean sobre una curva.
 */
function sobreArco(grupo, indice, total, radioX, radioZ, alto, g, m, escala = 1) {
  const t = total <= 1 ? 0 : indice / (total - 1);
  const angulo = -Math.PI / 2 + t * Math.PI;
  const mesh = pieza(g, m);
  mesh.position.set(
    Math.cos(angulo) * radioX,
    alto,
    Math.sin(angulo) * radioZ
  );
  mesh.scale.setScalar(escala);
  grupo.add(mesh);
  return mesh;
}

/* --------------------------------------------------------------------------
 * ARQUETIPO: placa — el README de la intro
 * -------------------------------------------------------------------------- */

function construirPlaca(color) {
  const grupo = new THREE.Group();
  const mat = materialBase(color);
  const matSec = materialSecundario(color);

  // La placa: dos láminas, como una hoja de texto con su marco.
  const marco = pieza(geo.marco, matSec, [0, 0.02, 0]);
  grupo.add(marco);

  const lamina = pieza(geo.lamina, mat, [0, 0.16, 0]);
  grupo.add(lamina);

  // Tres renglones: el texto del README, abstraído a barras.
  for (let i = 0; i < 3; i++) {
    const largo = i === 2 ? 1.1 : 1.75;
    const renglon = new THREE.Mesh(
      new THREE.BoxGeometry(largo, 0.035, 0.06),
      materialSecundario(color)
    );
    renglon.position.set(-(1.75 - largo) / 2 - 0.0, 0.24, -0.42 + i * 0.14);
    grupo.add(renglon);
  }

  return grupo;
}

/* --------------------------------------------------------------------------
 * ARQUETIPO: fotos — pila de planos con papelera
 *
 * Evoca fotoverse: la app que revisa tu biblioteca y decide qué duplicados
 * sobran. De ahí la pila de planos y, al lado, la papelera: el borrado va
 * siempre a la papelera del sistema, nunca es permanente.
 * -------------------------------------------------------------------------- */

function construirFotos(color) {
  const grupo = new THREE.Group();
  const mat = materialBase(color);
  const matSec = materialSecundario(color);

  // La pila: planos apilados, cada uno un poco girado.
  const planoGeo = new THREE.BoxGeometry(1.15, 0.055, 0.85);
  for (let i = 0; i < 6; i++) {
    const plano = new THREE.Mesh(planoGeo, i % 2 === 0 ? mat : matSec);
    plano.position.set(
      Math.sin(i * 1.7) * 0.09,
      0.06 + i * 0.075,
      Math.cos(i * 2.3) * 0.07
    );
    plano.rotation.y = i * 0.26;
    plano.castShadow = true;
    plano.receiveShadow = true;
    grupo.add(plano);
  }

  // La papelera: un cubo hueco con un aro. Es el detalle que define la
  // metáfora, no una función.
  const papelera = new THREE.Group();
  papelera.position.set(1.05, 0, 0.16);

  const cuerpo = pieza(geo.cuboPapelera, matSec, [0, 0.45, 0]);
  papelera.add(cuerpo);

  const aroPapelera = pieza(geo.aro, mat, [0, 0.92, 0], [Math.PI / 2, 0, 0]);
  papelera.add(aroPapelera);

  // Un plano a medio caer dentro: lo que se va a la papelera.
  const dentro = new THREE.Mesh(planoGeo, mat);
  dentro.position.set(0.1, 0.86, 0.06);
  dentro.rotation.set(0.5, 0.6, 0.3);
  papelera.add(dentro);

  grupo.add(papelera);
  return grupo;
}

/* --------------------------------------------------------------------------
 * ARQUETIPO: ondas — ondas de voz
 *
 * Evoca godKAI-back y la línea de IA conversacional: la voz entra, se procesa
 * y sale. Tres crestas apiladas, de menor a mayor.
 * -------------------------------------------------------------------------- */

function construirOndas(color) {
  const grupo = new THREE.Group();
  const mat = materialBase(color);
  const matSec = materialSecundario(color);

  // Tres crestas de onda, cada una una fila de cajas de altura variable.
  for (let fila = 0; fila < 3; fila++) {
    const y = 0.12 + fila * 0.36;
    const escala = 1 - fila * 0.22;
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      // Perfil de onda: seno amortiguado, como una forma de voz.
      const alt = (0.12 + Math.abs(Math.sin(t * Math.PI * 2.1 + fila * 0.6)) * 0.5) * escala;
      const cresta = pieza(
        geo.cresta,
        fila === 1 ? mat : matSec,
        [-1.1 + i * 0.275, y + alt / 2, -0.35 + fila * 0.35]
      );
      cresta.scale.set(1, alt / 0.13, 1);
      grupo.add(cresta);
    }
  }

  // Una base: de dónde sale la voz.
  const base = pieza(geo.cilindro, matSec, [0, 0.07, -0.35]);
  base.scale.set(1, 0.22, 1);
  grupo.add(base);

  return grupo;
}

/* --------------------------------------------------------------------------
 * ARQUETIPO: carril — un carril en perspectiva
 *
 * Evoca Three Roads: una pista por la que se circula. Dos vías paralelas y
 * marcas que se alejan.
 * -------------------------------------------------------------------------- */

function construirCarril(color) {
  const grupo = new THREE.Group();
  const mat = materialBase(color);
  const matSec = materialSecundario(color);

  // Las dos vías, en perspectiva: se abren hacia el fondo.
  for (const x of [-0.42, 0.42]) {
    const via = pieza(geo.via, matSec, [x, 0.05, 0]);
    via.rotation.y = x > 0 ? 0.06 : -0.06;
    via.receiveShadow = true;
    grupo.add(via);
  }

  // Las marcas: postes a lo largo del recorrido, más altos al fondo.
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const z = 1.1 - t * 2.2;
    const alto = 0.3 + t * 0.55;
    for (const x of [-0.52, 0.52]) {
      const poste = pieza(geo.poste, mat, [x, alto / 2, z]);
      poste.scale.set(1, alto, 1);
      grupo.add(poste);
    }
    // La línea central, troceada.
    if (i % 2 === 0) {
      const trazo = new THREE.Mesh(geo.linea, matSec);
      trazo.position.set(0, 0.11, z);
      trazo.scale.set(1, 1, 0.5);
      grupo.add(trazo);
    }
  }

  return grupo;
}

/* --------------------------------------------------------------------------
 * ARQUETIPO: rejilla — rejilla de mini-juegos
 *
 * Evoca Edutika: 43 minijuegos, cada uno su celda. Y a los proyectos que son
 * un catálogo (freeAIApis, AI Radar, Frodo).
 * -------------------------------------------------------------------------- */

function construirRejilla(color) {
  const grupo = new THREE.Group();
  const mat = materialBase(color);
  const matSec = materialSecundario(color);

  const columnas = 4;
  const filas = 3;
  const paso = 0.62;
  const separacionX = (columnas - 1) * paso * 0.5;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const celda = pieza(
        geo.celda,
        (f + c) % 3 === 0 ? mat : matSec,
        [-separacionX + c * paso, 0.28 + f * 0.14, -(filas - 1) * 0.34 + f * 0.34]
      );
      celda.rotation.x = -0.5;
      grupo.add(celda);
    }
  }

  // El marco de la rejilla: una caja abierta por debajo.
  for (const x of [-separacionX - 0.36, separacionX + 0.36]) {
    grupo.add(pieza(geo.barra, matSec, [x, 0.14, 0]));
  }

  return grupo;
}

/* --------------------------------------------------------------------------
 * ARQUETIPO: nube — nube de puntos
 *
 * Evoca ImageTron (una imagen que se convierte en un mundo) y a los proyectos
 * que operan sobre datos sueltos (MAI, el runtime WebGL).
 * -------------------------------------------------------------------------- */

function construirNube(color) {
  const grupo = new THREE.Group();
  const mat = materialBase(color);
  const matSec = materialSecundario(color);

  // Puntos dispersos en un volumen. La forma es irregular a propósito: es
  // una nube, no una esfera.
  const total = 34;
  for (let i = 0; i < total; i++) {
    // Determinista: la misma nube en cada carga, sin Math.random.
    const a = (i * 2.39996) % (Math.PI * 2);
    const t = i / total;
    const radio = 0.35 + Math.sin(t * Math.PI) * 0.85;
    const x = Math.cos(a) * radio;
    const z = Math.sin(a) * radio;
    const y = 0.2 + ((i * 37) % 11) / 11 * 1.1;

    const punto = pieza(geo.esfera, i % 4 === 0 ? mat : matSec, [x, y, z]);
    const escala = 0.6 + ((i * 13) % 7) / 7;
    punto.scale.setScalar(escala);
    grupo.add(punto);
  }

  // Un volumen de rejilla que lo envuelve: la "nube" tiene bordes.
  const contenedor = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.3, 1.9),
    new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    })
  );
  contenedor.position.set(0, 0.72, 0);
  grupo.add(contenedor);

  return grupo;
}

/* --------------------------------------------------------------------------
 * ARQUETIPO: linea — línea de tiempo de hitos
 *
 * Evoca las piezas de trayectoria, que son historia: hitos alineados en el
 * tiempo, de izquierda a derecha, con un surco que los une.
 * -------------------------------------------------------------------------- */

function construirLinea(color) {
  const grupo = new THREE.Group();
  const mat = materialBase(color);
  const matSec = materialSecundario(color);

  // El surco: la línea del tiempo.
  const surco = pieza(geo.barra, matSec, [0, 0.06, 0]);
  surco.scale.set(1, 0.6, 1.9);
  grupo.add(surco);

  // Los hitos, sobre una curva suave para que la línea se lea como recorrido.
  const hitos = 5;
  for (let i = 0; i < hitos; i++) {
    sobreArco(grupo, i, hitos, 1.05, 0.75, 0.16, geo.poste, mat, 0.6 + i * 0.08);
  }

  // Un hito final más alto: dónde estás ahora.
  const final = pieza(geo.cubo, mat, [1.05, 0.5, -0.75]);
  final.rotation.set(0.4, 0.6, 0.2);
  grupo.add(final);

  return grupo;
}

/* --------------------------------------------------------------------------
 * Tabla de arquetipos
 * -------------------------------------------------------------------------- */

const CONSTRUCTORES = {
  placa: construirPlaca,
  fotos: construirFotos,
  ondas: construirOndas,
  carril: construirCarril,
  rejilla: construirRejilla,
  nube: construirNube,
  linea: construirLinea,
};

/**
 * Construye la representación 3D de un elemento.
 *
 * @param {string} arquetipoId  Id del arquetipo (campo `arquetipo` del dato).
 * @param {number} color        Color en hexadecimal.
 * @returns {THREE.Group} Grupo con la representación.
 */
export function construirArquetipo(arquetipoId, color) {
  const constructor = CONSTRUCTORES[arquetipoId] ?? construirPlaca;
  return constructor(color);
}

/** Los ids de arquetipo que este módulo sabe construir. */
export const ARQUETIPOS_DISPONIBLES = Object.keys(CONSTRUCTORES);
