// PROTOTYPE — throwaway. `node prototypes/adaptation-model/sweep.ts`
// Runs every combo x variant x mode and reports AA failures + shift cost.

import type { Combo, VariantKey } from './adapt.ts'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { derive, totalShift, VARIANTS } from './adapt.ts'
import { hexToOklch } from './colour.ts'

const here = dirname(fileURLToPath(import.meta.url))
const combos: Combo[] = JSON.parse(readFileSync(join(here, 'combos.json'), 'utf8'))
const keys = Object.keys(VARIANTS) as VariantKey[]
const modes = ['light', 'dark'] as const

interface Fail { combo: number, variant: VariantKey, mode: string, pair: string, ratio: number, target: number }

const rows: string[] = []
const worst: { combo: number, variant: VariantKey, headroom: number }[] = []

for (const v of keys) {
  const fails: Fail[] = []
  let shift = 0
  let unreached = 0
  for (const combo of combos) {
    let headroom = Infinity
    for (const mode of modes) {
      const p = derive(combo, v, mode)
      shift += totalShift(p)
      for (const r of p.audit) {
        headroom = Math.min(headroom, r.ratio / r.target)
        if (!r.pass)
          fails.push({ combo: combo.id, variant: v, mode, pair: r.pair, ratio: r.ratio, target: r.target })
      }
      unreached += Object.values(p.roles).filter(r => r.reached === false).length
    }
    if (v === 'C')
      worst.push({ combo: combo.id, variant: v, headroom })
  }
  const byPair = fails.reduce<Record<string, number>>((m, f) => ({ ...m, [f.pair]: (m[f.pair] ?? 0) + 1 }), {})
  rows.push(
    `\n=== Variant ${v} — ${VARIANTS[v].name} ===\n`
    + `AA failures: ${fails.length} / ${combos.length * 2} renderings`
    + `  (${new Set(fails.map(f => f.combo)).size} distinct combos)\n`
    + `roles that hit the lightness rail without reaching target: ${unreached}\n`
    + `mean total lightness shift per rendering: ${(shift / (combos.length * 2)).toFixed(3)}\n`
    + (fails.length ? `by pair: ${JSON.stringify(byPair)}\n` : '')
    + (fails.length ? `examples: ${fails.slice(0, 6).map(f => `#${f.combo}/${f.mode} ${f.pair} ${f.ratio.toFixed(2)}<${f.target}`).join('; ')}\n` : ''),
  )
}

console.log(rows.join(''))

worst.sort((a, b) => a.headroom - b.headroom)
console.log(`\nTightest combos under variant C (lowest ratio/target headroom):`)
console.log(worst.slice(0, 12).map(w => `#${w.combo} ${w.headroom.toFixed(2)}x`).join('  '))

// Where do the three variants actually disagree?
let disagree = 0
for (const combo of combos) {
  const set = new Set(keys.map(k => JSON.stringify(VARIANTS[k].assign(combo))))
  if (set.size > 1)
    disagree++
}
console.log(`\nCombos where the 3 variants do not all agree on assignment: ${disagree}/${combos.length}`)

// AA is satisfiable by all three. The real differentiators: how vivid the
// resulting UI is, and how far the primary accent drifts from the Wada value.
console.log('\nvariant | accent untouched | mean |dL| accent | mean accent chroma | mean hue-src chroma')
for (const v of keys) {
  let untouched = 0
  let dl = 0
  let chroma = 0
  let srcChroma = 0
  const n = combos.length * modes.length
  for (const combo of combos) {
    for (const mode of modes) {
      const p = derive(combo, v, mode)
      if ((p.roles.accent.shifted ?? 1) === 0)
        untouched++
      dl += p.roles.accent.shifted ?? 0
      chroma += hexToOklch(p.roles.accent.hex).c
      srcChroma += hexToOklch(p.hueSourceColour.hex).c
    }
  }
  console.log(
    `   ${v}    |   ${(100 * untouched / n).toFixed(0)}%            |      ${(dl / n).toFixed(3)}       |       ${(chroma / n).toFixed(3)}        |       ${(srcChroma / n).toFixed(3)}`,
  )
}

process.exit(0)
