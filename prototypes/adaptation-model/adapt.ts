// PROTOTYPE — throwaway. Three candidate combo -> semantic-palette algorithms.
//
// Assignment (which colour plays which role) is MODE-INVARIANT per ADR 0001.
// Derivation (the final value) is mode-dependent. The three variants differ
// ONLY in assignment; they share one derivation so they are comparable.

import type { Oklch } from './colour.ts'
import { clampToContrast, contrast, hexToOklch, oklchToHex, onColour } from './colour.ts'

export interface ComboColour { index: number, name: string, hex: string }
export interface Combo { id: number, size: number, colours: ComboColour[] }
export type Mode = 'light' | 'dark'

export interface Assignment {
  /** Index into combo.colours whose hue tints the neutrals. */
  hueSource: number
  /** Indices into combo.colours, most accent-worthy first. */
  accents: number[]
}

export type VariantKey = 'A' | 'B' | 'C'

/** Below this OKLCh chroma a colour's hue carries no usable information. */
export const HUE_SOURCE_MIN_CHROMA = 0.04

export const VARIANTS: Record<VariantKey, { name: string, blurb: string, assign: (c: Combo) => Assignment }> = {
  A: {
    name: 'Source order',
    blurb: 'Wada listed the colours deliberately: #1 is the accent, #2 tints the paper, the rest are secondary accents. No analysis.',
    assign: (combo) => {
      const n = combo.colours.length
      const hueSource = n > 1 ? 1 : 0
      const accents = [0, ...Array.from({ length: n }, (_, i) => i).filter(i => i !== 0 && i !== hueSource), hueSource]
      return { hueSource, accents }
    },
  },
  B: {
    name: 'Luminance ordering',
    blurb: 'Lightest colour is the paper (hue source); darkest is the primary accent; middles are secondary. Pure ordering, ignores chroma.',
    assign: (combo) => {
      const byL = combo.colours
        .map((c, i) => ({ i, l: hexToOklch(c.hex).l }))
        .sort((x, y) => y.l - x.l)
      const hueSource = byL[0].i
      const accents = byL.slice(1).reverse().map(x => x.i)
      return { hueSource, accents: accents.length ? [...accents, hueSource] : [hueSource] }
    },
  },
  C: {
    name: 'Chroma-weighted hybrid',
    blurb: 'Quietest colour (lowest chroma) tints the paper — it loses the least when chroma is cut 90%. Accents ranked by chroma discounted by how far they must move to clear AA in BOTH modes.',
    assign: (combo) => {
      const cols = combo.colours.map((c, i) => ({ i, ...hexToOklch(c.hex), hex: c.hex }))
      // Quietest colour tints the paper — but below ~0.04 chroma a colour's hue
      // is numerical noise, and tinting the whole site with it is arbitrary.
      // 46/348 combos contain such a colour; unfiltered, C picks it every time.
      const eligible = cols.filter(c => c.c >= HUE_SOURCE_MIN_CHROMA)
      const hueSource = (eligible.length ? [...eligible] : [...cols]).sort((x, y) => x.c - y.c)[0].i
      const score = (col: typeof cols[number]) => {
        // How far must this colour move to clear 3:1 against each mode's canvas?
        const cost = (['light', 'dark'] as Mode[])
          .map((m) => {
            const canvas = m === 'light' ? '#f7f7f7' : '#242424'
            return clampToContrast(col, canvas, 3, m === 'light' ? -1 : 1).shifted
          })
          .reduce((a, b) => a + b, 0) / 2
        return col.c * (1 - Math.min(1, cost / 0.5) * 0.6)
      }
      // The hue source is NOT excluded from accent ranking. Combo #55 is Old
      // Rose + White: excluding it forces White to be the accent, and light mode
      // drags White to grey (dL 0.38). One colour playing both roles is a better
      // rendering than a colour that has to stop being itself.
      const accents = [...cols].sort((x, y) => score(y) - score(x)).map(c => c.i)
      return { hueSource, accents }
    },
  },
}

// ---------------------------------------------------------------------------
// Shared derivation
// ---------------------------------------------------------------------------

/** Lightness ladder per mode. Neutrals are derived, never raw. */
const LADDER = {
  light: { canvas: 0.985, surface: 1.0, muted: 0.945, ink: 0.24, inkMuted: 0.52, border: 0.88, dir: -1 as const },
  dark: { canvas: 0.18, surface: 0.225, muted: 0.28, ink: 0.94, inkMuted: 0.72, border: 0.35, dir: 1 as const },
}

