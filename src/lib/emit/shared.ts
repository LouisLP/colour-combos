// What every emitter needs from a scale, named once so the formats cannot
// disagree about a variable's name or a block's order (ADR 0012 §8).

import type { Mode } from '../../theme/adapt'
import type { ColourRamp, ColourValue, ComboScale, RoleName } from '../scale'

/** The name the library is published under, and the specifier generated modules import types from. */
export const PACKAGE_NAME = 'colour-combos'

/** `English Red · Cerulian Blue` — the combo's colour names, as the site labels it. */
export const scaleLabel = (scale: ComboScale) => scale.ramps.map(r => r.name).join(' · ')

/** One line naming the combo, for the head of every generated file. */
export function banner(scale: ComboScale): string {
  return `${PACKAGE_NAME} · Wada No. ${scale.id} — ${scaleLabel(scale)}. Canonical mode: ${scale.canonicalMode}.`
}

/** `accent`, `accent-2`, … — the role ramp for an accent rank (0-based). */
export const accentName = (rank: number) => rank === 0 ? 'accent' : `accent-${rank + 1}`

export interface RoleRamp {
  /** `accent`, `accent-2`, … */
  name: string
  /** The colour ramp it aliases. */
  ramp: ColourRamp
}

/** The role-named ramps, most accent-worthy first, each pointing at the colour ramp it aliases. */
export function roleRamps(scale: ComboScale): RoleRamp[] {
  return scale.accents.map((index, rank) => ({ name: accentName(rank), ramp: scale.ramps[index] }))
}

export interface SemanticPair {
  role: RoleName
  light: ColourValue
  dark: ColourValue
}

/** Every semantic role with its value in both modes, in the adapter's order. */
export function semanticPairs(scale: ComboScale): SemanticPair[] {
  return (Object.keys(scale.semantic.light) as RoleName[]).map(role => ({
    role,
    light: scale.semantic.light[role]!,
    dark: scale.semantic.dark[role]!,
  }))
}

export const MODES: readonly Mode[] = ['light', 'dark']
