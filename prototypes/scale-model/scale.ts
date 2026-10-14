// PROTOTYPE — throwaway. Three candidate tonal-layer models for issue #43.
//
// All three share: 11 steps 50…950, hue held, chroma tapering toward the ends,
// sRGB gamut mapping by chroma reduction (src/theme/colour.ts). They disagree
// about where the exact Wada hex lives:
//
//   A  fixed-L + snap   — every step has a fixed target L; the anchor REPLACES
//                         the step nearest it by L. Swatch is in the ramp.
//   B  anchor-relative  — anchor sits at its own L on its nearest step; the
//                         other steps are re-spaced between it and the ends.
//                         Swatch is in the ramp; step L varies per colour.
//   C  fixed-L + DEFAULT — the ramp is never touched; the exact hex ships as a
//                         separate `DEFAULT` key (Tailwind-style).

import type { Combo } from '../../src/data/combos'
import type { Oklch } from '../../src/theme/colour'
import { assignRoles, HUE_SOURCE_MIN_CHROMA } from '../../src/theme/adapt'
import { contrast, hexToOklch, luminance, oklchToHex, oklchToRgb } from '../../src/theme/colour'

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type Step = typeof STEPS[number]

/** Target OKLab L per step. Grey-equivalent WCAG vs 50: 500≈3.3, 600≈4.8, 950≈16. */
export const TARGET_L = [0.97, 0.93, 0.87, 0.80, 0.71, 0.62, 0.53, 0.45, 0.37, 0.29, 0.22]

/**
 * Two candidate lightness curves, orthogonal to the model:
 *   oklab — fixed perceptual OKLab L per step (TARGET_L).
 *   wcag  — fixed WCAG luminance per step, geometric in (Y + 0.05) so every
 *           100 grades is the same contrast ratio. L is solved per colour.
 *           Grade-gap promises then hold by construction, whatever the hue.
 */
export type CurveKey = 'oklab' | 'wcag'
export const CURVE_NAMES: Record<CurveKey, string> = {
  oklab: 'fixed OKLab L',
  wcag: 'fixed WCAG luminance',
}

/** wcag curve endpoints: Y(50)=0.95, Y(950)=0.004 → ×1.383 contrast per 100 grades. */
export const ENDS = { top: 0.95, bottom: 0.004 }
export let TARGET_Y: number[] = []
/** Contrast ratio gained per 100 grades on the wcag curve. */
export let PER_100 = 1
/** Retune the wcag curve's endpoints (prototype knob: ?yTop= &yBottom=). */
export function setEnds(top: number, bottom: number) {
  ENDS.top = top
  ENDS.bottom = bottom
  PER_100 = ((top + 0.05) / (bottom + 0.05)) ** (1 / 9)
  TARGET_Y = TARGET_L.map((_, i) => (top + 0.05) / PER_100 ** ((STEPS[i] - 50) / 100) - 0.05)
  cache.clear()
}

const cache = new Map<string, ComboScale>()
setEnds(ENDS.top, ENDS.bottom)

/** Position coordinate per curve: the axis steps are evenly spaced along. */
const posOfY = (y: number) => Math.log(y + 0.05)

export type ModelKey = 'A' | 'B' | 'C'
export const MODEL_NAMES: Record<ModelKey, string> = {
  A: 'Fixed L, anchor snaps into nearest step',
  B: 'Anchor-relative, steps re-spaced around it',
  C: 'Fixed L, exact hex as separate DEFAULT',
}

export interface Swatch {
  step: Step
  hex: string
  /** Requested OKLCh, before gamut mapping. */
  want: Oklch
  /** Actual OKLCh of the emitted hex. */
  got: Oklch
  /** sRGB had to cut chroma; Display P3 would have kept more. */
  clipped: boolean
  /** Even P3 could not hold the requested chroma. */
  clippedP3: boolean
  p3: string
}

export interface Ramp {
  name: string
  slug: string
  /** Exact Wada hex. */
  source: string
  swatches: Swatch[]
  /** Index into swatches holding the exact hex (A, B) or the nearest step (C). */
  anchorIndex: number
  /** C only: the anchor is not inside the ramp. */
  separateDefault: boolean
}

export interface ComboScale {
  id: number
  ramps: Ramp[]
  neutral: Ramp
  hueSource: number
}

// ---------------------------------------------------------------------------

/** Chroma taper: full at the anchor's L, falling off toward both ends. */
function chromaAt(l: number, anchor: Oklch): number {
  const t = l > anchor.l
    ? (1 - l) / Math.max(1e-6, 1 - anchor.l) // toward white
    : l / Math.max(1e-6, anchor.l) // toward black
  // Keep a little chroma at the ends so 50/950 still read as the colour.
  return anchor.c * (0.12 + 0.88 * Math.min(1, t) ** 0.85)
}

