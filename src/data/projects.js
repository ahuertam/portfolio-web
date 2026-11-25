/**
 * Fuente única de verdad de los proyectos.
 *
 * Todo lo que se muestra en la web sale de aquí: el HTML plano (generado en
 * build) y la escena 3D leen este mismo array. No hay un segundo sitio donde
 * editar los proyectos.
 *
 * Regla de escritura: `frase` describe QUÉ es y `porQue` explica POR QUÉ
 * importa. Un stack no es un "por qué". Si un lector técnico no puede
 * formular la pregunta que responde el proyecto, sobra la entrada.
 *
 * Para añadir un proyecto: añade un objeto al array y ya está. El HTML y la
 * escena lo recogen.
 */

/**
 * @typedef {Object} Proyecto
 * @property {string}  id        Identificador estable (se usa como ancla en el HTML).
 * @property {string}  nombre    Nombre del proyecto.
 * @property {string}  frase     Una frase: qué es.
 * @property {string}  porQue    Por qué importa: qué demuestra o qué resuelve.
 * @property {string[]} stack     Tecnologías (secundario: el "por qué" va primero).
 * @property {string}  [repo]    URL del repositorio en GitHub.
 * @property {string}  [url]     URL de una demo o web pública.
 * @property {string}  [anio]    Año de la última actividad relevante.
 * @property {string}  [ambito]  'personal' | 'trabajo' — para agrupar.
 * @property {Etapa[]} etapas    Posición en el pipeline (ver CONCEPTOS.md).
 * @property {string}  arquetipo Id del arquetipo 3D que lo representa en la
 *                               escena del editor (ver ARQUETIPOS).
 * @property {string}  [color]   Color de la representación 3D, hex. Si no se
 *                               pone, se usa el del arquetipo.
 */

/**
 * @typedef {Object} Etapa
 * @property {string} id     Identificador de la estación del pipeline.
 * @property {string} titulo Qué pasó en esa etapa, en una línea.
 * @property {string} detalle La decisión y su coste: el tradeoff concreto.
 * @property {boolean} [clave] Si es una de las decisiones que más dicen de él.
 */

/** Las cuatro estaciones del pipeline, en orden. */
export const ETAPAS = [
  {
    id: 'idea',
    nombre: 'Idea',
    resumen: 'El problema existe y alguien se queja.',
  },
  {
    id: 'prototipo',
    nombre: 'Prototipo',
    resumen: 'Funciona en la máquina de quien lo hace.',
  },
  {
    id: 'plataforma',
    nombre: 'Plataforma',
    resumen: 'Lo usan otros y hay que mantenerlo vivo.',
  },
  {
    id: 'operacion',
    nombre: 'Operación',
    resumen: 'Alguien tiene que poder operarlo a las tres de la mañana.',
  },
];

/**
 * ARQUETIPOS — las representaciones 3D reutilizables del concepto "El editor".
 *
 * Un arquetipo es una forma física de mostrar un proyecto en el viewport. Hay
 * seis, y cada proyecto elige una. La regla del concepto: **cambiar de
 * arquetipo es cambiar datos, no código**. Si mañana `fotoverse` deja de ser una
 * pila de planos y pasa a ser otra cosa, se toca la línea `arquetipo:` de su
 * entrada en PROYECTOS y no se toca ni un archivo de escena.
 *
 * Lo que dice cada arquetipo (para no inventar nada):
 *
 *   - `fotos`   — pila de planos/fotos apilados y una papelera al lado.
 *                  Evoca a fotoverse: la app que revisa tu biblioteca y decide
 *                  qué va a la papelera. El papelera NO está en los datos del
 *                  proyecto, pero es el detalle que define la metáfora.
 *   - `ondas`   — ondas de voz: crestas apiladas, como una forma de onda.
 *                  Evoca a godKAI-back y a la línea de IA conversacional: la
 *                  voz entra, se procesa y sale.
 *   - `carril`  — un carril en perspectiva, con las marcas que se alejan.
 *                  Evoca a Three Roads: una pista por la que se circula.
 *   - `rejilla` — una rejilla de mini-juegos: celdas iguales en cuadrícula.
 *                  Evoca a Edutika: 43 minijuegos, cada uno su celda.
 *   - `nube`    — nube de puntos dispersos. Evoca a ImageTron: una imagen que
 *                  se convierte en un mundo de puntos, o a MAI: un modelo que
 *                  opera sobre datos sueltos.
 *   - `linea`   — línea de tiempo de hitos: postes en fila con marcas.
 *                  Evoca a las piezas de trayectoria, que son historia.
 *   - `placa`   — una lámina de texto apoyada en el suelo, como el README de
 *                  un repo. Es la representación del asset de intro.
 *
 * `color` es el color por defecto de la representación. Cada proyecto puede
 * sobrescribirlo con su propio campo `color`.
 */
