import type { Combo, ComboSize } from './combos'
import { COMBO_SIZES } from './combos'

/**
 * The narrowing the `q` and `size` params describe. Both optional, and both
 * absent means "the whole source list" — the params are absent from the URL
 * rather than set to a sentinel (ADR 0004 §4).
 */
export interface ComboFilter {
  q?: string
  size?: ComboSize
}

/**
 * Narrow a source list by the URL's filter params.
 *
 * A plain function over a list rather than a hook or a store: the route supplies
 * the source, so `/` filters the catalogue and `/favorites` filters the
 * favourites list through this same call, with no route-specific branching
 * anywhere (ADR 0003 §3, ADR 0006 consequences).
 *
 * Filtering never touches `c`. The selected combo is orthogonal to what is on
 * screen — a filter that hid the combo theming the page would still leave it
 * theming the page, so removing it from the list is not a state change.
 */
export function filterCombos(source: Combo[], { q, size }: ComboFilter): Combo[] {
  const needle = q?.trim().toLowerCase() ?? ''
  if (needle === '' && size === undefined)
    return source

  return source.filter((combo) => {
    if (size !== undefined && combo.size !== size)
      return false
    return needle === '' || matches(combo, needle)
  })
}

/**
 * What a search actually covers: colour names, hex values, and the combo number
 * (ADR 0006 §7). A Wada combo carries no name of its own — only its colours do
 * (ADR 0006 §3) — so there is no combo name to match against.
 *
 * The three are read off the shape of the needle rather than tried in turn, so
 * a query means exactly one thing:
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
function matches(combo: Combo, needle: string): boolean {
  const number = comboNumber(needle)
  if (number !== undefined)
    return combo.id === number

  if (needle.startsWith('#'))
    return combo.colours.some(colour => colour.hex.toLowerCase().includes(needle))

  return combo.colours.some(colour =>
    colour.name.toLowerCase().includes(needle)
    || colour.hex.toLowerCase().includes(needle),
  )
}

/** `12`, `no 12`, `no. 12` — the caption the user is reading off the card. */
const COMBO_NUMBER = /^(?:no\.?\s*)?(\d+)$/

function comboNumber(needle: string): number | undefined {
  const match = COMBO_NUMBER.exec(needle)
  return match ? Number(match[1]) : undefined
}

/**
 * How many combos of each size a source list holds — the chips' facet counts.
 *
 * A count is what turns a filter into a fact about the catalogue (ADR 0006 §7),
 * so the chips read `3 colours (120)` rather than `3 colours`. Counted against
 * the *unfiltered* source, so the numbers do not collapse to the current
 * selection as you click.
 */
export function countBySize(source: Combo[]): Record<ComboSize, number> {
  const counts = Object.fromEntries(
    COMBO_SIZES.map(size => [size, 0]),
  ) as Record<ComboSize, number>

  for (const combo of source) {
    const size = COMBO_SIZES.find(candidate => candidate === combo.size)
    if (size !== undefined)
      counts[size]++
  }
  return counts
}
