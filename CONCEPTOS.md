# Conceptos para la capa interactiva

Cuatro ideas para la parte interactiva de la web. Cada una con su mecánica, lo que el
visitante aprende, por qué encaja con el trabajo de Alejandro, lo que cuesta y qué
puede salir mal.

El objetivo de la capa interactiva **no es impresionar con gráficos**. Un recruiter no
va a pasarse cinco minutos jugando. La capa tiene un único trabajo: hacer que la
información que ya está en el HTML se entienda mejor y se recuerde. Si la capa no
añade nada a lo que dice el texto plano, sobra.

Restricción que manda sobre todo lo demás: **la capa es un complemento, nunca la
fuente**. Todo el contenido está en el HTML y se puede leer sin WebGL y sin JavaScript.
La capa es una segunda lectura, no la única.

---

## Concepto 0 — El grafo (ACTIVO)

### Mecánica

Un lienzo 2D con **nodos tipados por color**, al estilo del editor de la Forja
(`gamelearn/the-adventure-forge`): cada proyecto y cada bloque de trayectoria es un
nodo con su etiqueta de tipo en monoespaciada, su nombre y su frase. Las **aristas
unen nodos que se relacionan de verdad**, con la relación escrita: "degradar en
vez de fallar", "del terminal a producción", "seguridad antes que producto".

Como en cualquier editor de nodos, no se ve el grafo entero de golpe: se empieza en
el nodo de entrada y se panea y se hace zoom. Se navega con el ratón y con el
teclado (flechas para moverse entre nodos, `Enter` para la ficha, `Escape` para
deseleccionar, `/` para buscar en la jerarquía, `?` para la ayuda). Cada nodo
tiene deep link: `metalozaru.es/#/fotoverse` abre el grafo con ese nodo
seleccionado y encuadrado.

### Qué aprende el visitante

- **La estructura, no la lista.** Un listado de once bullets dice qué tiene; un
  grafo dice cómo se relacionan. Las aristas son la información que un CV en texto
  plano no puede dar.
- Que trabaja en tres cosas a la vez (producto 3D, IA y agentes, herramientas) y
  que se conectan: el editor de autoría alimenta el runtime, el runtime alimenta la
  línea de IA, y los diez años de IBM security están detrás de cómo diseña.
- Que sabe razonar sobre relaciones: la etiqueta de cada arista es una decisión
  con su motivo, no un "relacionado".

### Por qué encaja con su trabajo

Es el único concepto que **no inventa contenido**: nodos y aristas salen del mismo
`src/data/projects.js` que el HTML, y las relaciones están escritas en
`src/data/grafo.js`. Y es, literalmente, **su editor**: la Forja es un grafo de
nodos para diseñar aventuras, y aquí es un grafo de nodos para explicar un
portfolio. La web se parece a la herramienta con la que trabaja.

### Coste de implementación

**Bajo-medio, y sin GPU.** El grafo es DOM y SVG: nodos como `<button>` con texto
real (seleccionable, buscable por lector de pantalla) y aristas como `<path>`. Eso
significa que **la web no depende de WebGL para nada**: en un portátil corporativo
con la aceleración por hardware desactivada se ve igual, y carga al instante. El
3D queda como fondo (niebla, rejilla y partículas lentas) y es opcional.

### Riesgos

- **Que el grafo sea un adorno.** Mitigación: cada arista lleva su etiqueta
  escrita; si las etiquetas no dijeran nada, el concepto no valdría.
- **El visitante no lo mueve.** Mitigación: el nodo de entrada es el README, que
  conecta con casi todo, y la jerarquía de la izquierda ofrece la misma
  información en lista.
- **Perder coherencia con el texto.** Mitigación: un único fichero de datos; el
  HTML y el grafo leen el mismo.

---

## Concepto 1 — El pipeline (alternativo)

### Mecánica
Una cinta transportadora en 3D donde los proyectos avanzan de izquierda a derecha por
cuatro estaciones —**idea → prototipo → plataforma → operación**— y en cada estación
se puede parar la cinta, girar la pieza y leer qué pasó ahí: qué decisión se tomó, qué
se descartó y por qué. Al final de la cinta cada pieza cae en un cubo que es el
proyecto, con su enlace a GitHub.

### Qué aprende el visitante
- Que Alejandro no solo escribe código: **diseña y opera sistemas**. La cinta
  muestra que cada proyecto pasó por un ciclo, no que es un repositorio suelto.
- La diferencia entre **proyecto personal** y **trabajo de plataforma** se hace
  evidente: `fotoverse` cruza la cinta entero; el contrato de API de Game Strategies
  lleva siete años en la estación de *operación*.
- Qué decisiones tienen tradeoff real. Cada parada del pipeline nombra una elección
  y su coste (pHash a mano en vez de usar `img_hash`; agrupar por Union-Find en vez
  de un BK-tree; borrar siempre a la papelera).