// --- Display P3, for the "would P3 help?" stat ----------------------------

function oklchToLinearSrgb({ l: L, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const A = c * Math.cos(hr)
  const B = c * Math.sin(hr)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
}
function linSrgbToLinP3([r, g, b]: number[]): [number, number, number] {
  return [
    0.8224621 * r + 0.177538 * g,
    0.0331941 * r + 0.9668058 * g,
    0.0170827 * r + 0.0723974 * g + 0.9105199 * b,
  ]
}
const fits = (v: number[]) => v.every(x => x >= -0.0005 && x <= 1.0005)
const gamma = (x: number) => x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055

function p3Of(col: Oklch): { css: string, clipped: boolean } {
  let c = col.c
  let clipped = false
  if (!fits(linSrgbToLinP3(oklchToLinearSrgb(col)))) {
    clipped = true
    let lo = 0
    let hi = col.c
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2
      if (fits(linSrgbToLinP3(oklchToLinearSrgb({ ...col, c: mid }))))
        lo = mid
      else hi = mid
    }
    c = lo
  }
  const v = linSrgbToLinP3(oklchToLinearSrgb({ ...col, c })).map(x => gamma(Math.min(1, Math.max(0, x))).toFixed(4))
  return { css: `color(display-p3 ${v.join(' ')})`, clipped }
}

function swatch(step: Step, want: Oklch): Swatch {
  const hex = oklchToHex(want)
  const got = hexToOklch(hex)
  const p3 = p3Of(want)
  return { step, hex, want, got, clipped: got.c < want.c - 0.004, clippedP3: p3.clipped, p3: p3.css }
}

function exactSwatch(step: Step, hex: string): Swatch {
  const got = hexToOklch(hex)
  return { step, hex, want: got, got, clipped: false, clippedP3: false, p3: p3Of(got).css }
}

const nearest = (targets: number[], v: number) =>
  targets.reduce((best, t, i) => Math.abs(t - v) < Math.abs(targets[best] - v) ? i : best, 0)

