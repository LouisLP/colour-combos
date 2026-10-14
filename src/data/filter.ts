import type { Combo } from './combos'
import type { HueFamily } from './hue'
import { comboHasHue } from './hue'

/**
 * The narrowing the `q` and `hue` params describe. Both optional, and both
 * absent means "the whole catalogue" (ADR 0015).
 */
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
 * What a search needle means, read off its shape so a query means exactly one
 * thing (ADR 0006 §7):
 *
 * | Needle | Reads as |
 * | --- | --- |
 * | `12`, `no. 12`, `no12` | the combo number, and only that |
 * | `#d96`, `#d96629` | a hex value, and only that |
 * | anything else | a colour name or an unprefixed hex |
 *
 * Without that split, `12` matches every combo with `12` anywhere in a hex —
 * dozens of them — and the card you were looking for by its `No. 12` caption is
 * buried in the noise.
 */
export type Needle
  = | { kind: 'number', id: number }
    | { kind: 'hex', text: string }
    | { kind: 'text', text: string }

/** `12`, `no 12`, `no. 12` — the caption the user is reading off the card. */
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

/**
 * What a search actually covers: colour names, hex values, and the combo number
 * (ADR 0006 §7). A Wada combo carries no name of its own — only its colours do
 * (ADR 0006 §3) — so there is no combo name to match against.
 */
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
