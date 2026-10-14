// Combo -> scale (ADR 0012): a ramp per colour, a neutral ramp, and the
// adapter's roles for both modes.
//
// Keep the maths identical to `prototypes/scale-model/scale.ts`. The 500-grade
// promise passes at exactly 4.50, so even reordering operations can break it
// (`scale.sweep.test.ts` gates this).

import type { Combo } from '../data/combos'
import type { Mode } from '../theme/adapt'
import type { Oklch } from '../theme/colour'
import { adapt, assignRoles, comboMode, HUE_SOURCE_MIN_CHROMA } from '../theme/adapt'
import { hexToOklch, hexToRgb, luminance, oklchToHex, oklchToRgb } from '../theme/colour'

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type Step = typeof STEPS[number]

/** One 8-bit sRGB colour, in every form an export needs. */
export interface ColourValue {
  hex: string
  /** OKLCh of the emitted (gamut-mapped) hex. */
  oklch: [l: number, c: number, h: number]
  /** 8-bit sRGB channels, 0–255. */
  rgb: [r: number, g: number, b: number]
}

export type RampSteps = Record<Step, ColourValue>

export interface ColourRamp {
  /** Wada name, e.g. "English Red". */
  name: string
  /** "english-red". */
  slug: string
  /** The step holding the exact Wada hex (ADR 0012 §6). */
  anchor: Step
  steps: RampSteps
}

export interface NeutralRamp {
  name: 'Neutral'
  slug: 'neutral'
  steps: RampSteps
}

/** Always filled: every combo has at least two colours. */
export type CoreRoleName
  = | 'canvas' | 'surface' | 'surface-muted'
    | 'ink' | 'ink-muted'
    | 'border' | 'border-strong'
    | 'accent' | 'accent-text' | 'on-accent'
    | 'accent-2' | 'accent-2-text' | 'on-accent-2'

/** Filled only for combos of three or more colours. */
export type OptionalRoleName = 'accent-3' | 'accent-3-text' | 'on-accent-3'

export type RoleName = CoreRoleName | OptionalRoleName

export type SemanticRoles = Record<CoreRoleName, ColourValue> & Partial<Record<OptionalRoleName, ColourValue>>

export interface ComboScale {
  id: number
  canonicalMode: Mode
  /** One per Wada colour, in combo order. */
  ramps: ColourRamp[]
  /** Indices into `ramps`, best accent first; names `accent`, `accent-2`, … */
  accents: number[]
  neutral: NeutralRamp
  /** The adapter's exact values, not references to steps (ADR 0012 §9). */
  semantic: Record<Mode, SemanticRoles>
}

// ---------------------------------------------------------------------------
// Lightness curve (ADR 0012 §3)
// ---------------------------------------------------------------------------

/** Target WCAG luminance at the two ends of every ramp. */
export const Y_ENDS = { top: 0.98, bottom: 0.001 } as const

/** Contrast ratio gained per 100 grades: ≈ 1.3965. */
export const PER_100 = ((Y_ENDS.top + 0.05) / (Y_ENDS.bottom + 0.05)) ** (1 / 9)

/** Target WCAG luminance per step, geometric in `Y + 0.05`. */
export const TARGET_Y: readonly number[] = STEPS.map(s => (Y_ENDS.top + 0.05) / PER_100 ** ((s - 50) / 100) - 0.05)

/** Distance in contrast space; steps are even along it. */
const posOfY = (y: number) => Math.log(y + 0.05)

/** Bisection iterations when solving a step's OKLab L. */
const SOLVE_ITERATIONS = 28

