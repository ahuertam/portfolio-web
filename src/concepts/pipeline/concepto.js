/**
 * CONCEPTO 1 — EL PIPELINE (el implementado)
 *
 * Una cinta transportadora con cuatro estaciones: idea → prototipo → plataforma →
 * operación. Cada pieza es un proyecto o un bloque de trayectoria, y se mueve por
 * la cinta hasta la estación donde se detiene. Al stopped, se puede inspeccionar.
 *
 * Ver CONCEPTOS.md para la comparativa con los otros dos conceptos.
 *
 * Este módulo es autónomo: recibe los datos y devuelve una escena. No sabe
 * nada del HTML ni de la página.
 */

import * as THREE from 'three';
import { crearNucleo, crearPunteria } from '../../scene/nucleo.js';
import { ETAPAS, TODOS } from '../../data/projects.js';

export const id = 'pipeline';
export const etiqueta = 'El pipeline';
export const descripcion =
  'Cada proyecto avanza por cuatro estaciones: idea, prototipo, plataforma y operación.';

/* --------------------------------------------------------------------------
 * Paleta y medidas
 * -------------------------------------------------------------------------- */

const COLOR_FONDO = 0x0f1721;
const COLOR_CINTA = 0x1d2836;
const COLOR_RAIL = 0x35455a;
const COLOR_PIEZA = 0x5ee3c4;
const COLOR_PIEZA_TRABAJO = 0xf2b544;
const COLOR_ESTACION = 0x35455a;
const COLOR_ESTACION_ACTIVA = 0x5ee3c4;

const LARGO_CINTA = 46;      // unidades a lo largo del eje X
const ANCHO_CINTA = 3.2;     // ancho en Z
const Y_CINTA = 0;
const SEPARACION_ESTACIONES = 11; // distancia entre estaciones en X
const X_PRIMERA_ESTACION = -LARGO_CINTA / 2 + 4;

/* --------------------------------------------------------------------------
 * Geometrías compartidas
 *
 * Se crean una vez y se reutilizan: con 16 piezas y 4 estaciones, instanciar
 * geometría por pieza multiplicaría la memoria de la GPU sin necesidad.
 * -------------------------------------------------------------------------- */

function crearGeometrias() {
  return {
    pieza: new THREE.BoxGeometry(1.5, 0.9, 1.5),
    motor: new THREE.CylinderGeometry(0.42, 0.42, 1.1, 14),
    rueda: new THREE.CylinderGeometry(0.28, 0.28, 0.5, 12),
    poste: new THREE.BoxGeometry(0.22, 3.4, 0.22),
    marquesina: new THREE.BoxGeometry(4.6, 0.16, 4.4),
    suelo: new THREE.PlaneGeometry(LARGO_CINTA + 14, 22),
    cinta: new THREE.BoxGeometry(LARGO_CINTA, 0.18, ANCHO_CINTA),
    raiel: new THREE.BoxGeometry(LARGO_CINTA, 0.5, 0.18),
    tambor: new THREE.CylinderGeometry(0.6, 0.6, ANCHO_CINTA, 16),
  };
}

/* --------------------------------------------------------------------------
 * Construcción de la escena
 * -------------------------------------------------------------------------- */

/**
 * Construye el grupo con las estaciones y las piezas.
 * Se separa del render para poder montarla sin WebGL (en tests, por ejemplo).
 */
