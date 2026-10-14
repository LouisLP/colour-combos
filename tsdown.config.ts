import { defineConfig } from 'tsdown'

/** The package's main entry, as one ES module. `scripts/build-lib.ts` builds the rest from it. */
export default defineConfig({
  entry: { index: 'src/lib/index.ts' },
  outDir: 'dist-lib',
  format: 'esm',
  platform: 'neutral',
  tsconfig: 'tsconfig.app.json',
  dts: true,
  clean: true,
})
