// Combo -> semantic palette. Implements ADR 0002 (chroma-weighted hybrid).
//
// Assignment (which colour plays which role) is MODE-INVARIANT per ADR 0001.
// Derivation (the final value) is mode-dependent.

import type { Combo, ComboColour } from '../data/combos'
import type { Oklch } from './colour'
import { clampToContrast, hexToOklch, oklchToHex, onColour } from './colour'

export type Mode = 'light' | 'dark'

/**
 * The lightness a combo must average, in OKLab L, to render light rather than
 * dark. 0.60 is the OKLab lightness of neutral mid-grey (`#808080`): a combo
 * whose colours are, on average, lighter than mid-grey reads as a light palette
 * and gets a near-white canvas; darker reads as a dark palette and gets a
 * near-black one (ADR 0008).
 */
export const MODE_L_THRESHOLD = 0.6

/**
 * The mode a combo renders in — combo-owned, not user-chosen (ADR 0008). Mean
 * OKLab lightness across the combo's raw colours, thresholded at mid-grey.
 *
 * Equal-weight and lightness-only on purpose: no area information exists to
 * weight by, and lightness is the single axis the near-neutral canvas swings
 * along. Chroma and hue decide *which* colour tints the canvas (`assignRoles`),
 * never how bright the room is.
 */
export function comboMode(combo: Combo): Mode {
  const meanL = combo.colours.reduce((sum, c) => sum + hexToOklch(c.hex).l, 0) / combo.colours.length
  return meanL >= MODE_L_THRESHOLD ? 'light' : 'dark'
}

export interface Assignment {
  /** Index into combo.colours whose hue tints the neutrals. */
  hueSource: number
  /** Indices into combo.colours, most accent-worthy first. */
  accents: number[]
}

/** Below this OKLCh chroma a colour's hue carries no usable information. */
export const HUE_SOURCE_MIN_CHROMA = 0.04

/** Canvases the accent score probes against. Approximations of the two ladders. */
const PROBE_CANVAS: Record<Mode, string> = { light: '#f7f7f7', dark: '#242424' }

/** Drift beyond this much lightness zeroes out the score's chroma reward. */
const DRIFT_PENALTY_SPAN = 0.5
/** Share of a colour's score that drift can eat. */
const DRIFT_PENALTY_WEIGHT = 0.6

/**
 * Mode-invariant, so one entry per combo. Bounded at 348 by the catalogue, whose
 * inputs are committed static data — no eviction policy, nothing to invalidate
 * (ADR 0005 §3).
 */
const assignmentCache = new Map<number, Assignment>()

/**
 * Which colour plays which role. Computed once per combo and invariant across
 * modes, so it is safe to cache by combo id.
 */
export function assignRoles(combo: Combo): Assignment {
  const hit = assignmentCache.get(combo.id)
  if (hit)
    return hit
  const computed = computeAssignment(combo)
  assignmentCache.set(combo.id, computed)
  return computed
}

