import type { Plugin } from 'vite'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Routing's one demand on the host is an SPA fallback — `/*` → `/index.html`
 * with a 200, so a deep link survives a hard reload (ADR 0004 §9). GitHub Pages
 * has no rewrite rules; what it has is `404.html`, served for every unmatched
 * path. A byte-identical copy of `index.html` is therefore the rewrite.
 *
 * It lives in the build rather than in the deploy workflow so that `pnpm build`
 * produces a deployable `dist` on its own, and so the fallback cannot be lost by
 * an unrelated change to CI.
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
  /**
   * A GitHub project page is served from `/<repo>/`, not the domain root, so
   * every asset URL and the router's own base have to agree on one prefix. The
   * router reads this back as `import.meta.env.BASE_URL`, so changing hosts —
   * or moving to a custom domain — is this line and nothing else.
   */
  base: '/colour-combos/',
  plugins: [react(), githubPagesSpaFallback()],
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