### Por qué encaja con su trabajo
Es lo que pedía el brief y, más importante, es *fiel*. Su trayectoria tiene una forma
que solo esta escena cuenta bien: **la escala**. Empezó en un producto con ~200M de
usuarios mensuales y ahora construye herramientas de escritorio de un solo usuario.
El pipeline no es una metáfora decorativa, es el eje real de su carrera: cómo pasa
una idea de "esto lo uso yo" a "esto lo usan otros y tiene que seguir vivo".

Además es un problema que él ya sabe resolver: es un sistema de estados con
transiciones, con degradación en vez de fallo (el principio que él mismo aplicó al
servicio de IA). Y es lo que un recruiter va a leer con atención: **no le interesan
los stacks, le interesan las razones**.

### Coste de implementación
**Bajo-medio.** Una cinta con instanciado de mallas, cuatro estaciones con geometría
simple, interpolated scroll, y picking por raycast para interactuar con las piezas.
Todo con Three.js puro (sin R3F) sobre Vite, en unas ~600-900 líneas de escena.
Componente de piezas reutilizable, con el dataset de proyectos inyectado.

### Riesgos
- **Abstracción excesiva.** Si la cinta se parece a una "infografía 3D" más que a
  una máquina, es ruido. Mitigación: cada estación tiene una pieza física real
  (un rollo de papel, un CI verde, un servidor) y no solo texto flotante.
- **Coste de carga.** Una escena con muchas mallas puede durar un segundo en abrir.
  Mitigación: geometría compartida, materiales compartidos, y render bajo demanda.
- **Contar cosas que no son ciertas.** Riesgo real: el pipeline sugiere que todos sus
  proyectos pasaron por las cuatro estaciones. Mitigación: las estaciones se marcan
  explícitamente como *no todas las etapas aplican a todos los proyectos*, y el texto
  plano tiene los hechos.

---

## Concepto 2 — El estudio

### Mecánica
Una escena tipo oficina/editor donde cada proyecto es un objeto en una pared y un NPC
—como los que él construye— te va contando de qué va, en primera persona.

### Qué aprende el visitante
- La amplitud del portfolio: un paseo por una estantería con once proyectos.
- Algo de su trabajo de NPC/IA conversacional, dicho por un NPC.

### Por qué encaja
Es la idea más "Bruno Simon" de las tres, y la más fácil de vender: entrada a una
habitación, algo que se mueve, alguien que te habla. Encaja con su trabajo de
narrativa/IA y con el hecho de que su editor de autoría es, literalmente, un estudio.

### Coste de implementación
**Alto.** Requiere un personaje con animación y un sistema de diálogo que arranque
una animación al hablar. El contenido del diálogo son 11 textos que además tienen que
estar sincronizados con el HTML plano (si no, hay dos fuentes de verdad). Suma un
segundo sistema de contenido que mantener, que es exactamente lo contrario de lo que
pide el requisito 4 (un único fichero de datos).

### Riesgos
- **Un NPC hablando del portfolio suena a demo de IA.** Es el riesgo principal: el
  visitante percibe "esto es una demo de chatbot" y se marcha en tres segundos.
- **Bloquea al lector real.** Un recruiter con prisa no va a hablar con un NPC para
  enterarse de qué es `fotoverse`. El HTML plano gana.
- **Contenido duplicado.** Los textos del NPC y los del HTML divergen en cuanto se
  toca uno.
- **Coste de carga y complejidad** por encima de la media para el valor que aporta.

---

## Concepto 3 — El nivel

### Mecánica
Un pequeño puzzle que resuelve un problema real suyo —ordenar por pHash, enrutar por
modelo, versionar un contrato de API— y al superarlo desbloquea el proyecto.

### Qué aprende el visitante
- Que sabe razonar sobre problemas concretos, no sólo sobre stacks: el visitante ve
  el problema y su propia solución.
- Mechanics de closest match, versionado y routing en miniatura.

### Por qué encaja
Es interactivo de verdad y "juega" con lo que sabe. El puzzle de pHash es elegante:
ordenar duplicados por similitud perceptual es un problema que se entiende en
treinta segundos y que se resuelve arrastrando.

### Coste de implementación
**Alto-medio.** Un puzzle de ordenación necesita: estado de arrastre, cálculo de
distancia, retroalimentación, condición de victoria, y un mapa del puzzle a un
proyecto concreto. Cada puzzle nuevo es un módulo nuevo.

### Riesgos
- **El visitante pierde.** Si alguien fracasa, se va. Y si no lo intenta, no aprende
  nada. El recurso público de un ingeniero senior es su tiempo.
- **Sólo funciona con un proyecto.** La mecánica de pHash no escala a `mai` ni a
  `akai25` sin inventar un puzzle distinto para cada uno. Y con once proyectos,
  eso son once puzzles: coste desproporcionado para el beneficio.
- **Trampa de reflexes.** Se reduce a un acertijo, no a la experiencia. Y el HTML plano
  tiene que describir los otros diez proyectos igualmente, así que el puzzle queda
  como adorno de uno.
- **Fallo de accesibilidad grave.** Un puzzle puramente visual es el peor caso
  posible para el requisito de que la escena no sea la única forma de acceder al
  contenido.