export const ARQUETIPOS = {
  placa: {
    id: 'placa',
    nombre: 'Lámina de texto',
    color: 0x8fb8d8,
    resumen: 'Una placa de texto, como el README de un repositorio.',
  },
  fotos: {
    id: 'fotos',
    nombre: 'Pila de planos',
    color: 0x7fd1c4,
    resumen: 'Planos apilados con una papelera al lado.',
  },
  ondas: {
    id: 'ondas',
    nombre: 'Ondas de voz',
    color: 0x9bb8f0,
    resumen: 'Crestas de onda superpuestas, de la entrada a la salida.',
  },
  carril: {
    id: 'carril',
    nombre: 'Carril en perspectiva',
    color: 0xf2b544,
    resumen: 'Un carril que se aleja, con las marcas del recorrido.',
  },
  rejilla: {
    id: 'rejilla',
    nombre: 'Rejilla de minijuegos',
    color: 0xe08fb0,
    resumen: 'Celdas iguales en cuadrícula: un juego por celda.',
  },
  nube: {
    id: 'nube',
    nombre: 'Nube de puntos',
    color: 0xa9d18c,
    resumen: 'Puntos dispersos que forman un volumen.',
  },
  linea: {
    id: 'linea',
    nombre: 'Línea de hitos',
    color: 0xc9a0e8,
    resumen: 'Hitos alineados en el tiempo, de izquierda a derecha.',
  },
};

