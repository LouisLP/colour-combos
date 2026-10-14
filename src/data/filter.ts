import type { Combo } from './combos'
import type { HueFamily } from './hue'
import { comboHasHue } from './hue'

/** The `q` and `hue` params. Neither means the whole catalogue. */
export interface ComboFilter {
  q?: string
  hue?: HueFamily
}

/** Narrow a list by the URL's filter params, keeping catalogue order. */
export function filterCombos(source: Combo[], { q, hue }: ComboFilter): Combo[] {
  const needle = parseNeedle(q)
  if (needle === undefined && hue === undefined)
    return source

  return source.filter((combo) => {
    if (hue !== undefined && !comboHasHue(combo, hue))
      return false
    return needle === undefined || matches(combo, needle)
  })
}

/**
 * What a needle means, by its shape (ADR 0006 §7): `12` or `no. 12` is a combo
 * number, `#d96` a hex, anything else a name or bare hex. Otherwise `12` matches
 * dozens of hexes.
 */
export type Needle
  = | { kind: 'number', id: number }
    | { kind: 'hex', text: string }
    | { kind: 'text', text: string }

/** `12`, `no 12`, `no. 12`: the card's caption. */
const COMBO_NUMBER = /^(?:no\.?\s*)?(\d+)$/

export function parseNeedle(q: string | undefined): Needle | undefined {
  const text = q?.trim().toLowerCase() ?? ''
  if (text === '')
    return undefined

  const number = COMBO_NUMBER.exec(text)
  if (number)
    return { kind: 'number', id: Number(number[1]) }

  return text.startsWith('#') ? { kind: 'hex', text } : { kind: 'text', text }
}

/** Search covers colour names, hexes and the combo number (ADR 0006 §7). */
function matches(combo: Combo, needle: Needle): boolean {
  switch (needle.kind) {
    case 'number':
      return combo.id === needle.id
    case 'hex':
      return combo.colours.some(colour => colour.hex.toLowerCase().includes(needle.text))
    case 'text':
      return combo.colours.some(colour =>
        colour.name.toLowerCase().includes(needle.text)
        || colour.hex.toLowerCase().includes(needle.text),
      )
  }
}
