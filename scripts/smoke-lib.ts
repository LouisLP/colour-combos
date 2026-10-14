// Smoke test for the built package: run after `pnpm build:lib`.
//
// Packs `dist-lib/` the way `npm publish` would, installs the tarball into an
// empty project, and imports from it by package name — so the `exports` map,
// the `files` that make it into the tarball and the declarations are all
// exercised as a consumer would meet them.

import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist-lib')

// Every combo in every format: 348 × (js, d.ts, css, scss, json, tailwind).
const COMBOS = 348
const expected = { scales: COMBOS * 2, css: COMBOS, scss: COMBOS, tokens: COMBOS, tailwind: COMBOS }
for (const [dir, count] of Object.entries(expected))
  assert.equal(readdirSync(join(dist, dir)).length, count, `dist-lib/${dir}`)

const consumer = mkdtempSync(join(tmpdir(), 'colour-combos-smoke-'))
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: consumer, encoding: 'utf8' })
const tarball = run('npm', ['pack', dist, '--silent']).trim().split('\n').at(-1)!
writeFileSync(join(consumer, 'package.json'), '{ "type": "module", "private": true }\n')
run('npm', ['install', '--no-audit', '--no-fund', '--offline', `./${tarball}`])

writeFileSync(join(consumer, 'smoke.js'), `
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import scale from 'colour-combos/42'
import { buildScale, emitCss, emitScss, emitTailwind, emitTokens, requireCombo } from 'colour-combos'

const read = specifier => readFileSync(fileURLToPath(import.meta.resolve(specifier)), 'utf8')
const built = buildScale(requireCombo(42))

assert.deepEqual(scale, built, 'colour-combos/42 is the scale buildScale returns')
assert.equal(read('colour-combos/42.css'), emitCss(built))
assert.equal(read('colour-combos/42.scss'), emitScss(built))
assert.equal(read('colour-combos/42.json'), emitTokens(built))
assert.equal(read('colour-combos/tailwind/42.css'), emitTailwind(built))
assert.equal(JSON.parse(read('colour-combos/package.json')).name, 'colour-combos')
`)
run('node', ['smoke.js'])

// The declarations, as a strict NodeNext consumer resolves them.
writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
  compilerOptions: { module: 'nodenext', moduleResolution: 'nodenext', strict: true, noEmit: true, skipLibCheck: false },
  files: ['smoke.ts'],
}))
writeFileSync(join(consumer, 'smoke.ts'), `
import type { ComboScale, Step } from 'colour-combos'
import { buildScale, emitCss, requireCombo } from 'colour-combos'
import scale from 'colour-combos/42'

const typed: ComboScale = scale
const step: Step = typed.ramps[0].anchor
const css: string = emitCss(buildScale(requireCombo(1)))
export { css, step }
`)
execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', consumer], { stdio: 'inherit' })

console.log(`smoke: ${readFileSync(join(dist, 'package.json'), 'utf8').match(/"version": "(.+)"/)![1]} packs, installs, imports and type-checks`)