/** @type {Proyecto[]} */
export const PROYECTOS = [
  {
    id: 'fotoverse',
    nombre: 'fotoverse',
    frase:
      'App de escritorio que recorre tu biblioteca de fotos y vídeos y te deja decidir qué duplicados sobran.',
    porQue:
      'Reimplementé el pHash a mano (~150 líneas de DCT 2D separable) en vez de usar una librería, porque las que existían estaban atadas a una versión incompatible del crate `image`. Reimplementar me daba control sobre el formato del hash — y me costó una tarde. Lo importante es la segunda decisión: el borrado va siempre a la papelera del sistema operativo, nunca es permanente. Una app que borra fotos de la gente tiene que poder equivocarse.',
    stack: ['Rust', 'Tauri 2', 'React 19', 'SQLite'],
    repo: 'https://github.com/ahuertam/fotoverse',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'fotos',
    etapas: [
      {
        id: 'idea',
        titulo: 'Diez años de fotos y ninguna respuesta',
        detalle:
          'El problema no es "buscar duplicados": es que el mismo `IMG_1234.jpg` está en tres carpetas y no sabes cuál es la buena.',
      },
      {
        id: 'prototipo',
        titulo: 'pHash propio, en Rust',
        detalle:
          'DCT 2D separable sobre 32×32 en escala de grises, bloque 8×8, umbral por mediana, 64 bits. Eligiendo implementarlo por criterio y no por tutorial: la librería `img_hash` usa una feature de nightly y ata su versión de `image`.',
      },
      {
        id: 'plataforma',
        titulo: 'Agrupar es O(n²), y eso hay que decirlo',
        detalle:
          'Union-Find con distancia de Hamming ≤ 10 y poda por salida temprana. El techo de 5.000 imágenes está nombrado en el código y el warning dice lo que va a pasar: cuando se supera, hace falta un BK-tree. Dejar el límite escrito es más honesto que ocultarlo.',
        clave: true,
      },
      {
        id: 'operacion',
        titulo: 'Borrar a la papelera, siempre',
        detalle:
          'El módulo se llama `papelera` y usa la crate `trash` de forma multiplataforma. Si el sistema no tiene papelera, el borrado falla y el fichero se queda. En ningún caso hay borrado permanente.',
        clave: true,
      },
    ],
  },
  {
    id: 'godkai-back',
    nombre: 'godKAI-back',
    frase:
      'Backend de agente conversacional en tiempo real, con voz y texto, de principio a fin.',
    porQue:
      'El valor de este proyecto no es que el agente hable: es que la cadena entera esté detrás de interfaces. Cada proveedor —vector store, cada modelo— se sustituye, así que el servicio degrada en vez de caerse. En producción, "degradar" y "caerse" no son sinónimos: uno es una molestia y el otro es una guardia.',
    stack: ['Python', 'LiveKit', 'STT', 'LLM', 'TTS'],
    repo: 'https://github.com/ahuertam/godkAI-back',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'ondas',
    etapas: [
      {
        id: 'idea',
        titulo: 'Hablar con un modelo en tiempo real',
        detalle:
          'La cadena STT → LLM → TTS tal y como la oyes en un producto, con detección de turnos y cancelación de ruido.',
      },
      {
        id: 'prototipo',
        titulo: 'Que cada pieza sea intercambiable',
        detalle:
          'Deepgram, Gemini, OpenAI, Ollama: se configuran por `config.json`. Cambiar de modelo es cambiar una línea, no reescribir el pipeline.',
      },
      {
        id: 'plataforma',
        titulo: 'Cada dependencia externa detrás de una interfaz',
        detalle:
          'Si el vector store o un proveedor de modelos se cae, el servicio sigue respondiendo con menos. Esta es la misma regla que aplico en el servicio de voz de producción.',
        clave: true,
      },
    ],
  },
  {
    id: 'imagetron',
    nombre: 'ImageTron',
    frase:
      'Convierte una imagen en un mundo 3D navegable, con su objeto en 3D, en el navegador.',
    porQue:
      'El punto interesante no es generar el 3D: es hacerlo en paralelo y que el navegador lo monte sin bloquearse. El progreso llega por SSE y la escena React Three Fiber se monta sobre un Gaussian Splat y un `.glb` que llegan por separado.',
    stack: ['TypeScript', 'React 19', 'R3F', 'SSE'],
    repo: 'https://github.com/ahuertam/imageTron',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'nube',
    etapas: [
      {
        id: 'idea',
        titulo: 'Una foto, un lugar',
        detalle:
          'Subes una imagen y obtienes un entorno navegable generado por World Labs, más el modelo 3D del objeto.',
      },
      {
        id: 'prototipo',
        titulo: 'Dos jobs en paralelo',
        detalle:
          'El entorno y el objeto se generan a la vez. Uno puede fallar sin tumbar al otro, y el GIF de la demo lo enseña en rojo.',
      },
      {
        id: 'plataforma',
        titulo: 'Caché por hash y límites de seguridad',
        detalle:
          'El resultado se cachea por hash de la imagen de entrada, para no pagar dos veces la misma generación. Los límites de tamaño y los jobs se documentan por escrito.',
      },
    ],
  },
  {
    id: 'three-roads',
    nombre: 'Three Roads',
    frase: 'Carrera 3D en el navegador, con 21 niveles y pista procedural.',
    porQue:
      'El ejercicio de cerrar el círculo: física, ECS propio, estado reactivo y render 3D, todo en una web que se abre con un enlace. No es un hobby: es el terreno donde se pratica el runtime WebGL que luego se usa en producto.',
    stack: ['React Three Fiber', 'Three.js', 'Cannon.js', 'Zustand'],
    repo: 'https://github.com/ahuertam/three_roads',
    url: 'https://ahuertam.github.io/three_roads/',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'carril',
    etapas: [
      {
        id: 'idea',
        titulo: 'Un juego que no necesita instalar nada',
        detalle:
          'Se juega en el navegador y se comparte por URL. Nada de descarga, nada de cuenta.',
      },
      {
        id: 'prototipo',
        titulo: 'ECS propio en vez de un framework',
        detalle:
          'Un sistema de entidades-componentes propio para la lógica, y Zustand para el estado de la interfaz. Separar las dos cosas es lo que permite que el render no se entere de las reglas.',
      },
      {
        id: 'plataforma',
        titulo: '21 niveles y pista procedural',
        detalle:
          'La pista se genera por código, así que añadir niveles es contenido, no trabajo de arte.',
      },
    ],
  },
  {
    id: 'mai',
    nombre: 'MAI',
    frase: 'Agente de IA local que planifica y ejecuta tareas en la terminal.',
    porQue:
      'El detalle que importa es dónde vive: **en tu máquina, con Ollama, sin cuenta ni API key**. Es un agente que planifica antes de actuar, y que te da el feedback en la propia consola, sin interfaz de por medio.',
    stack: ['Python', 'Ollama'],
    repo: 'https://github.com/ahuertam/mai',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'nube',
    etapas: [
      {
        id: 'idea',
        titulo: 'Un plan, no una lista de comandos',
        detalle:
          'El modelo genera un plan ejecutable y luego lo ejecuta, informando paso a paso.',
      },
      {
        id: 'prototipo',
        titulo: 'Local y sin credenciales',
        detalle:
          'Ollama en local. La instalación se resuelve en un script, con detección del sistema operativo y del propio Ollama.',
      },
      {
        id: 'plataforma',
        titulo: 'Extensible hacia voz',
        detalle:
          'La arquitectura ya está pensada para poder añadir LiveKit y pasar a interacción por voz sin rehacer el agente.',
      },
    ],
  },
  {
    id: 'frodo',
    nombre: 'Frodo',
    frase: 'Toolbox de 11 agentes Python autocontenidos.',
    porQue:
      'Cada agente vive en su carpeta, con su `requirements.txt`, y funciona solo. No hay framework ni runtime compartido. Cuando un agente se rompe, no arrastra a los otros diez — que es exactamente el comportamiento que busqué en los servicios de IA de producción.',
    stack: ['Python'],
    repo: 'https://github.com/ahuertam/frodo',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'rejilla',
    etapas: [
      {
        id: 'idea',
        titulo: 'Un problema, un script',
        detalle:
          'Ilustrador, cartógrafo de mundos, narrador... herramientas pequeñas que resuelven una cosa concreta.',
      },
      {
        id: 'prototipo',
        titulo: 'El LLM como emisor de datos estructurados',
        detalle:
          'En el cartógrafo, el modelo no escribe prosa: diseña la estructura lógica del mapa con un esquema tipado y la emite en JSON. Contrato estricto y cadena de respaldo.',
        clave: true,
      },
      {
        id: 'plataforma',
        titulo: 'Aislamiento total entre agentes',
        detalle:
          'Sin runtime compartido, un fallo en un agente no afecta a los demás. El mismo criterio que en el servicio de IA de producción.',
      },
    ],
  },
  {
    id: 'edutika',
    nombre: 'Edutika',
    frase: '43 minijuegos educativos de matemáticas, lengua y conocimiento, en español y gratis.',
    porQue:
      'Está en **edutika.es**, vivo y público, y funciona sin cuenta ni descargas. Cada juego se carga por separado cuando lo abres, no los 43 de golpe, y el catálogo de juegos vive en un único fichero de configuración. Es un producto para niños que se usa en un aula real, y por eso cada juego es una pantalla y una mecánicas, no una demo.',
    stack: ['JavaScript', 'React', 'Phaser', 'Matter.js'],
    repo: 'https://github.com/ahuertam/education',
    url: 'https://edutika.es',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'rejilla',
    etapas: [
      {
        id: 'idea',
        titulo: 'Practicar sin cuentas ni descargas',
        detalle:
          'Ni registro, ni descargas, ni paywall. Se abre y se juega. La decisión elimina la fricción justo donde el usuario es un niño.',
      },
      {
        id: 'prototipo',
        titulo: 'Un juego = una pantalla y una mecánica',
        detalle:
          'El mismo juego puede aparecer en varias categorías. La lógica vive en la configuración, no duplicada en cada componente.',
      },
      {
        id: 'plataforma',
        titulo: 'Carga bajo demanda y progreso local',
        detalle:
          'Los 43 juegos no se descargan de golpe: cada uno baja su trozo al abrirlo. Un catálogo único en `src/config/games.js` gobierna navegación, carga y progreso.',
        clave: true,
      },
      {
        id: 'operacion',
        titulo: 'En producción y en uso',
        detalle:
          'Publicada en edutika.es. Un producto de juguete que sale de las once de la noche y lo usan niños de verdad.',
      },
    ],
  },
  {
    id: 'akai25',
    nombre: 'AKAI25 Web DAW',
    frase: 'Estación de trabajo musical en el navegador, conectada a un teclado Akai MPK25.',
    porQue:
      'Puente entre hardware MIDI y navegador con latencia mínima: Web MIDI API y Tone.js, sin drivers ni instalación. Y un detalle de ergonomía: funciona igual sin el teclado conectado — hay un teclado virtual en pantalla, así que se puede probar en cualquier navegador y la demo no depende de tener el aparato a mano.',
    stack: ['React', 'Tone.js', 'Web MIDI API'],
    repo: 'https://github.com/ahuertam/akai25',
    url: 'https://ahuertam.github.io/akai25/',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'ondas',
    etapas: [
      {
        id: 'idea',
        titulo: 'Tocar sin instalar nada',
        detalle:
          'El MKP25 se convierte en un instrumento virtual en una pestaña del navegador.',
      },
      {
        id: 'prototipo',
        titulo: 'Latencia por debajo de lo que se nota',
        detalle:
          'Web MIDI API con Tone.js: el evento MIDI llega al sintetizador sin pasar por un plugin nativo.',
      },
      {
        id: 'plataforma',
        titulo: 'Grabas, escuchas y descargas',
        detalle:
          'Persistencia de las grabaciones y exportación a fichero. Lo mínimo para que una idea musical no se pierda al cerrar la pestaña.',
      },
    ],
  },
  {
    id: 'roadrol',
    nombre: 'RoadRol',
    frase: 'PWA móvil para dirigir partidas de rol desde el teléfono.',
    porQue:
      'Pensado para el escenario real: el master va en un viaje largo, con el móvil en la mano y sin cobertura decente. Sin cuentas, sin backend y sin API keys: todo local en el dispositivo, y la partida se comparte por enlace. Es la decisión de arquitectura que hace que la app funcione donde la red no.',
    stack: ['JavaScript', 'PWA', 'Web App Manifest'],
    repo: 'https://github.com/ahuertam/roadRol',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'carril',
    etapas: [
      {
        id: 'idea',
        titulo: 'La partida ocurre en la mesa, pero el master está en la carretera',
        detalle:
          'Generar misiones y encuentros desde packs, tirar dados y editar stats en caliente.',
      },
      {
        id: 'prototipo',
        titulo: 'Mobile-first de verdad',
        detalle:
          'La interfaz se diseñó para el pulgar y para jugar con una sola mano, no para ser un móvil con un escritorio encogido.',
      },
      {
        id: 'plataforma',
        titulo: 'Cero backend, cero cuentas',
        detalle:
          'Todo local en el dispositivo y la partida se comparte por enlace. Sin API keys ni infraestructura que mantener.',
        clave: true,
      },
    ],
  },
  {
    id: 'freeaiapis',
    nombre: 'freeAIApis',
    frase: 'Directorio curado de 32 APIs de IA gratuitas.',
    porQue:
      'Mano de obra mínima y un criterio claro: la mayoría de estos servicios ya no son gratis de verdad, o lo fueron hasta agosto de 2025 y ahora dejan de serlo. Separar las que siguen siendo gratuitas de las que ya no, y decirlo, es más útil que una lista larga sin fechas.',
    stack: ['HTML'],
    repo: 'https://github.com/ahuertam/freeAIApis',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'rejilla',
    etapas: [
      {
        id: 'idea',
        titulo: 'Encontrar qué sigue siendo gratis',
        detalle:
          'Un problema pequeño con una respuesta que cambia cada pocos meses.',
      },
      {
        id: 'prototipo',
        titulo: 'HTML y nada más',
        detalle:
          'Un directorio no necesita un framework. Sin dependencias, sin build, sin mantenimiento.',
      },
      {
        id: 'operacion',
        titulo: 'Revisado, no congelado',
        detalle:
          'Cada entrada lleva la fecha en que se comprobó. Un directorio sin fechas es un directorio de mentiras en tres meses.',
      },
    ],
  },
  {
    id: 'ai-radar',
    nombre: 'AI Radar',
    frase: 'Rankings de modelos de IA por categoría.',
    porQue:
      'Comparar modelos por *categoría de tarea* y no por una puntuación global. El modelo mejor del ranking global rara vez es el mejor para tu tarea concreta, y un ranking que no distingue eso no sirve para decidir.',
    stack: ['HTML'],
    repo: 'https://github.com/ahuertam/ai-radar',
    anio: '2026',
    ambito: 'personal',
    arquetipo: 'rejilla',
    etapas: [
      {
        id: 'idea',
        titulo: 'Un ranking único no sirve para decidir',
        detalle:
          'El leaderboard general mezcla tareas incompatibles. Por categoría, el orden cambia por completo.',
      },
      {
        id: 'prototipo',
        titulo: 'HTML, CSS y un poco de JS',
        detalle:
          'Sin framework y sin build. Para una tabla con filtros, es más que suficiente.',
      },
    ],
  },
];

