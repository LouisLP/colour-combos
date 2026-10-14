// PROTOTYPE — headless sweep of the three models over all 348 combos.
// Run: pnpm dlx tsx prototypes/scale-model/sweep.ts
import type { CurveKey, ModelKey, Ramp } from './scale'
import { COMBOS } from '../../src/data/combos'
import { anchorOffset, setEnds, buildScale, checkPromise, CURVE_NAMES, hueDrift, MODEL_NAMES, monotonic, PROMISES, STEPS } from './scale'

export interface SweepResult {
  colourRamps: number
  promises: Record<string, { colourFail: number, neutralFail: number, worst: number }>
  nonMonotonic: number
  maxHueDrift: number
  clippedSteps: number
  clippedP3Steps: number
  totalSteps: number
  anchorHistogram: number[]
  maxAnchorOffset: number
  slugCollisions: number
}

export function sweep(model: ModelKey, curve: CurveKey): SweepResult {
  const res: SweepResult = {
    colourRamps: 0,
    promises: Object.fromEntries(PROMISES.map(p => [p.id, { colourFail: 0, neutralFail: 0, worst: Infinity }])),
    nonMonotonic: 0,
    maxHueDrift: 0,
    clippedSteps: 0,
    clippedP3Steps: 0,
    totalSteps: 0,
    anchorHistogram: STEPS.map(() => 0),
    maxAnchorOffset: 0,
    slugCollisions: 0,
  }
  for (const combo of COMBOS) {
    const s = buildScale(model, curve, combo)
    const slugs = new Set(s.ramps.map(r => r.slug))
    if (slugs.size !== s.ramps.length)
      res.slugCollisions++
    const tally = (r: Ramp, neutral: boolean) => {
      for (const p of PROMISES) {
        const { pass, worst } = checkPromise(r, p)
        const t = res.promises[p.id]
        if (!pass)
          neutral ? t.neutralFail++ : t.colourFail++
        t.worst = Math.min(t.worst, worst)
      }
      if (!monotonic(r))
        res.nonMonotonic++
      res.maxHueDrift = Math.max(res.maxHueDrift, hueDrift(r))
      for (const sw of r.swatches) {
        res.totalSteps++
        if (sw.clipped)
          res.clippedSteps++
        if (sw.clippedP3)
          res.clippedP3Steps++
      }
    }
    for (const r of s.ramps) {
      res.colourRamps++
      res.anchorHistogram[r.anchorIndex]++
      res.maxAnchorOffset = Math.max(res.maxAnchorOffset, anchorOffset(r))
      tally(r, false)
    }
    tally(s.neutral, true)
  }
  return res
}

// CLI
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('sweep.ts')) {
  if (process.env.Y_TOP)
    setEnds(Number(process.env.Y_TOP), Number(process.env.Y_BOTTOM))
  for (const curve of ['oklab', 'wcag'] as CurveKey[]) for (const m of ['A', 'B', 'C'] as ModelKey[]) {
    const r = sweep(m, curve)
    console.log(`\n== ${m}/${curve}: ${MODEL_NAMES[m]}, ${CURVE_NAMES[curve]} (${r.colourRamps} colour ramps + 348 neutral)`)
    for (const p of PROMISES) {
      const t = r.promises[p.id]
      console.log(`  ${p.label.padEnd(38)} colour fail ${String(t.colourFail).padStart(4)}  neutral fail ${String(t.neutralFail).padStart(3)}  worst ${t.worst.toFixed(2)}`)
    }
    console.log(`  non-monotonic ${r.nonMonotonic}  max hue drift ${r.maxHueDrift.toFixed(1)}°  sRGB-clipped ${r.clippedSteps}/${r.totalSteps}  P3-clipped ${r.clippedP3Steps}`)
    console.log(`  anchor steps ${STEPS.map((s, i) => `${s}:${r.anchorHistogram[i]}`).join(' ')}  max anchor off-target ×${r.maxAnchorOffset.toFixed(2)}  slug collisions ${r.slugCollisions}`)
  }
}
