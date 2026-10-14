// ADR 0012 §7's pairings for every ramp in all 348 combos. A CI hard gate. The
// 500-grade rule passes at exactly 4.50, so a curve change that fails it is out.

import type { ColourRamp, NeutralRamp, Step } from './scale'
import { describe, expect, it } from 'vitest'
import { COMBOS } from '../data/combos'
import { contrast, hexToOklch, HUE_SOURCE_MIN_CHROMA } from '../theme/colour'
import { buildScale, STEPS } from './scale'

const SCALES = COMBOS.map(buildScale)
const COLOUR_RAMPS = SCALES.flatMap(s => s.ramps.map(ramp => ({ id: s.id, ramp })))
const ALL_RAMPS: { id: number, ramp: ColourRamp | NeutralRamp }[] = [
  ...COLOUR_RAMPS,
  ...SCALES.map(s => ({ id: s.id, ramp: s.neutral })),
]

const label = (id: number, ramp: ColourRamp | NeutralRamp) => `#${id} ${ramp.slug}`

interface Promise {
  label: string
  pairs: [Step, Step][]
  ratio: number
}

function pairsWithGap(gap: number): [Step, Step][] {
  return STEPS.flatMap(a => STEPS.filter(b => b - a >= gap).map(b => [a, b] as [Step, Step]))
}

const PROMISES: Promise[] = [
  { label: '950 on 50 ≥ 7:1', pairs: [[50, 950]], ratio: 7 },
  { label: '900 on 50 ≥ 7:1', pairs: [[50, 900]], ratio: 7 },
  { label: '600 on 50 ≥ 4.5:1', pairs: [[50, 600]], ratio: 4.5 },
  { label: '500 on 50 ≥ 3:1', pairs: [[50, 500]], ratio: 3 },
  { label: 'any two steps ≥500 apart ≥ 4.5:1', pairs: pairsWithGap(500), ratio: 4.5 },
  { label: 'any two steps ≥400 apart ≥ 3:1', pairs: pairsWithGap(400), ratio: 3 },
]

/** Maximum hue drift of an emitted step from its Wada colour (ADR 0012 §5). */
const HUE_DRIFT_TOLERANCE = 8
/** Below this chroma, hue is 8-bit noise and isn't checked. */
const HUE_DRIFT_MIN_CHROMA = 0.03

describe('scale sweep — ADR 0012 across the whole catalogue', () => {
  it('covers every colour and neutral ramp in the catalogue', () => {
    expect(SCALES).toHaveLength(348)
    expect(COLOUR_RAMPS).toHaveLength(1032)
    expect(ALL_RAMPS).toHaveLength(1380)
  })

  // Strict `>=`, no epsilon: the worst 500-grade case is exactly on the line.
  it.each(PROMISES)('keeps the promise: $label', ({ pairs, ratio }) => {
    const failures = ALL_RAMPS.flatMap(({ id, ramp }) =>
      pairs
        .map(([a, b]) => ({ a, b, r: contrast(ramp.steps[a].hex, ramp.steps[b].hex) }))
        .filter(({ r }) => r < ratio)
        .map(({ a, b, r }) => `${label(id, ramp)} ${a}/${b} ${r.toFixed(3)} < ${ratio}`),
    )

    // Listed in full, so a failure is its own diagnosis.
    expect(failures).toEqual([])
  })

  it('places the exact Wada hex at the anchor step of every colour ramp', () => {
    const misses = SCALES.flatMap((s) => {
      const combo = COMBOS.find(c => c.id === s.id)!
      return s.ramps
        .filter((ramp, i) => ramp.steps[ramp.anchor].hex !== combo.colours[i].hex)
        .map(ramp => `#${s.id} ${ramp.slug}`)
    })

    expect(misses).toEqual([])
  })

  it('is strictly monotonic in lightness, light to dark, in every ramp', () => {
    const bad = ALL_RAMPS.filter(({ ramp }) =>
      STEPS.some((s, i) => i > 0 && hexToOklch(ramp.steps[s].hex).l >= hexToOklch(ramp.steps[STEPS[i - 1]].hex).l),
    ).map(({ id, ramp }) => label(id, ramp))

    expect(bad).toEqual([])
  })

  it(`holds hue within ${HUE_DRIFT_TOLERANCE}° after gamut mapping (measured 6.6°)`, () => {
    const drifts = SCALES.flatMap((s) => {
      const combo = COMBOS.find(c => c.id === s.id)!
      return s.ramps.flatMap((ramp, i) => {
        const src = hexToOklch(combo.colours[i].hex)
        if (src.c < HUE_SOURCE_MIN_CHROMA)
          return []
        return STEPS
          .map(step => ({ step, got: hexToOklch(ramp.steps[step].hex) }))
          .filter(({ got }) => got.c >= HUE_DRIFT_MIN_CHROMA)
          .map(({ step, got }) => ({ step, d: Math.abs(((got.h - src.h + 540) % 360) - 180) }))
          .filter(({ d }) => d > HUE_DRIFT_TOLERANCE)
          .map(({ step, d }) => `${label(s.id, ramp)} ${step} ${d.toFixed(1)}°`)
      })
    })

    expect(drifts).toEqual([])
  })

  it('gives a colour the same ramp in every combo that contains it', () => {
    const byHex = new Map<string, string>()
    const conflicts: string[] = []
    for (const { id, ramp } of COLOUR_RAMPS) {
      const hex = ramp.steps[ramp.anchor].hex
      const json = JSON.stringify(ramp)
      const seen = byHex.get(hex)
      if (seen === undefined)
        byHex.set(hex, json)
      else if (seen !== json)
        conflicts.push(`#${id} ${ramp.slug}`)
    }

    expect(conflicts).toEqual([])
    expect(byHex.size).toBe(159)
  })
})