export function construirGrupo(datos) {
  const grupo = new THREE.Group();
  const geo = crearGeometrias();
  const piezas = [];

  const colorPieza = new THREE.Color(COLOR_PIEZA);
  const colorPiezaTrabajo = new THREE.Color(COLOR_PIEZA_TRABAJO);

  /* --- Suelo ------------------------------------------------------------ */
  const suelo = new THREE.Mesh(
    geo.suelo,
    new THREE.MeshStandardMaterial({
      color: 0x0c1219,
      roughness: 0.95,
      metalness: 0,
    })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = -1.15;
  suelo.receiveShadow = true;
  grupo.add(suelo);

  /* --- Estructura de la cinta ------------------------------------------- */
  const matCinta = new THREE.MeshStandardMaterial({
    color: COLOR_CINTA,
    roughness: 0.7,
    metalness: 0.25,
  });
  const matRail = new THREE.MeshStandardMaterial({
    color: COLOR_RAIL,
    roughness: 0.45,
    metalness: 0.6,
  });

  const cinta = new THREE.Mesh(geo.cinta, matCinta);
  cinta.position.set(0, Y_CINTA, 0);
  cinta.receiveShadow = true;
  grupo.add(cinta);

  for (const z of [-ANCHO_CINTA / 2 - 0.12, ANCHO_CINTA / 2 + 0.12]) {
    const raiel = new THREE.Mesh(geo.raiel, matRail);
    raiel.position.set(0, Y_CINTA + 0.18, z);
    grupo.add(raiel);
  }

  // Tambores de rodadura en los extremos.
  for (const x of [-LARGO_CINTA / 2, LARGO_CINTA / 2]) {
    const tambor = new THREE.Mesh(geo.tambor, matRail);
    tambor.rotation.x = Math.PI / 2;
    tambor.position.set(x, Y_CINTA, 0);
    grupo.add(tambor);
  }

  /* --- Estaciones ------------------------------------------------------- */
  const estaciones = [];
  ETAPAS.forEach((etapa, i) => {
    const x = X_PRIMERA_ESTACION + i * SEPARACION_ESTACIONES;

    const gEstacion = new THREE.Group();
    gEstacion.position.set(x, 0, 0);

    // Dos postes y una marquesina: cada estación es una estructura física,
    // no un texto flotante.
    for (const z of [-ANCHO_CINTA / 2 - 0.9, ANCHO_CINTA / 2 + 0.9]) {
      const poste = new THREE.Mesh(geo.poste, matRail);
      poste.position.set(0, 1.6, z);
      poste.castShadow = true;
      gEstacion.add(poste);
    }

    const matMarquesina = new THREE.MeshStandardMaterial({
      color: COLOR_ESTACION,
      roughness: 0.6,
      metalness: 0.3,
      emissive: new THREE.Color(COLOR_ESTACION_ACTIVA),
      emissiveIntensity: 0,
    });
    const marquesina = new THREE.Mesh(geo.marquesina, matMarquesina);
    marquesina.position.y = 3.3;
    gEstacion.add(marquesina);

    // Un farol: el color que marca la etapa.
    const matFarol = new THREE.MeshStandardMaterial({
      color: COLOR_ESTACION,
      roughness: 0.4,
      metalness: 0.2,
      emissive: new THREE.Color(COLOR_ESTACION_ACTIVA),
      emissiveIntensity: 0.35,
    });
    const farol = new THREE.Mesh(geo.motor, matFarol);
    farol.position.set(0, 3.9, 0);
    gEstacion.add(farol);

    grupo.add(gEstacion);
    estaciones.push({ x, grupo: gEstacion, marquesina, farol, matFarol, matMarquesina, etapa });
  });

  /* --- Piezas: los proyectos y los bloques de trayectoria --------------- */
  datos.forEach((dato, indice) => {
    const esTrabajo = dato.ambito === 'trabajo';
    const color = esTrabajo ? colorPiezaTrabajo : colorPieza;

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.15,
      emissive: color.clone().multiplyScalar(0.18),
    });

    const malla = new THREE.Mesh(geo.pieza, mat);
    malla.castShadow = true;
    malla.receiveShadow = true;

    // Cada pieza nace ya en la estación de su primera etapa: si no, todas
    // aparecerían apiladas en el origen y volarían hasta su sitio.
    const indicePrimeraEtapa = Math.max(
      0,
      ETAPAS.findIndex((e) => e.id === dato.etapas[0].id)
    );
    // Reparto en Z dentro de la cinta: las piezas que comparten estación se
    // separan un poco para que no se solapen.
    const desplazamientoZ = ((indice % 3) - 1) * 0.95;
    malla.position.set(
      X_PRIMERA_ESTACION + indicePrimeraEtapa * SEPARACION_ESTACIONES,
      Y_CINTA + 0.55,
      desplazamientoZ
    );

    // Etiqueta flotante con el nombre del proyecto.
    const etiqueta = crearEtiqueta(dato.nombre, esTrabajo);
    etiqueta.position.y = 1.35;
    malla.add(etiqueta);

    grupo.add(malla);

    piezas.push({
      malla,
      mat,
      etiqueta,
      dato,
      indice,
      // Cada pieza nace en la estación donde empieza su historia.
      etapaActual: 0,
      xObjetivo: X_PRIMERA_ESTACION,
      rotacionObjetivo: 0,
      estado: 'parada',
      resalte: 0,
    });
  });

  return { grupo, piezas, estaciones, geometrias: geo };
}

/**
 * Etiqueta de texto flotante sobre la pieza.
 * Se dibuja en un canvas y se usa como textura: es lo más barato que hay.
 */
