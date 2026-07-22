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

export const getCombo = (id: number) => COMBOS.find(c => c.id === id)

/**
 * Look up a combo whose id has already been validated against the catalogue.
 * Throws rather than returning a fallback: a miss here means the search-param
 * validator and the data disagree, which is a bug, not a user-facing state.
 */
export function requireCombo(id: number): Combo {
  const combo = getCombo(id)
  if (!combo)
    throw new Error(`Combo ${id} passed validation but is not in the catalogue`)
  return combo
}

/**
 * A combo's colour names, joined — the closest thing it has to a name.
 *
 * A Wada combo carries no name of its own; only its colours do (ADR 0006 §3).
 * So every surface that labels a combo pairs `No. N` with this, and the two are
 * always the same string.
 */
export function comboLabel(combo: Combo): string {
  return combo.colours.map(colour => colour.name).join(' · ')
}