---

## Comparativa

| | Pipeline | Estudio | Nivel |
|---|---|---|---|
| Aprende sobre | Cómo diseña y opera sistemas | Amplitud del portfolio | Razonamiento sobre un problema |
| Fidelidad a su trabajo | **Alta** — la escala es su eje real | Media — parece demo de IA | Media-baja — sólo un proyecto |
| Coste | Bajo-medio | Alto | Alto-medio y crece por proyecto |
| Funciona sin WebGL | Sí (texto) | Sí (texto) | Sí (texto) |
| Sin contenido duplicado | Sí | No (diálogo aparte) | No (soluciones aparte) |
| Riesgo principal | Abstracción de más | Suena a demo de IA | Visitor frustrado |
| Requisito 4 (fichero único) | Se cumple | Se rompe | Se rompe |

## Decisión

**Concepto activo: el grafo (Concepto 0).**

El motivo, resumido: es **su editor** —la Forja es un grafo de nodos con panel
izquierdo, panel de propiedades y tipos con color—, las aristas llevan información
que un listado no puede ("degradar en vez de fallar"), **no depende de la GPU**
porque es DOM y SVG, y no inventa contenido: lee el mismo `src/data/projects.js`
que el HTML. El pipeline queda implementado y verificable, y se activa cambiando
una línea en `src/concepts/registry.js`.

Detalle del razonamiento, comparación con los otros y riesgos: arriba, en
"Concepto 0 — El grafo".

Tres razones, por orden:

1. **Es el único que no inventa contenido.** El pipeline se construye con los datos
   que ya están en el fichero de proyectos: para cada uno, en qué etapa está y qué
   decisión lo define. No hace falta un segundo sistema de texto que mantener, así que
   el requisito de "un único fichero de datos" se cumple de verdad.

2. **Cuenta la parte del CV que un texto plano no transmite.** Su CV tiene dos
   entradas: 10 años de IBM security y pre-sales, y 8 años construyendo producto
   interactivo en una plataforma de 200M MAU. El pipeline muestra el *tránsito* entre
   las dos: cómo un contrato de API se convierte en la columna vertebral de un
   producto 3D. En una lista de once bullets eso no se ve.

3. **El riesgo es controlable.** El riesgo del estudio (que suene a demo) y del nivel
   (que el visitante falle) son fallos de producto, no de implementación: no se
   arreglan con más código. El riesgo del pipeline —que sea demasiado abstracto— sí se
   arregla con diseño, y el diseño es la parte que más controlo.

### Cómo cambiar de concepto después
La estructura está preparada para que cambiar sea barato:

- `src/concepts/` — un directorio por concepto. Solo uno está activo; el resto son
  módulos que no se importan y no entran en el bundle.
- `src/concepts/registry.js` — un objeto con `id`, `label`, `description` y `create()`.
  Cambiar de concepto es cambiar una línea en la configuración.
- `src/scene/` — el núcleo compartido: renderer, cámara, bucle, raycasting, gestión
  de `prefers-reduced-motion`, degradación a sin-WebGL y teclado. **Los tres
  conceptos reutilizan este núcleo**, así que la accesibilidad y el fallback se
  escriben una vez.
- `src/data/projects.js` — la fuente única de verdad. Un concepto que necesite datos
  adicionales (decisiones, etapas) los declara en su propio módulo, sin tocar el
  fichero compartido.

Consecuencia práctica: si en seis meses el pipeline no funciona, escribir el estudio
o el nivel es escribir **un módulo de escena** (`src/concepts/estudio/`), no rehacer
la web. El HTML, el CSS, el fallback, la accesibilidad y los datos se quedan igual.

---

## Lo que se construyó finalmente

- **Concepto 1, el pipeline.** Cuatro estaciones —idea, prototipo, plataforma,
  operación— y dieciséis piezas: los once proyectos y los cinco bloques de
  trayectoria profesional. Al hacer clic en una pieza avanza a la siguiente
  etapa y se muestra la decisión que se tomó, con su tradeoff.
- **Estructura de tres piezas, según lo de arriba:**
  - `src/scene/nucleo.js` — lo que comparten los tres conceptos: detección de
    WebGL, `prefers-reduced-motion`, renderer, bucle, raycasting y teclado.
  - `src/concepts/<concepto>/concepto.js` — sólo la escena. Un concepto
    implementa `create(lienzo, { onSeleccion })` y nada más.
  - `src/concepts/registry.js` — una línea: `export const ACTIVO = 'pipeline'`.
    Los módulos de los otros conceptos no se importan, así que no entran en el
    bundle.
- **Todo el contenido está también en el HTML plano**, incluidas las etapas del
  pipeline: cada tarjeta las lleva dentro de un `<details>`. La escena es una
  segunda lectura, no la única.
- **Comprobado:** 12 checks de geometría, 10 de arranque con WebGL simulado,
  50 de fallback en el HTML y 26 en Chrome real (los cuatro escenarios más
  accesibilidad). Ver el README.
