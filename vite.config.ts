import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    /**
     * `light-dark()` must reach the browser intact. Lightning CSS downlevels it
     * for targets that predate it, and its polyfill switches on
     * `prefers-color-scheme` alone — which would leave the neutral ramp on the
     * system preference while the mode toggle flipped `color-scheme`, breaking
     * the override in built output only (ADR 0005 §4). These are the versions
     * that shipped `light-dark()` natively. CI greps `dist` for it.
     */
    cssTarget: ['chrome123', 'edge123', 'firefox120', 'safari17.5'],
  },
})
