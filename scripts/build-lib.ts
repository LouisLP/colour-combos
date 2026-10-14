// Writes the per-combo files into `dist-lib/`, from the entry tsdown just built
// there, so every file comes from the code the package ships.
//
//   japanese-colour-combos               -> index.js       data, buildScale, emitters
//   japanese-colour-combos/42            -> scales/42.js   the scale object
//   japanese-colour-combos/42.css        -> css/42.css     CSS custom properties
//   japanese-colour-combos/42.scss       -> scss/42.scss   SCSS variables and maps
//   japanese-colour-combos/42.json       -> tokens/42.json W3C design tokens
//   japanese-colour-combos/tailwind/42.css -> tailwind/42.css  Tailwind v4 @theme

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as lib from '../dist-lib/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist-lib')

/** The root `package.json` version, bumped by `npm version`. */
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }

/** Each per-combo format: its path pattern and emitter. */
const FORMATS = {
  'scales/*.js': lib.emitJs,
  'scales/*.d.ts': (scale: { id: number }) =>
    `// ${lib.PACKAGE_NAME} · Wada No. ${scale.id}\nimport type { ComboScale } from '../index.js'\n\ndeclare const scale: ComboScale\nexport default scale\n`,
  'css/*.css': lib.emitCss,
  'scss/*.scss': lib.emitScss,
  'tokens/*.json': lib.emitTokens,
  'tailwind/*.css': lib.emitTailwind,
} as const

for (const pattern of Object.keys(FORMATS))
  mkdirSync(join(out, dirname(pattern)), { recursive: true })

for (const combo of lib.COMBOS) {
  const scale = lib.buildScale(combo)
  for (const [pattern, emit] of Object.entries(FORMATS))
    writeFileSync(join(out, pattern.replace('*', String(combo.id))), emit(scale))
}

const manifest = {
  name: lib.PACKAGE_NAME,
  version,
  license: 'MIT',
  description: 'Importable colour scales for the 348 combinations in Sanzo Wada\'s A Dictionary of Color Combinations: CSS, Tailwind, SCSS, design tokens and typed data.',
  type: 'module',
  repository: { type: 'git', url: 'git+https://github.com/LouisLP/japanese-colour-combos.git' },
  homepage: 'https://louislp.github.io/japanese-colour-combos/',
  keywords: ['colour', 'color', 'palette', 'design-tokens', 'tailwind', 'wada'],
  sideEffects: ['*.css'],
  // Most specific pattern wins, so `42.css` skips `./*` and `tailwind/42.css`
  // skips `./*.css`.
  exports: {
    '.': { types: './index.d.ts', default: './index.js' },
    './package.json': './package.json',
    './tailwind/*.css': './tailwind/*.css',
    './*.css': './css/*.css',
    './*.scss': './scss/*.scss',
    './*.json': './tokens/*.json',
    './*': { types: './scales/*.d.ts', default: './scales/*.js' },
  },
  types: './index.d.ts',
  publishConfig: { access: 'public' },
}
writeFileSync(join(out, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
copyFileSync(join(root, 'src/lib/README.md'), join(out, 'README.md'))
copyFileSync(join(root, 'LICENSE'), join(out, 'LICENSE'))
copyFileSync(join(root, 'THIRD-PARTY-LICENSES.md'), join(out, 'THIRD-PARTY-LICENSES.md'))

console.log(`dist-lib: ${lib.COMBOS.length} combos × ${Object.keys(FORMATS).length} files`)
