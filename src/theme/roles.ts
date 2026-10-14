// The semantic roles and their contrast contract (ADR 0002 §5): the names the
// adapter fills, the emitters export and the audit checks.

/** Roles every combo has, whatever its colours. */
export const BASE_ROLES = ['canvas', 'surface', 'surface-muted', 'ink', 'ink-muted', 'border', 'border-strong'] as const
export type BaseRoleName = typeof BASE_ROLES[number]

/** Accents a scale names roles for, best first. */
export const MAX_ACCENTS = 3

/** `accent`, `accent-2`, …: semantic roles go to `accent-3`, role ramps to `accent-4`. */
export type AccentName = 'accent' | `accent-${number}`
export type AccentRoleNames<A extends AccentName> = A | `${A}-text` | `on-${A}`

/** The accent name for a 0-based rank. */
export const accentName = (rank: number): AccentName => rank === 0 ? 'accent' : `accent-${rank + 1}`

/** The three roles one accent fills: the fill, its text use, and text on the fill. */
export function accentRoles<A extends AccentName>(name: A) {
  return { fill: name, text: `${name}-text` as const, on: `on-${name}` as const }
}

export interface ContrastPair {
  fg: string
  bg: string
  target: number
}

const pair = (fg: string, bg: string, target: number): ContrastPair => ({ fg, bg, target })

/**
 * Every pairing the contract promises for a palette with `accents` accents.
 * `--border` is decorative, so it's absent.
 */
export function contrastPairs(accents: number): ContrastPair[] {
  const pairs = [
    pair('ink', 'canvas', 4.5),
    pair('ink', 'surface', 4.5),
    pair('ink', 'surface-muted', 4.5),
    pair('ink-muted', 'canvas', 4.5),
    pair('ink-muted', 'surface-muted', 4.5),
    pair('border-strong', 'canvas', 3),
  ]
  for (let rank = 0; rank < Math.min(accents, MAX_ACCENTS); rank++) {
    const { fill, text, on } = accentRoles(accentName(rank))
    pairs.push(
      pair(fill, 'canvas', 3),
      // The key one (ADR 0002 §4): accents can land on muted cards. Clamping
      // on the canvas alone failed 454/696 renderings here.
      pair(fill, 'surface-muted', 3),
      pair(text, 'canvas', 4.5),
      pair(text, 'surface-muted', 4.5),
      pair(on, fill, 4.5),
    )
  }
  return pairs
}
