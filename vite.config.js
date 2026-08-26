import { defineConfig } from 'vite'

// Sitio estático con hash routing (#/...) — no necesita SPA fallback.
// `public/` la genera scripts/prep-data.mjs (hook predev/prebuild) y va commiteada:
// Vercel corre solo `vite build` y consume lo ya generado.
export default defineConfig({
  // Sin `open`: en WSL no hay navegador que lanzar y el proceso se cae al intentarlo.
  server: { port: 5175, host: '127.0.0.1' },
  build: { outDir: 'dist', emptyOutDir: true },
})
