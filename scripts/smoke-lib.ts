// Run after `pnpm build:lib`. Packs `dist-lib/`, installs the tarball into an
// empty project and imports it by name, so `exports`, the packed files and the
// types are tested the way a consumer meets them.

import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMBO_COUNT, EXPORT_FORMATS } from '../dist-lib/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist-lib')

// Every combo in every format, declarations included.
const expected = new Map<string, number>()
for (const { file } of EXPORT_FORMATS.flatMap(f => [f, ...(f.types ? [f.types] : [])]))
  expected.set(dirname(file), (expected.get(dirname(file)) ?? 0) + COMBO_COUNT)
for (const [dir, count] of expected)
  assert.equal(readdirSync(join(dist, dir)).length, count, `dist-lib/${dir}`)

const consumer = mkdtempSync(join(tmpdir(), 'japanese-colour-combos-smoke-'))
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: consumer, encoding: 'utf8' })
const tarball = run('npm', ['pack', dist, '--silent']).trim().split('\n').at(-1)!
writeFileSync(join(consumer, 'package.json'), '{ "type": "module", "private": true }\n')
run('npm', ['install', '--no-audit', '--no-fund', '--offline', `./${tarball}`])

writeFileSync(join(consumer, 'smoke.js'), `
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import scale from 'japanese-colour-combos/42'
import { buildScale, EXPORT_FORMATS, importStatementFor, requireCombo, specifierFor } from 'japanese-colour-combos'

const read = specifier => readFileSync(fileURLToPath(import.meta.resolve(specifier)), 'utf8')
const built = buildScale(requireCombo(42))

assert.deepEqual(scale, built, 'japanese-colour-combos/42 is the scale buildScale returns')
// The specifier the dialog's import line shows loads that format's text.
for (const format of EXPORT_FORMATS) {
  const specifier = specifierFor(format, 42)
  assert.ok(importStatementFor(format, 42).includes(specifier), format.id)
  assert.equal(read(specifier), format.emit(built), specifier)
}
assert.equal(JSON.parse(read('japanese-colour-combos/package.json')).name, 'japanese-colour-combos')
`)
run('node', ['smoke.js'])

// The declarations, as a strict NodeNext consumer resolves them.
writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
  compilerOptions: { module: 'nodenext', moduleResolution: 'nodenext', strict: true, noEmit: true, skipLibCheck: false },
  files: ['smoke.ts'],
}))
writeFileSync(join(consumer, 'smoke.ts'), `
import type { ComboScale, Step } from 'japanese-colour-combos'
import { buildScale, emitCss, requireCombo } from 'japanese-colour-combos'
import scale from 'japanese-colour-combos/42'

const typed: ComboScale = scale
const step: Step = typed.ramps[0].anchor
const css: string = emitCss(buildScale(requireCombo(1)))
export { css, step }
`)
execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', consumer], { stdio: 'inherit' })

console.log(`smoke: ${readFileSync(join(dist, 'package.json'), 'utf8').match(/"version": "(.+)"/)![1]} packs, installs, imports and type-checks`)