/**
 * Trabajo profesional — no es un repositorio, pero es la mayor parte de su CV.
 * Se incluye aquí para que la escena 3D tenga la misma materia prima que el HTML.
 */
export const TRABAJO = [
  {
    id: 'editor-autoria',
    nombre: 'Editor de autoría 3D',
    frase:
      'Editor donde se construyen juegos educativos 3D. Developer principal durante 7 años.',
    porQue:
      '576 commits en 7 años. No construí una pantalla: construí la herramienta con la que se construyen las pantallas. En 2023 creé el `CODEOWNERS` del repo, que convirtió una barra de calidad deadvice en algo exigible.',
    stack: ['Vue 3', 'Konva', 'Vuex'],
    ambito: 'trabajo',
    // Es el editor de autoría 3D: su representación es el propio editor.
    arquetipo: 'rejilla',
    color: 0xb58cf0,
    etapas: [
      {
        id: 'prototipo',
        titulo: 'Un lienzo 2D con objetos 3D detrás',
        detalle:
          'Konva para la interacción, y una escena WebGL detrás. Es el mismo problema del editor de Undo/Redo y de la serialización de escena.',
      },
      {
        id: 'plataforma',
        titulo: '576 commits en 7 años',
        detalle:
          'El editor es el producto. Lo que otros equipos construyen encima de él es lo que hay que mantener compatible.',
        clave: true,
      },
      {
        id: 'operacion',
        titulo: 'La barra de calidad, exigible',
        detalle:
          'El `CODEOWNERS` que creé en 2023 convirtió la revisión en un proceso con responsable, no en una sugerencia.',
        clave: true,
      },
    ],
  },
  {
    id: 'runtime-webgl',
    nombre: 'Runtime WebGL',
    frase:
      'Runtime que ejecuta en el navegador lo que se diseña en el editor. Partes de él son suyas.',
    porQue:
      'Escena con undo/redo, post-procesado, light probes y navmesh, y distribuida como librería de componentes publicada. Es la otra mitad del producto: sabe los dos lados del contrato, el que dibuja y el que dibuja.',
    stack: ['React 19', 'Three.js', 'React Three Fiber', 'Zustand'],
    ambito: 'trabajo',
    arquetipo: 'nube',
    color: 0x7fb4f0,
    etapas: [
      {
        id: 'plataforma',
        titulo: 'Una librería de componentes, no un script',
        detalle:
          'Se consume desde otros equipos. Cambiar su API es una decisión de versionado, igual que en el backend.',
      },
      {
        id: 'operacion',
        titulo: 'Rendimiento en el navegador real',
        detalle:
          'Post-procesado, light probes y navmesh tienen que ir a 60 fps en la máquina del usuario, no en el portátil del equipo.',
      },
    ],
  },
  {
    id: 'ia-conversacional',
    nombre: 'Línea de IA conversacional',
    frase:
      'NPCs y mentores de voz en tiempo real, en producción. Lidera esta línea desde 2025.',
    porQue:
      'Servidor de agentes en FastAPI (async, streaming, WebSockets), RAG sobre Milvus, caché de voz en Elixir/Phoenix y agentes de test con Playwright. 752 commits en 2026, su año más productivo. Y la regla que lo sostiene: **cada dependencia externa detrás de una interfaz, para que el servicio degrade en vez de caer**.',
    stack: ['FastAPI', 'LiveKit', 'Milvus', 'Elixir', 'Phoenix', 'Playwright'],
    ambito: 'trabajo',
    arquetipo: 'ondas',
    color: 0x8fa8f0,
    etapas: [
      {
        id: 'idea',
        titulo: 'Un NPC que responde en milisegundos',
        detalle:
          'La conversación tiene que ir en las dos direcciones: voz que entra, voz que sale, con el turno bien detectado.',
      },
      {
        id: 'prototipo',
        titulo: 'RAG sobre Milvus',
        detalle:
          'Recuperación vectorial para que el mentor de voz sepa de qué habla. El almacén vectorial es una dependencia más, y se trata como tal.',
      },
      {
        id: 'plataforma',
        titulo: 'Degradar en vez de caer',
        detalle:
          'Si el vector store o un proveedor de modelos no están, el servicio sigue respondiendo con menos. Los agentes de test con Playwright ejercitan los flujos de extremo a extremo.',
        clave: true,
      },
      {
        id: 'operacion',
        titulo: '752 commits en 2026',
        detalle:
          'Su año más productivo, y el primero en que el producto de IA pasó de ser un experimento a estar en producción.',
      },
    ],
  },
  {
    id: 'api-plataforma',
    nombre: 'Contratos de API a escala',
    frase:
      'El servicio de definición de juegos: la API contra la que se construyen todas las herramientas internas y el runtime.',
    porQue:
      '**401 commits en siete años y sigue siendo la API de registro.** Por eso cada cambio es una decisión de versionado con compatibilidad hacia atrás, no un refactor. Y en esa plataforma de ~200M de usuarios mensuales, cada decisión tiene miles de clientes detrás.',
    stack: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'S3'],
    ambito: 'trabajo',
    arquetipo: 'linea',
    color: 0xd08fc0,
    etapas: [
      {
        id: 'plataforma',
        titulo: '401 commits, siete años, y sigue siendo la API de registro',
        detalle:
          'Miles de consumidores internos construidos contra ese contrato. "De qué depende qué" se resuelve aquí, no en un documento.',
        clave: true,
      },
      {
        id: 'operacion',
        titulo: 'Un API es un contrato, y el que lo opera también es usuario',
        detalle:
          'Es lo que aprendí en diez años de IBM security y pre-sales: un contrato que cambia sin avisar rompe a gente que no estaba en la sala. La plataforma de i18n (145 commits) y los endpoints de BI viven en el mismo sistema.',
        clave: true,
      },
    ],
  },
  {
    id: 'ibm',
    nombre: 'Diez años de IBM security y pre-sales',
    frase: 'Security Systems Engineer, formador oficial y IT Channel Specialist en el portfolio de IBM.',
    porQue:
      'Formador oficial de WebSphere 7, Tivoli Storage Manager y Acronis, con el laboratorio de formación bajo su responsabilidad. En 2013, parte del equipo de siete que recibió el mejor VAD de software de IBM España. Es donde aprendí que un API es un contrato y que quien opera lo que lanzas también es usuario.',
    stack: ['IBM Cloud', 'WebSphere', 'Tivoli', 'DB2'],
    ambito: 'trabajo',
    arquetipo: 'linea',
    color: 0x9aa8c4,
    etapas: [
      {
        id: 'idea',
        titulo: 'Entender el sistema antes de programarlo',
        detalle:
          'DB2, Web Application Server, Tivoli Identity Manager y conectores propios sobre LDAP y directorios corporativos.',
      },
      {
        id: 'operacion',
        titulo: 'Enseñar y sostener el laboratorio',
        detalle:
          'Entorno, material y entrega. Enseñar obliga a entender lo que se enseña mejor que ninguna otra cosa.',
        clave: true,
      },
    ],
  },
];

