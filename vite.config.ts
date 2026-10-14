import type { Plugin } from 'vite'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * SPA fallback for GitHub Pages (ADR 0004 §9): it serves `404.html` for unknown
 * paths, so a copy of `index.html` is the rewrite. Done in the build so
 * `dist` deploys on its own.
 */
function githubPagesSpaFallback(): Plugin {
  let outDir = 'dist'

  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  /** Project pages live at `/<repo>/`. The router reads this via `BASE_URL`. */
  base: '/japanese-colour-combos/',
  plugins: [vue(), githubPagesSpaFallback()],
  optimizeDeps: {
    /** Keeps the dep scanner out of the React-only `prototypes/`. */
    entries: ['index.html'],
  },
})
