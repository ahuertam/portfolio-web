import { defineConfig } from 'vite';

/**
 * Configuración de Vite.
 *
 * El HTML se genera antes de cada build con `npm run build:html`, y el script
 * `build` de package.json encadena los dos pasos. Se deja así en lugar de
 * usar un plugin de Vite para que el orden sea explícito y visible en el
 * package.json.
 */
export default defineConfig({
  base: '/',
  site: 'https://metalozaru.es',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    // Sin sourcemaps en producción: no hacen falta y pesan.
    sourcemap: false,
    rollupOptions: {
      output: {
        // three.js es grande. Se parte en trozos para que el navegador pueda
        // cachearlos por separado y no bloquee el HTML.
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    port: 4173,
    open: false,
  },
});
