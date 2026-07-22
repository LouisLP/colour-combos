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

export const getCombo = (id: number) => COMBOS.find(c => c.id === id)