/** Chroma retained by the near-neutrals, as a fraction of the hue source's. */
const TINT = { canvas: 0.08, surface: 0.06, muted: 0.14, ink: 0.16, border: 0.3 }
/** Hard ceiling so a vivid hue source can't make the "neutral" actually colourful. */
const TINT_CAP = { canvas: 0.012, surface: 0.012, muted: 0.02, ink: 0.03, border: 0.035 }
/**
 * Floor, as a fraction of the cap. Without it, tint strength tracks the hue
 * source's own chroma, so combos whose quietest colour is near-grey render an
 * untinted page while vivid ones render a tinted one — the same algorithm
 * reading as two different products. The floor makes tint strength constant
 * and lets the hue source be chosen purely on hue quality.
 */
const TINT_FLOOR = 0.55

const tint = (src: Oklch, l: number, frac: number, cap: number) =>
  src.c < HUE_SOURCE_MIN_CHROMA
    // An all-grey combo gets a genuinely grey site rather than an arbitrary tint.
    ? oklchToHex({ l, c: 0, h: 0 })
    : oklchToHex({ l, c: Math.min(Math.max(src.c * frac, cap * TINT_FLOOR), cap), h: src.h })

export interface Role { hex: string, from?: string, shifted?: number, reached?: boolean }
export interface Palette {
  roles: Record<string, Role>
  assignment: Assignment
  hueSourceColour: ComboColour
  accentColours: ComboColour[]
  audit: AuditRow[]
}
export interface AuditRow { pair: string, ratio: number, target: number, pass: boolean, large?: boolean }

export function derive(combo: Combo, variant: VariantKey, mode: Mode): Palette {
  const a = VARIANTS[variant].assign(combo)
  const L = LADDER[mode]
  const src = hexToOklch(combo.colours[a.hueSource].hex)
  const inkC = src.c < HUE_SOURCE_MIN_CHROMA ? 0 : Math.min(src.c * TINT.ink, TINT_CAP.ink)

  const canvas = tint(src, L.canvas, TINT.canvas, TINT_CAP.canvas)
  const surface = tint(src, L.surface, TINT.surface, TINT_CAP.surface)
  const surfaceMuted = tint(src, L.muted, TINT.muted, TINT_CAP.muted)

  // Ink is derived from the hue source too, then clamped to AA on the *lowest
  // contrast* surface it can land on (muted), so it passes everywhere.
  const inkSeed = { l: L.ink, c: inkC, h: src.h }
  const ink = clampToContrast(inkSeed, surfaceMuted, 4.5, L.dir)
  const inkMutedSeed = { l: L.inkMuted, c: inkC, h: src.h }
  const inkMuted = clampToContrast(inkMutedSeed, surfaceMuted, 4.5, L.dir)

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

  const audit: AuditRow[] = [
    { pair: 'ink / canvas', ratio: contrast(roles.ink.hex, canvas), target: 4.5, pass: false },
    { pair: 'ink / surface', ratio: contrast(roles.ink.hex, surface), target: 4.5, pass: false },
    { pair: 'ink / surface-muted', ratio: contrast(roles.ink.hex, surfaceMuted), target: 4.5, pass: false },
    { pair: 'ink-muted / canvas', ratio: contrast(roles['ink-muted'].hex, canvas), target: 4.5, pass: false },
    { pair: 'ink-muted / surface-muted', ratio: contrast(roles['ink-muted'].hex, surfaceMuted), target: 4.5, pass: false },
    { pair: 'border-strong / canvas', ratio: contrast(roles['border-strong'].hex, canvas), target: 3, pass: false },
    { pair: 'accent / canvas (fill)', ratio: contrast(roles.accent.hex, canvas), target: 3, pass: false },
    { pair: 'accent-text / canvas', ratio: contrast(roles['accent-text'].hex, canvas), target: 4.5, pass: false },
    { pair: 'accent-text / surface-muted', ratio: contrast(roles['accent-text'].hex, surfaceMuted), target: 4.5, pass: false },
    { pair: 'on-accent / accent', ratio: contrast(roles['on-accent'].hex, roles.accent.hex), target: 4.5, pass: false },
  ]
  if (roles['accent-2']) {
    audit.push(
      { pair: 'accent-2 / canvas (fill)', ratio: contrast(roles['accent-2'].hex, canvas), target: 3, pass: false },
      { pair: 'accent-2-text / canvas', ratio: contrast(roles['accent-2-text'].hex, canvas), target: 4.5, pass: false },
      { pair: 'on-accent-2 / accent-2', ratio: contrast(roles['on-accent-2'].hex, roles['accent-2'].hex), target: 4.5, pass: false },
    )
  }
  for (const row of audit) row.pass = row.ratio >= row.target - 0.005

  return { roles, assignment: a, hueSourceColour: combo.colours[a.hueSource], accentColours, audit }
}

/** How far a palette drifted from the raw combo — the "recognisability" cost. */
export function totalShift(p: Palette): number {
  return Object.values(p.roles).reduce((sum, r) => sum + (r.shifted ?? 0), 0)
}