/** Rendered (gamut-mapped) WCAG luminance of an OKLCh colour. */
function lumOf(col: Oklch): number {
  const lin = (x: number) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  const [r, g, b] = oklchToRgb(col)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Solve L so the gamut-mapped colour lands on luminance `y`, chroma from the taper. */
function solveL(y: number, anchor: Oklch): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2
    if (lumOf({ l: mid, c: chromaAt(mid, anchor), h: anchor.h }) < y)
      lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function buildRamp(model: ModelKey, curve: CurveKey, name: string, hex: string): Ramp {
  const anchor = hexToOklch(hex)
  // Work along the curve's own axis: OKLab L, or log(Y + 0.05).
  const targets = curve === 'oklab' ? TARGET_L : TARGET_Y.map(posOfY)
  const anchorPos = curve === 'oklab' ? anchor.l : posOfY(luminance(hex))
  const k = nearest(targets, anchorPos)
  let pos: number[]
  if (model === 'B') {
    // Piecewise-linear in index: ends fixed at the outer targets, anchor at its own position.
    const top = Math.max(targets[0], anchorPos)
    const bottom = Math.min(targets[10], anchorPos)
    pos = targets.map((_, i) => i === k
      ? anchorPos
      : i < k
        ? top + (anchorPos - top) * (i / k)
        : anchorPos + (bottom - anchorPos) * ((i - k) / (10 - k)))
  }
  else {
    pos = [...targets]
  }
  const toL = (p: number) => curve === 'oklab' ? p : solveL(Math.exp(p) - 0.05, anchor)
  const swatches = pos.map((p, i) => {
    if (model !== 'C' && i === k)
      return exactSwatch(STEPS[i], hex)
    const l = toL(p)
    return swatch(STEPS[i], { l, c: chromaAt(l, anchor), h: anchor.h })
  })
  return { name, slug: slugify(name), source: hex, swatches, anchorIndex: k, separateDefault: model === 'C' }
}

/** Tinted neutral from the hue source, same fixed L targets, gentle constant chroma. */
export function buildNeutral(curve: CurveKey, hex: string): Ramp {
  const src = hexToOklch(hex)
  const tinted = src.c >= HUE_SOURCE_MIN_CHROMA
  // Peaks mid-ramp, never more than 0.03: still reads as grey.
  const cAt = (l: number) => tinted ? Math.min(0.03, src.c * 0.16) * (0.5 + 0.5 * Math.max(0, 1 - Math.abs(l - 0.6) / 0.45)) : 0
  const swatches = TARGET_L.map((tl, i) => {
    let l = tl
    if (curve === 'wcag') {
      let lo = 0
      let hi = 1
      for (let n = 0; n < 28; n++) {
        const mid = (lo + hi) / 2
        if (lumOf({ l: mid, c: cAt(mid), h: src.h }) < TARGET_Y[i])
          lo = mid
        else hi = mid
      }
      l = (lo + hi) / 2
    }
    return swatch(STEPS[i], { l, c: cAt(l), h: src.h })
  })
  return { name: 'Neutral', slug: 'neutral', source: hex, swatches, anchorIndex: -1, separateDefault: false }
}

export function buildScale(model: ModelKey, curve: CurveKey, combo: Combo): ComboScale {
  const key = `${model}:${curve}:${combo.id}`
  const hit = cache.get(key)
  if (hit)
    return hit
  const a = assignRoles(combo)
  const out: ComboScale = {
    id: combo.id,
    ramps: combo.colours.map(c => buildRamp(model, curve, c.name, c.hex)),
    neutral: buildNeutral(curve, combo.colours[a.hueSource].hex),
    hueSource: a.hueSource,
  }
  cache.set(key, out)
  return out
}

// ---------------------------------------------------------------------------
// Candidate contrast promises, swept over the whole catalogue.

export interface Promise {
  id: string
  label: string
  /** Pairs of step indices that must clear `ratio`. */
  pairs: [number, number][]
  ratio: number
}

const idx = (s: Step) => STEPS.indexOf(s)
const allPairsWithGap = (gap: number) => {
  const out: [number, number][] = []
  for (let i = 0; i < 11; i++) {
    for (let j = i + 1; j < 11; j++) {
      if (STEPS[j] - STEPS[i] >= gap)
        out.push([i, j])
    }
  }
  return out
}

export const PROMISES: Promise[] = [
  { id: '950/50', label: '950 on 50 ≥ 7:1', pairs: [[idx(50), idx(950)]], ratio: 7 },
  { id: '900/50', label: '900 on 50 ≥ 7:1', pairs: [[idx(50), idx(900)]], ratio: 7 },
  { id: '700/50', label: '700 on 50 ≥ 4.5:1', pairs: [[idx(50), idx(700)]], ratio: 4.5 },
  { id: '600/50', label: '600 on 50 ≥ 4.5:1', pairs: [[idx(50), idx(600)]], ratio: 4.5 },
  { id: '500/50', label: '500 on 50 ≥ 3:1', pairs: [[idx(50), idx(500)]], ratio: 3 },
  { id: '200/900', label: '200 on 900 ≥ 7:1 (dark)', pairs: [[idx(200), idx(900)]], ratio: 7 },
  { id: '300/800', label: '300 on 800 ≥ 4.5:1 (dark)', pairs: [[idx(300), idx(800)]], ratio: 4.5 },
  { id: 'gap500', label: 'any two steps ≥500 apart ≥ 4.5:1', pairs: allPairsWithGap(500), ratio: 4.5 },
  { id: 'gap400', label: 'any two steps ≥400 apart ≥ 3:1', pairs: allPairsWithGap(400), ratio: 3 },
]

export function checkPromise(r: Ramp, p: Promise): { pass: boolean, worst: number } {
  let worst = Infinity
  for (const [i, j] of p.pairs)
    worst = Math.min(worst, contrast(r.swatches[i].hex, r.swatches[j].hex))
  return { pass: worst >= p.ratio, worst }
}

/** Strict L monotonicity of the emitted hexes. */
export const monotonic = (r: Ramp) =>
  r.swatches.every((s, i) => i === 0 || s.got.l < r.swatches[i - 1].got.l)

/** Worst hue drift of emitted hexes vs the source, ignoring near-achromatic steps. */
export function hueDrift(r: Ramp): number {
  const src = hexToOklch(r.source)
  if (src.c < HUE_SOURCE_MIN_CHROMA)
    return 0
  let worst = 0
  for (const s of r.swatches) {
    if (s.got.c < 0.03)
      continue
    const d = Math.abs(((s.got.h - src.h + 540) % 360) - 180)
    worst = Math.max(worst, d)
  }
  return worst
}

/** How far the anchor sits off its step's target, as a contrast ratio (1 = exactly on). */
export function anchorOffset(r: Ramp): number {
  const y = luminance(r.source)
  const t = TARGET_Y[r.anchorIndex]
  return Math.max(y + 0.05, t + 0.05) / Math.min(y + 0.05, t + 0.05)
}
