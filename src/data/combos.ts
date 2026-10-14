import raw from './combos.json'

/** A single entry within a combo, carrying its values from the source data. */
export interface ComboColour {
  /** Wada's own colour index, stable across combos. */
  index: number
  name: string
  hex: string
  rgb: number[]
  lab: number[]
}

/** One of the 348 classic Wada combinations: an ordered set of 2–4 colours. */
export interface Combo {
  id: number
  size: number
  colours: ComboColour[]
}

export const COMBOS: Combo[] = raw

/** The classic catalogue: ids are contiguous `1–348` (#2). */
export const COMBO_COUNT = COMBOS.length

/** The combo sizes in the catalogue: 120 pairs, 120 triples, 108 quads. */
export const COMBO_SIZES = [2, 3, 4] as const
export type ComboSize = typeof COMBO_SIZES[number]

export const getCombo = (id: number) => COMBOS.find(c => c.id === id)

/** Look up an already-validated id. A miss is a bug, so it throws. */
export function requireCombo(id: number): Combo {
  const combo = getCombo(id)
  if (!combo)
    throw new Error(`Combo ${id} passed validation but is not in the catalogue`)
  return combo
}

/** A combo's colour names, joined. Combos have no names of their own (ADR 0006 §3). */
export function comboLabel(combo: Combo): string {
  return combo.colours.map(colour => colour.name).join(' · ')
}

/** A combo's hexes, space-separated so they paste into one field. */
export function comboHexes(combo: Combo): string {
  return combo.colours.map(colour => colour.hex).join(' ')
}
