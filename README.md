# metalozaru.es — web personal de Alejandro Huerta

Sitio estático de portfolio. Todo el contenido está en el HTML: se lee entero
sin JavaScript y sin WebGL. Encima hay una capa interactiva 3D que es un
complemento, nunca la fuente de la información.

Dominio configurado: `metalozaru.es` (no hay nada desplegado todavía).

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run dev` regenera el HTML antes de levantar Vite, para que el HTML y el
fichero de datos no se separen.

## Build

```bash
npm run build      # -> dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

El build hace dos cosas, en este orden:

1. `npm run build:html` genera `index.html` a partir de `src/data/projects.js`.
2. `vite build` empaqueta el CSS y el JavaScript en `dist/assets/`.

## Estructura

```
CONCEPTOS.md              Los 3 conceptos de la capa interactiva y por qué
                          se eligió el pipeline.
index.html                Generado. No editar a mano: se regenera en build.
src/
  data/projects.js        FUENTE ÚNICA DE VERDAD de los proyectos.
  styles.css              Hoja de estilos. Sin framework, sin fuentes externas.
  main.js                 Arranque de la escena y degradación elegante.
  scene/nucleo.js         Núcleo compartido: WebGL, reduced-motion, render,
                          raycasting. Los tres conceptos lo reutilizan.
  concepts/
    registry.js           Qué concepto está activo. Cambiar aquí.
    pipeline/concepto.js  El concepto implementado.
scripts/
  build-html.mjs          Genera index.html desde los datos.
  check-fallback.mjs      Comprueba el fallback sin JS ni WebGL (50 checks).
  probar-escena.mjs       Comprueba la geometría del pipeline (12 checks).
  probar-escena-webgl.mjs Comprueba el arranque con WebGL simulado (8 checks).
  verificar-navegador.mjs Verificación en Chrome real vía CDP.
public/
  cv/                     El CV en PDF.
```

## Dónde se edita el contenido

**Todo en `src/data/projects.js`.** El HTML y la escena 3D leen ese mismo
fichero, así que no hay dos sitios donde editar.

Cada proyecto tiene:

- `frase` — qué es, en una frase.
- `porQue` — por qué importa. Aquí está la información: la decisión que se
  tomó y su coste. Un stack no es un "por qué".
- `stack` — las tecnologías. Secundario.
- `etapas` — por qué estaciones del pipeline pasó, y qué se decidió en cada
  una. Es lo que muestra la escena 3D, y también sale en el HTML dentro de un
  `<details>`.

Para añadir un proyecto: se añade un objeto al array `PROYECTOS` y ya está.
El HTML y la escena lo recogen.

## La capa interactiva

**Concepto 1 — El pipeline.** Una cinta transportadora con cuatro estaciones
(idea → prototipo → plataforma → operación). Cada proyecto es una pieza que
avanza por la cinta. Al hacer clic en una pieza avanza a la siguiente etapa y
se muestra la decisión que se tomó ahí.

Los tres conceptos están comparados en `CONCEPTOS.md`, con su coste y sus
riesgos. Cambiar de concepto es cambiar una línea:

```js
// src/concepts/registry.js
export const ACTIVO = 'pipeline';   // 'estudio' | 'nivel'
```

Los módulos de los otros conceptos no se importan, así que no entran en el
bundle. El núcleo de la escena (`src/scene/nucleo.js`) —accesibilidad,
fallback, render— se reutiliza tal cual.

## Accesibilidad y fallback

- **Todo el contenido está en el HTML.** Sin JS ni WebGL se lee el CV entero.
- `prefers-reduced-motion: reduce` → la escena se dibuja un fotograma
  estático, sin animación. Sigue siendo interactiva.
- Contraste AA en los dos esquemas de color (oscuro y claro).
- Foco visible, enlace de salto al contenido, navegación por teclado.
- El canvas 3D va con `aria-hidden="true"`: es decorativo. La información que
  aporta también está en el texto.
