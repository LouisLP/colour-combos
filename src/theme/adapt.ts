// Combo -> semantic palette (ADR 0002). Assignment is mode-invariant;
// derivation depends on mode.

import type { Combo } from '../data/combos'
import type { Oklch } from './colour'
import { clampToContrast, hexToOklch, HUE_SOURCE_MIN_CHROMA, oklchToHex, onColour } from './colour'
import { accentName, accentRoles, MAX_ACCENTS } from './roles'

/** Both modes, in display order. */
export const MODES = ['light', 'dark'] as const
export type Mode = typeof MODES[number]

/** Mean OKLab L at or above which a combo is light: mid-grey `#808080` (ADR 0008). */
export const MODE_L_THRESHOLD = 0.6

/**
 * A combo's canonical mode (ADR 0008). Equal weights and lightness only: there's
 * no area data to weight by, and lightness is the only axis the canvas moves on.
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

/** Rough canvases per mode, for scoring accents. */
const PROBE_CANVAS: Record<Mode, string> = { light: '#f7f7f7', dark: '#242424' }

/** Drift beyond this much lightness zeroes out the score's chroma reward. */
const DRIFT_PENALTY_SPAN = 0.5
/** Share of a colour's score that drift can eat. */
const DRIFT_PENALTY_WEIGHT = 0.6

/** One entry per combo, so at most 348; static input, nothing to evict. */
const assignmentCache = new Map<number, Assignment>()

/** Which colour plays which role. The same in both modes. */
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

  // The quietest colour tints the paper, since it loses least when chroma is cut
  // ~90%. Below the floor its hue is noise; 46/348 combos have such a colour.
  const eligible = cols.filter(c => c.c >= HUE_SOURCE_MIN_CHROMA)
  const hueSource = [...(eligible.length ? eligible : cols)].sort((x, y) => x.c - y.c)[0].i

  const score = (col: typeof cols[number]) => {
    // How far must this colour move to clear 3:1 against each mode's canvas?
    const cost = (['light', 'dark'] as Mode[])
      .map(m => clampToContrast(col, PROBE_CANVAS[m], 3, m === 'light' ? -1 : 1).shifted)
      .reduce((a, b) => a + b, 0) / 2
    return col.c * (1 - Math.min(1, cost / DRIFT_PENALTY_SPAN) * DRIFT_PENALTY_WEIGHT)
  }

  // The hue source can also be an accent. Excluding it makes White the accent in
  // #55 (Old Rose + White), and light mode drags it to grey (dL 0.38).
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
/** Ceiling, so a vivid hue source can't make the neutrals colourful. */
export const TINT_CAP = { canvas: 0.012, surface: 0.012, muted: 0.02, ink: 0.03, border: 0.035 }
/**
 * Floor, as a fraction of the cap. Keeps tint strength the same across combos,
 * so a near-grey hue source still tints the page.
 */
export const TINT_FLOOR = 0.55

function tint(src: Oklch, l: number, frac: number, cap: number) {
  // An all-grey combo stays grey.
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
  /** False when the contrast floor couldn't be met. */
  reached?: boolean
}

export interface Palette {
  roles: Record<string, Role>
  assignment: Assignment
}

export function derivePalette(combo: Combo, mode: Mode): Palette {
  const a = assignRoles(combo)
  const L = LADDER[mode]
  const src = hexToOklch(combo.colours[a.hueSource].hex)
  const inkC = src.c < HUE_SOURCE_MIN_CHROMA ? 0 : Math.min(src.c * TINT.ink, TINT_CAP.ink)

  const canvas = tint(src, L.canvas, TINT.canvas, TINT_CAP.canvas)
  const surface = tint(src, L.surface, TINT.surface, TINT_CAP.surface)
  const surfaceMuted = tint(src, L.muted, TINT.muted, TINT_CAP.muted)

  // Clamped on surface-muted, the worst surface, so ink passes everywhere.
  const ink = clampToContrast({ l: L.ink, c: inkC, h: src.h }, surfaceMuted, 4.5, L.dir)
  const inkMuted = clampToContrast({ l: L.inkMuted, c: inkC, h: src.h }, surfaceMuted, 4.5, L.dir)

  // A decorative hairline, plus a 3:1 border for real UI edges.
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

  a.accents.slice(0, MAX_ACCENTS).forEach((idx, rank) => {
    const raw = combo.colours[idx]
    const col = hexToOklch(raw.hex)
    // Clamp on the worst surface. Clamping on `canvas` failed muted cards in
    // 454/696 renderings.
    const fill = clampToContrast(col, surfaceMuted, 3, L.dir)
    const text = clampToContrast(col, surfaceMuted, 4.5, L.dir)
    const names = accentRoles(accentName(rank))
    roles[names.fill] = { hex: fill.hex, from: raw.hex, shifted: fill.shifted, reached: fill.reached }
    roles[names.text] = { hex: text.hex, from: raw.hex, shifted: text.shifted, reached: text.reached }
    roles[names.on] = { hex: onColour(fill.hex) }
  })

  return { roles, assignment: a }
}

/** At most 348 × 2 entries (ADR 0005 §3). */
const paletteCache = new Map<string, Palette>()

/** A combo's palette in one mode. The adapter's only entry point, cached. */
export function adapt(combo: Combo, mode: Mode): Palette {
  const key = `${combo.id}:${mode}`
  const hit = paletteCache.get(key)
  if (hit)
    return hit
  const computed = derivePalette(combo, mode)
  paletteCache.set(key, computed)
  return computed
}