function computeAssignment(combo: Combo): Assignment {
  const cols = combo.colours.map((c, i) => ({ i, ...hexToOklch(c.hex) }))

  // Quietest colour tints the paper — it loses the least when chroma is cut
  // ~90%. But below ~0.04 chroma a colour's hue is numerical noise, and tinting
  // the whole site with it is arbitrary. 46/348 combos contain such a colour;
  // unfiltered, this picks it every time.
  const eligible = cols.filter(c => c.c >= HUE_SOURCE_MIN_CHROMA)
  const hueSource = [...(eligible.length ? eligible : cols)].sort((x, y) => x.c - y.c)[0].i

  const score = (col: typeof cols[number]) => {
    // How far must this colour move to clear 3:1 against each mode's canvas?
    const cost = (['light', 'dark'] as Mode[])
      .map(m => clampToContrast(col, PROBE_CANVAS[m], 3, m === 'light' ? -1 : 1).shifted)
      .reduce((a, b) => a + b, 0) / 2
    return col.c * (1 - Math.min(1, cost / DRIFT_PENALTY_SPAN) * DRIFT_PENALTY_WEIGHT)
  }

  // The hue source is NOT excluded from accent ranking. Combo #55 is Old Rose +
  // White: excluding it forces White to be the accent, and light mode drags
  // White to grey (dL 0.38). One colour playing both roles is a better
  // rendering than a colour that has to stop being itself.
  const accents = [...cols].sort((x, y) => score(y) - score(x)).map(c => c.i)
  return { hueSource, accents }
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/** Lightness ladder per mode. Neutrals are derived, never raw. */
export const LADDER = {
  light: { canvas: 0.985, surface: 1.0, muted: 0.945, ink: 0.24, inkMuted: 0.52, border: 0.88, dir: -1 as const },
  dark: { canvas: 0.18, surface: 0.225, muted: 0.28, ink: 0.94, inkMuted: 0.72, border: 0.35, dir: 1 as const },
}

/** Chroma retained by the near-neutrals, as a fraction of the hue source's. */
export const TINT = { canvas: 0.08, surface: 0.06, muted: 0.14, ink: 0.16, border: 0.3 }
/** Hard ceiling so a vivid hue source can't make the "neutral" actually colourful. */
export const TINT_CAP = { canvas: 0.012, surface: 0.012, muted: 0.02, ink: 0.03, border: 0.035 }
/**
 * Floor, as a fraction of the cap. Without it, tint strength tracks the hue
 * source's own chroma, so combos whose quietest colour is near-grey render an
 * untinted page while vivid ones render a tinted one — the same algorithm
 * reading as two different products. The floor makes tint strength constant
 * and lets the hue source be chosen purely on hue quality.
 */
export const TINT_FLOOR = 0.55

function tint(src: Oklch, l: number, frac: number, cap: number) {
  // An all-grey combo gets a genuinely grey site rather than an arbitrary tint.
  if (src.c < HUE_SOURCE_MIN_CHROMA)
    return oklchToHex({ l, c: 0, h: 0 })
  return oklchToHex({ l, c: Math.min(Math.max(src.c * frac, cap * TINT_FLOOR), cap), h: src.h })
}

export interface Role {
  hex: string
  /** The raw Wada value this role was derived from, where there is one. */
  from?: string
  /** Lightness moved to satisfy the contrast contract. */
  shifted?: number
  /** False when the contract could not be met at the lightness rail. */
  reached?: boolean
}

export interface Palette {
  roles: Record<string, Role>
  assignment: Assignment
  hueSourceColour: ComboColour
  accentColours: ComboColour[]
  /**
   * False when no colour in the combo cleared `HUE_SOURCE_MIN_CHROMA`, so the
   * neutrals are genuinely achromatic rather than tinted (ADR 0002 §2). The
   * stylesheet's relative-colour ramp reads this as `--tint-scale`, which is how
   * a declarative ramp reproduces the branch `tint()` takes here.
   */
  tinted: boolean
}

export function derivePalette(combo: Combo, mode: Mode): Palette {
  const a = assignRoles(combo)
  const L = LADDER[mode]
  const src = hexToOklch(combo.colours[a.hueSource].hex)
  const inkC = src.c < HUE_SOURCE_MIN_CHROMA ? 0 : Math.min(src.c * TINT.ink, TINT_CAP.ink)

  const canvas = tint(src, L.canvas, TINT.canvas, TINT_CAP.canvas)
  const surface = tint(src, L.surface, TINT.surface, TINT_CAP.surface)
  const surfaceMuted = tint(src, L.muted, TINT.muted, TINT_CAP.muted)

  // Ink is derived from the hue source too, then clamped to AA on the *lowest
  // contrast* surface it can land on (muted), so it passes everywhere.
  const ink = clampToContrast({ l: L.ink, c: inkC, h: src.h }, surfaceMuted, 4.5, L.dir)
  const inkMuted = clampToContrast({ l: L.inkMuted, c: inkC, h: src.h }, surfaceMuted, 4.5, L.dir)

  // Decorative hairline (no contrast promise) + a 3:1 boundary for real UI edges.
  const borderHex = tint(src, L.border, TINT.border, TINT_CAP.border)
  const borderStrong = clampToContrast(hexToOklch(borderHex), canvas, 3, L.dir)

  const roles: Record<string, Role> = {
    'canvas': { hex: canvas },
    'surface': { hex: surface },
    'surface-muted': { hex: surfaceMuted },
    'ink': { hex: ink.hex, from: combo.colours[a.hueSource].hex, shifted: ink.shifted, reached: ink.reached },
    'ink-muted': { hex: inkMuted.hex, shifted: inkMuted.shifted, reached: inkMuted.reached },
    'border': { hex: borderHex },
    'border-strong': { hex: borderStrong.hex, shifted: borderStrong.shifted, reached: borderStrong.reached },
  }

  const accentColours: ComboColour[] = []
  a.accents.slice(0, 3).forEach((idx, rank) => {
    const raw = combo.colours[idx]
    accentColours.push(raw)
    const col = hexToOklch(raw.hex)
    // Clamp against surface-muted, the LOWEST-contrast backdrop either role can
    // land on. Clamping against `canvas` passes the audit there and silently
    // fails on muted cards — measured at 454/696 renderings before this change.
    const fill = clampToContrast(col, surfaceMuted, 3, L.dir)
    const text = clampToContrast(col, surfaceMuted, 4.5, L.dir)
    const suffix = rank === 0 ? '' : `-${rank + 1}`
    roles[`accent${suffix}`] = { hex: fill.hex, from: raw.hex, shifted: fill.shifted, reached: fill.reached }
    roles[`accent${suffix}-text`] = { hex: text.hex, from: raw.hex, shifted: text.shifted, reached: text.reached }
    roles[`on-accent${suffix}`] = { hex: onColour(fill.hex) }
  })

  return {
    roles,
    assignment: a,
    hueSourceColour: combo.colours[a.hueSource],
    accentColours,
    tinted: src.c >= HUE_SOURCE_MIN_CHROMA,
  }
}

/** Bounded at 348 x 2 for the whole catalogue (ADR 0005 §3). */
const paletteCache = new Map<string, Palette>()

/**
 * The palette for a combo in a mode. The app's single entry point to the
 * adapter, and cached here rather than in a `useMemo` so the AA sweep exercises
 * exactly the code the site renders from (ADR 0005 §3).
 */
export function adapt(combo: Combo, mode: Mode): Palette {
  const key = `${combo.id}:${mode}`
  const hit = paletteCache.get(key)
  if (hit)
    return hit
  const computed = derivePalette(combo, mode)
  paletteCache.set(key, computed)
  return computed
}

/** How far a palette drifted from the raw combo — the "recognisability" cost. */
export function totalShift(p: Palette): number {
  return Object.values(p.roles).reduce((sum, r) => sum + (r.shifted ?? 0), 0)
}