- Sin cookies, sin trackers, sin fuentes externas. Los enlaces a GitHub,
  LinkedIn y a los proyectos son enlaces normales, no recursos cargados.

## Publicar

El build es estático: `dist/` son ficheros que se pueden servir desde cualquier
hosting. El plan es **GitHub Pages + el dominio `metalozaru.es` con los DNS de
Ionos**.

### 1. Publicar en GitHub Pages

1. Empujar `main` al repositorio.
2. En **Settings → Pages**, elegir *Deploy from a branch* → `main` → `/ (root)`.
   (O, si se prefiere publicar el build desde CI: `npm install --save-dev
   gh-pages` y un script `"deploy": "npm run build && gh-pages -d dist"`.)
3. En **Settings → Pages → Custom domain**, poner `metalozaru.es` y activar
   *Enforce HTTPS*.

El repositorio lleva un `public/CNAME` con `metalozaru.es`, que el build copia a
`dist/CNAME`: GitHub Pages lo lee para saber que ese repositorio sirve el
dominio, y por eso el sitio se publica en la raíz y no en
`ahuertam.github.io/portfolio-web/`.

### 2. Los DNS en Ionos

En el panel de Ionos, para el dominio `metalozaru.es`:

| Registro | Tipo | Apunta a |
|---|---|---|
| `www` | CNAME | `ahuertam.github.io` |
| `metalozaru.es` (apex) | ALIAS / ANAME | `ahuertam.github.io` |

El apex **no** puede ser un CNAME plano (es un registro que no admite alias), por
eso va como ALIAS/ANAME, que Ionos soporta.

GitHub además pide **verificar el dominio**: te dará un registro TXT
`_github-challenge-ahuertam` que hay que crear en Ionos. Hasta que no se cree,
GitHub no emite el certificado HTTPS — la web funciona, pero sin HTTPS.

### 3. Comprobar

```bash
curl -sI https://metalozaru.es | head -1     # HTTP/2 200
curl -sI https://www.metalozaru.es | head -1  # debe redirigir al apex
```

### Alternativas

**Cloudflare Pages / Netlify** funcionan con `dist/` tal cual:

- **Build command:** `npm run build`
- **Build output directory:** `dist`

En Cloudflare Pages, el dominio `metalozaru.es` se añade en *Custom domains* y
Cloudflare gestiona el certificado (más automático que con GitHub Pages).

**Netlify**: añadir un `netlify.toml` en la raíz:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Servidor propio (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name metalozaru.es;

    root /var/www/metalozaru;
    index index.html;

    # El sitio es un solo HTML con assets versionados.
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

### DNS

`metalozaru.es` **no está configurado todavía** (el `.com` no existe). Hay que
añadir el registro que corresponda al hosting elegido:

- Cloudflare Pages / Netlify: CNAME a su dominio.
- Servidor propio: A a la IP del servidor.

Esto **no** se ha hecho: nada de DNS, nada de despliegue, nada de push.

## Comprobaciones

```bash
npm test                 # las tres pruebas automáticas (72 comprobaciones)
npm run test:navegador   # en Chrome real, si hay uno con puerto de depuración
```

| Script | Qué comprueba | Checks |
|---|---|---|
| `probar-escena.mjs` | Geometría del pipeline: piezas, estaciones, colores, encuadre | 12 |
| `probar-escena-webgl.mjs` | Arranque de la escena con WebGL simulado | 10 |
| `check-fallback.mjs` | El HTML sin JS ni WebGL: contenido, a11y, sin trackers | 50 |
| `verificar-navegador.mjs` | Chrome real: 4 escenarios + accesibilidad | 26 |

`npm run test:navegador` necesita:

1. Un Chrome abierto con `--remote-debugging-port=9222`.
2. `dist/` servido, por ejemplo con `npx vite preview --port 4817`.

Comprueba las cuatro situaciones: con WebGL, sin WebGL, sin JavaScript y con
`prefers-reduced-motion: reduce`. Y además: jerarquía de encabezados, enlace
de salto, foco visible y contraste AA en modo oscuro y claro.

## Licencia

MIT.
