import { defineConfig } from 'tsdown'

/**
 * The library's main entry (`colour-combos`): catalogue, scale engine and
 * emitters, bundled to one ES module with its declarations. The per-combo
 * files are generated from this build afterwards by `scripts/build-lib.ts`.
 */
export default defineConfig({
  entry: { index: 'src/lib/index.ts' },
  outDir: 'dist-lib',
  format: 'esm',
  platform: 'neutral',
  tsconfig: 'tsconfig.app.json',
  dts: true,
  clean: true,
})