/**
 * El README de la intro.
 *
 * Es el primer asset de la jerarquía del editor: lo que el visitante lee
 * antes de tocar nada. En la escena es una placa de texto —el propio README,
 * como una lámina— apoyada en el suelo, al frente.
 *
 * No es un proyecto: no tiene repo ni stack. Es el texto que se lee primero.
 */
export const INTRO = {
  id: 'intro',
  nombre: 'README',
  frase:
    'Alejandro Huerta — ingeniero senior de plataforma, WebGL e IA aplicada. Madrid, remoto en la UE.',
  porQue:
    'Ocho años construyendo la capa de servicios y APIs de una plataforma viva de ~200 millones de usuarios mensuales, dueño de partes del runtime WebGL y del editor de autoría 3D que la alimenta, y desde 2025 responsable de la línea de IA conversacional en producción. Antes de programar, diez años de IBM security y pre-sales: por eso diseño para quien tiene que operar lo que entrego.',
  stack: ['TypeScript', 'Rust', 'Python', 'Three.js'],
  ambito: 'intro',
  arquetipo: 'placa',
  etapas: [
    {
      id: 'idea',
      titulo: 'Una web que se lee sin JavaScript',
      detalle:
        'Todo el contenido en el HTML plano: sin scripts que lo generen, sin trackers y sin fuentes que rastreen. La capa 3D es un extra encima, nunca la fuente.',
      clave: true,
    },
    {
      id: 'prototipo',
      titulo: 'Los paneles son HTML, el viewport es WebGL',
      detalle:
        'Jerarquía, inspector y barra de estado son DOM con CSS. Eso da accesibilidad, texto seleccionable y un fallback que funciona sin WebGL.',
    },
    {
      id: 'plataforma',
      titulo: 'Una sola fuente de verdad',
      detalle:
        'El HTML y la escena leen el mismo `src/data/projects.js`. Cambiar un arquetipo o una frase es cambiar una línea de datos, no de código.',
    },
  ],
};

/** Todos los elementos, proyectos y trabajo, en un solo array para la escena. */
export const TODOS = [...PROYECTOS, ...TRABAJO];

/**
 * El color con el que se dibuja la representación 3D de un elemento.
 *
 * El color propio del elemento manda sobre el color por defecto de su
 * arquetipo. Es una regla de datos, no de código: para que la línea de
 * trayectoria se distinga de los proyectos personales, basta con poner `color`
 * en sus entradas.
 *
 * @param {Proyecto} elemento
 * @returns {number} Color en hexadecimal.
 */
export function colorDe(elemento) {
  if (elemento.color != null) return elemento.color;
  const arquetipo = ARQUETIPOS[elemento.arquetipo];
  return arquetipo ? arquetipo.color : 0x9fb3c8;
}

/**
 * Los datos de un arquetipo, con su nombre legible.
 *
 * @param {string} id
 * @returns {{id: string, nombre: string, color: number, resumen: string}}
 */
export function arquetipoDe(id) {
  return ARQUETIPOS[id] ?? {
    id: id ?? 'desconocido',
    nombre: 'Sin arquetipo',
    color: 0x9fb3c8,
    resumen: '',
  };
}