function crearEtiqueta(texto, esTrabajo) {
  const lienzo = document.createElement('canvas');
  const escala = 2;
  lienzo.width = 512;
  lienzo.height = 96;
  const ctx = lienzo.getContext('2d');

  ctx.fillStyle = esTrabajo ? 'rgba(242,181,68,0.16)' : 'rgba(94,227,196,0.16)';
  ctx.strokeStyle = esTrabajo ? 'rgba(242,181,68,0.65)' : 'rgba(94,227,196,0.65)';
  ctx.lineWidth = 3;
  const x = 4;
  const y = 8;
  const w = 504;
  const h = 80;
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e8eef6';
  ctx.font = '600 40px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(recortar(texto, 18), 256, 48);

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;

  const malla = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.49),
    new THREE.MeshBasicMaterial({
      map: textura,
      transparent: true,
      depthWrite: false,
    })
  );
  return malla;
}

function recortar(texto, max) {
  return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
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
  escena.fog = new THREE.Fog(COLOR_FONDO, 26, 62);

  const camara = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
  // Encuadre inicial: la cinta entera (de -23 a +23) tiene que caber en
// pantalla, con la escena lejana y sin que falte ninguna pieza.
camara.position.set(0, 16, 42);
  camara.lookAt(0, 1, 0);

  // Luces
  escena.add(new THREE.HemisphereLight(0x9fc4e0, 0x0b0f14, 1.05));
  const clave = new THREE.DirectionalLight(0xffffff, 1.5);
  clave.position.set(9, 16, 12);
  clave.castShadow = true;
  clave.shadow.mapSize.set(1024, 1024);
  clave.shadow.camera.left = -30;
  clave.shadow.camera.right = 30;
  clave.shadow.camera.top = 22;
  clave.shadow.camera.bottom = -22;
  escena.add(clave);
  const relleno = new THREE.DirectionalLight(0x5ee3c4, 0.35);
  relleno.position.set(-14, 6, -10);
  escena.add(relleno);

  const { grupo, piezas, estaciones } = construirGrupo(TODOS);
  escena.add(grupo);

  /* --- Estado de la cámara --------------------------------------------- */
  const camaraObjetivo = { x: 0, y: 16, z: 42 };
  const miradaObjetivo = new THREE.Vector3(0, 1, 0);
  const mirada = new THREE.Vector3(0, 1, 0);

  // Colores reutilizables: en el bucle no se crea ningún objeto nuevo.
  const colorProyecto = new THREE.Color(COLOR_PIEZA);
  const colorTrabajo = new THREE.Color(COLOR_PIEZA_TRABAJO);

  /* --- Selección -------------------------------------------------------- */
  let seleccionada = null;
  const apuntar = crearPunteria(lienzo, camara);

  const objetosSeleccionables = piezas.map((p) => p.malla);

  function seleccionar(dato) {
    if (seleccionada === dato) return;
    seleccionada = dato;
    if (onSeleccion) onSeleccion(dato);
  }

  function alMover(evento) {
    const impacto = apuntar(evento, objetosSeleccionables);
    if (!impacto) {
      lienzo.style.cursor = 'grab';
      return;
    }
    const pieza = piezas.find((p) => p.malla === impacto.object);
    if (!pieza) return;
    lienzo.style.cursor = 'pointer';
  }

  function alClic(evento) {
    const impacto = apuntar(evento, objetosSeleccionables);
    if (!impacto) {
      seleccionar(null);
      return;
    }
    const pieza = piezas.find((p) => p.malla === impacto.object);
    if (!pieza) return;

    // Clic en una pieza: se avanza a la siguiente etapa en la que el proyecto
    // tiene algo que contar. Es el gesto central del concepto.
    const etapas = pieza.dato.etapas;
    const siguiente = (pieza.etapaActual + 1) % etapas.length;
    pieza.etapaActual = siguiente;
    const etapa = etapas[siguiente];
    pieza.xObjetivo = X_PRIMERA_ESTACION + indiceEtapa(etapa.id) * SEPARACION_ESTACIONES;
    pieza.estado = 'parada';
    seleccionar(pieza.dato);
    actualizarPanel(pieza.dato, etapa);
  }

  function indiceEtapa(idEtapa) {
    const i = ETAPAS.findIndex((e) => e.id === idEtapa);
    return i < 0 ? 0 : i;
  }

  function actualizarPanel(dato, etapa) {
    const panel = document.getElementById('escena-estado');
    if (!panel) return;
    panel.innerHTML = `
      <p><strong>${escapar(dato.nombre)}</strong></p>
      <p><strong>${escapar(etapa.titulo)}</strong></p>
      <p>${escapar(etapa.detalle)}</p>
      <p><a href="#${escapar(dato.id)}">Ver el proyecto en detalle</a></p>
    `;
  }

  function escapar(t) {
    return String(t).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[c]);
  }

  /* --- Bucle ------------------------------------------------------------ */
  let tiempo = 0;

  function actualizar(delta) {
    tiempo += delta;

    // La cinta avanza: las piezas que no están detenidas se desplazan.
    for (const pieza of piezas) {
      const etapas = pieza.dato.etapas;
      const etapa = etapas[pieza.etapaActual];
      const xEstacion = X_PRIMERA_ESTACION + indiceEtapa(etapa.id) * SEPARACION_ESTACIONES;

      // Interpolación suave hacia la estación objetivo.
      pieza.malla.position.x += (xEstacion - pieza.malla.position.x) * Math.min(1, delta * 3.2);
      pieza.malla.position.y = Y_CINTA + 0.55;
      pieza.malla.rotation.y += delta * 0.35;

      // Rebote leve: la pieza "asienta" al llegar.
      const desvio = Math.abs(xEstacion - pieza.malla.position.x);
      pieza.malla.position.y += Math.sin(tiempo * 3 + pieza.indice) * 0.03 * (1 - Math.min(1, desvio));

      // Resalte de la pieza seleccionada.
      const objetivoResalte = pieza.dato === seleccionada ? 0.55 : 0;
      pieza.resalte += (objetivoResalte - pieza.resalte) * Math.min(1, delta * 6);
      pieza.mat.emissiveIntensity = 0.18 + pieza.resalte;
      pieza.mat.emissive
        .copy(pieza.dato.ambito === 'trabajo' ? colorTrabajo : colorProyecto)
        .multiplyScalar(0.18 + pieza.resalte * 0.8);

      // La etiqueta mira siempre a cámara.
      pieza.etiqueta.quaternion.copy(camara.quaternion);
    }

    // Estaciones: la que tiene más piezas paradas se ilumina.
    const conteo = new Array(ETAPAS.length).fill(0);
    for (const pieza of piezas) {
      const etapa = pieza.dato.etapas[pieza.etapaActual];
      conteo[indiceEtapa(etapa.id)] += 1;
    }
    const max = Math.max(...conteo);
    estaciones.forEach((est, i) => {
      const activa = conteo[i] === max && max > 0;
      const objetivoFarol = activa ? 1 : 0.22;
      const objetivoMarquesina = activa ? 0.22 : 0;
      est.matFarol.emissiveIntensity +=
        (objetivoFarol - est.matFarol.emissiveIntensity) * Math.min(1, delta * 4);
      est.matMarquesina.emissiveIntensity +=
        (objetivoMarquesina - est.matMarquesina.emissiveIntensity) *
        Math.min(1, delta * 4);
    });

    // La cámara se acerca suavemente a la pieza seleccionada.
    if (seleccionada) {
      const pieza = piezas.find((p) => p.dato === seleccionada);
      if (pieza) {
        // Se centra en la pieza y se acerca, manteniendo el mismo ángulo
        // de vista que en el encuadre general para no marear.
        camaraObjetivo.x = pieza.malla.position.x;
        camaraObjetivo.z = 14;
        camaraObjetivo.y = 7.5;
        miradaObjetivo.set(pieza.malla.position.x, 1.2, 0);
      }
    }

    camara.position.x += (camaraObjetivo.x - camara.position.x) * Math.min(1, delta * 2.2);
    camara.position.y += (camaraObjetivo.y - camara.position.y) * Math.min(1, delta * 2.2);
    camara.position.z += (camaraObjetivo.z - camara.position.z) * Math.min(1, delta * 2.2);
    mirada.lerp(miradaObjetivo, Math.min(1, delta * 2.2));
    camara.lookAt(mirada);
  }

  const nucleo = crearNucleo(lienzo, {
    escena,
    camara,
    actualizar,
    encender() {
      lienzo.addEventListener('pointermove', alMover, { passive: true });
      lienzo.addEventListener('click', alClic);
    },
  });

  return {
    nucleo,
    dispose() {
      lienzo.removeEventListener('pointermove', alMover);
      lienzo.removeEventListener('click', alClic);
      nucleo.dispose();
    },
  };
}
