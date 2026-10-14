// What every emitter needs, named once so the formats agree (ADR 0012 §8).

import type { ColourRamp, ColourValue, ComboScale, RoleName } from '../scale'
import { accentName } from '../../theme/roles'

/** The npm name, which generated modules import types from. */
export const PACKAGE_NAME = 'japanese-colour-combos'

/** `English Red · Cerulian Blue`. */
export const scaleLabel = (scale: ComboScale) => scale.ramps.map(r => r.name).join(' · ')

/** The header line of every generated file. */
export function banner(scale: ComboScale): string {
  return `${PACKAGE_NAME} · Wada No. ${scale.id} — ${scaleLabel(scale)}. Canonical mode: ${scale.canonicalMode}.`
}

export interface RoleRamp {
  /** `accent`, `accent-2`, … */
  name: string
  /** The colour ramp it aliases. */
  ramp: ColourRamp
}

/** The role ramps, best accent first, with the colour ramp each aliases. */
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

export { MODES } from '../../theme/adapt'
