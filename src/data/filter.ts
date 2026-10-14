import type { Mode } from '../theme/adapt'
import type { Combo, ComboSize } from './combos'
import type { HueFamily } from './hue'
import { comboMode, MODES } from '../theme/adapt'
import { COMBO_SIZES } from './combos'
import { comboHasHue, HUE_FAMILIES } from './hue'

/**
 * The narrowing the `q`, `size`, `hue` and `mode` params describe. All
 * optional, and all absent means "the whole source list" — the params are
 * absent from the URL rather than set to a sentinel (ADR 0004 §4).
 */
export interface ComboFilter {
  q?: string
  size?: ComboSize
  hue?: HueFamily
  mode?: Mode
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
export function filterCombos(source: Combo[], { q, size, hue, mode }: ComboFilter): Combo[] {
  const needle = parseNeedle(q)
  if (needle === undefined && size === undefined && hue === undefined && mode === undefined)
    return source

  return source.filter((combo) => {
    if (size !== undefined && combo.size !== size)
      return false
    if (hue !== undefined && !comboHasHue(combo, hue))
      return false
    if (mode !== undefined && modeOf(combo) !== mode)
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
 *
 * Exported because the highlighter has to agree with the matcher: a needle that
 * found a combo by its hex must not then light up a colour name.
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

/** One piece of a highlighted string: matched, or the text between matches. */
export interface Segment {
  text: string
  match: boolean
}

/**
 * Split a colour's name or hex into the runs a search matched, so the results
 * can show *why* each one is there (ADR 0014 §2).
 *
 * It answers from the same `Needle` the filter used, so it never highlights
 * something that did not count: a hex needle lights hexes only, a number lights
 * nothing (the number is the whole caption), and a word lights both names and
 * unprefixed hexes, exactly as `matches` reads it. Case-insensitive, every
 * occurrence, and the original casing is kept.
 */
export function highlight(text: string, field: 'name' | 'hex', q: string | undefined): Segment[] {
  const needle = parseNeedle(q)
  const lit = needle !== undefined
    && needle.kind !== 'number'
    && (field === 'hex' || needle.kind === 'text')
  if (!lit)
    return [{ text, match: false }]

  const haystack = text.toLowerCase()
  const segments: Segment[] = []
  let from = 0
  for (let at = haystack.indexOf(needle.text); at !== -1; at = haystack.indexOf(needle.text, at + needle.text.length)) {
    if (at > from)
      segments.push({ text: text.slice(from, at), match: false })
    segments.push({ text: text.slice(at, at + needle.text.length), match: true })
    from = at + needle.text.length
  }
  if (from < text.length)
    segments.push({ text: text.slice(from), match: false })
  return segments
}

/**
 * The adapter's mode, memoised per combo: a filter pass asks all 348, and each
 * answer is a handful of OKLab conversions that never change (ADR 0008).
 */
const modeById = new Map<number, Mode>()
function modeOf(combo: Combo): Mode {
  let mode = modeById.get(combo.id)
  if (mode === undefined) {
    mode = comboMode(combo)
    modeById.set(combo.id, mode)
  }
  return mode
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

/**
 * How many combos in a source list carry each hue family — the hue chips'
 * facet counts. A combo with a red and a blue counts once under each, so the
 * family counts deliberately do not sum to `Any`.
 */
export function countByHue(source: Combo[]): Record<HueFamily, number> {
  return Object.fromEntries(
    HUE_FAMILIES.map(family => [family, source.filter(combo => comboHasHue(combo, family)).length]),
  ) as Record<HueFamily, number>
}

/** How many combos render in each mode — the mode chips' facet counts. */
export function countByMode(source: Combo[]): Record<Mode, number> {
  return Object.fromEntries(
    MODES.map(mode => [mode, source.filter(combo => modeOf(combo) === mode).length]),
  ) as Record<Mode, number>
}
