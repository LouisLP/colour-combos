// Writes the per-combo files and `package.json` into `dist-lib/`, from the entry
// tsdown just built there, so every file comes from the code the package ships.
// The formats themselves are in `src/lib/emit/formats.ts`.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as lib from '../dist-lib/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist-lib')

/** The root `package.json` version, bumped by `npm version`. */
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }

/** Every per-combo file: its path pattern and emitter. */
const FILES = lib.EXPORT_FORMATS.flatMap(f => [{ file: f.file, emit: f.emit }, ...(f.types ? [f.types] : [])])

for (const { file } of FILES)
  mkdirSync(join(out, dirname(file)), { recursive: true })

for (const combo of lib.COMBOS) {
  const scale = lib.buildScale(combo)
  for (const { file, emit } of FILES)
    writeFileSync(join(out, file.replace('*', String(combo.id))), emit(scale))
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
  // Most specific pattern wins, whatever the order, so `42.css` skips `./*`
  // and `tailwind/42.css` skips `./*.css`.
  exports: {
    '.': { types: './index.d.ts', default: './index.js' },
    './package.json': './package.json',
    ...Object.fromEntries(lib.EXPORT_FORMATS.map(f => [
      `./${f.subpath}`,
      f.types ? { types: `./${f.types.file}`, default: `./${f.file}` } : `./${f.file}`,
    ])),
  },
  types: './index.d.ts',
  publishConfig: { access: 'public' },
}
writeFileSync(join(out, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
copyFileSync(join(root, 'src/lib/README.md'), join(out, 'README.md'))
copyFileSync(join(root, 'LICENSE'), join(out, 'LICENSE'))
copyFileSync(join(root, 'THIRD-PARTY-LICENSES.md'), join(out, 'THIRD-PARTY-LICENSES.md'))

console.log(`dist-lib: ${lib.COMBOS.length} combos × ${FILES.length} files`)