/** Rendered (gamut-mapped) WCAG luminance of an OKLCh colour. */
function lumOf(col: Oklch): number {
  const lin = (x: number) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  const [r, g, b] = oklchToRgb(col)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** The OKLab L whose rendered colour, with chroma from `chromaAt`, has luminance `y`. */
function solveL(y: number, chromaAt: (l: number) => number, h: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < SOLVE_ITERATIONS; i++) {
    const mid = (lo + hi) / 2
    if (lumOf({ l: mid, c: chromaAt(mid), h }) < y)
      lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

const round = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp

export function colourValue(hex: string): ColourValue {
  const { l, c, h } = hexToOklch(hex)
  const cr = round(c, 4)
  const [r, g, b] = hexToRgb(hex).map(x => Math.round(x * 255))
  // A grey's hue is numerical noise; report it as 0 rather than a random angle.
  return { hex, oklch: [round(l, 4), cr, cr === 0 ? 0 : round(h, 2)], rgb: [r, g, b] }
}

function toSteps(hexes: string[]): RampSteps {
  return Object.fromEntries(STEPS.map((s, i) => [s, colourValue(hexes[i])])) as RampSteps
}

export const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ---------------------------------------------------------------------------
// Colour ramps (ADR 0012 §4–§6)
// ---------------------------------------------------------------------------

/** Chroma taper: full at the anchor's L, falling to a 12% trace at both ends. */
function taper(anchor: Oklch) {
  return (l: number) => {
    const t = l > anchor.l
      ? (1 - l) / Math.max(1e-6, 1 - anchor.l)
      : l / Math.max(1e-6, anchor.l)
    return anchor.c * (0.12 + 0.88 * Math.min(1, t) ** 0.85)
  }
}

/** The step nearest the colour's luminance, in contrast space. First wins ties. */
export function anchorIndex(hex: string): number {
  const targets = TARGET_Y.map(posOfY)
  const pos = posOfY(luminance(hex))
  return targets.reduce((best, t, i) => Math.abs(t - pos) < Math.abs(targets[best] - pos) ? i : best, 0)
}

interface Tonal { anchor: Step, hexes: string[] }

/** Keyed by hex, since a ramp depends only on it. At most 159 entries. */
const tonalCache = new Map<string, Tonal>()

function tonal(hex: string): Tonal {
  const hit = tonalCache.get(hex)
  if (hit)
    return hit
  const anchor = hexToOklch(hex)
  const chromaAt = taper(anchor)
  const k = anchorIndex(hex)
  const hexes = TARGET_Y.map((y, i) => {
    if (i === k)
      return hex
    const l = solveL(y, chromaAt, anchor.h)
    return oklchToHex({ l, c: chromaAt(l), h: anchor.h })
  })
  const computed = { anchor: STEPS[k], hexes }
  tonalCache.set(hex, computed)
  return computed
}

export function buildRamp(name: string, hex: string): ColourRamp {
  const { anchor, hexes } = tonal(hex)
  return { name, slug: slugify(name), anchor, steps: toSteps(hexes) }
}

// ---------------------------------------------------------------------------
// Neutral ramp (ADR 0012 §11)
// ---------------------------------------------------------------------------

/** Ceiling on the neutral ramp's chroma: it must still read as grey. */
const NEUTRAL_MAX_CHROMA = 0.03

/** Tinted from the hue source, peaking mid-ramp. Grey if the source is. */
export function buildNeutral(hueSourceHex: string): NeutralRamp {
  const src = hexToOklch(hueSourceHex)
  const tinted = src.c >= HUE_SOURCE_MIN_CHROMA
  const chromaAt = (l: number) => tinted
    ? Math.min(NEUTRAL_MAX_CHROMA, src.c * 0.16) * (0.5 + 0.5 * Math.max(0, 1 - Math.abs(l - 0.6) / 0.45))
    : 0
  const hexes = TARGET_Y.map((y) => {
    const l = solveL(y, chromaAt, src.h)
    return oklchToHex({ l, c: chromaAt(l), h: src.h })
  })
  return { name: 'Neutral', slug: 'neutral', steps: toSteps(hexes) }
}

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

function semantic(combo: Combo, mode: Mode): SemanticRoles {
  const { roles } = adapt(combo, mode)
  return Object.fromEntries(Object.entries(roles).map(([name, role]) => [name, colourValue(role.hex)])) as SemanticRoles
}

/** At most 348 entries. */
const scaleCache = new Map<number, ComboScale>()

/** A combo's full scale. Pure in the combo id, and memoized. */
export function buildScale(combo: Combo): ComboScale {
  const hit = scaleCache.get(combo.id)
  if (hit)
    return hit
  const { hueSource, accents } = assignRoles(combo)
  const computed: ComboScale = {
    id: combo.id,
    canonicalMode: comboMode(combo),
    ramps: combo.colours.map(c => buildRamp(c.name, c.hex)),
    accents,
    neutral: buildNeutral(combo.colours[hueSource].hex),
    semantic: { light: semantic(combo, 'light'), dark: semantic(combo, 'dark') },
  }
  scaleCache.set(combo.id, computed)
  return computed
}
