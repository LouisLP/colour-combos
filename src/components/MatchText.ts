import type { FunctionalComponent, VNodeArrayChildren } from 'vue'
import type { Combo } from '../data/combos'
import { h } from 'vue'
import { highlight } from '../data/filter'

/**
 * Search highlighting (ADR 0014 §2): the runs the current search matched,
 * wrapped in `<mark class="match">`. Both components ask `highlight`, which
 * reads the needle exactly as the filter did, so neither lights something that
 * did not count.
 *
 * Render functions rather than SFCs so unmatched runs stay bare text nodes: a
 * template would either wrap each in a `<span>` or let whitespace condensing
 * slip spaces in between the runs. The one style lives in `index.css` for the
 * same reason `.sr-only` does — there is no scope to hang it on.
 */
function marked(text: string, field: 'name' | 'hex', q: string | undefined): VNodeArrayChildren {
  return highlight(text, field, q).map(segment =>
    segment.match ? h('mark', { class: 'match' }, segment.text) : segment.text,
  )
}

/**
 * One colour's hex, highlighted, drawn without its `#` where space is tight (the
 * compact row). Matching runs over the full hex either way, so `#d96` still
 * lights the `d96` it found; only the leading `#` is dropped afterwards.
 */
export const MatchHex: FunctionalComponent<{ hex: string, q: string | undefined }> = ({ hex, q }) => {
  const [first, ...rest] = highlight(hex, 'hex', q)
  const tail = first!.text.slice(1)
  const segments = tail === '' ? rest : [{ ...first!, text: tail }, ...rest]
  return segments.map(segment =>
    segment.match ? h('mark', { class: 'match' }, segment.text) : segment.text,
  )
}
MatchHex.props = ['hex', 'q']

/**
 * A combo's colour names joined with ` · ` — the same string `comboLabel`
 * gives, highlighted.
 */
export const MatchNames: FunctionalComponent<{ combo: Combo, q: string | undefined }> = ({ combo, q }) =>
  combo.colours.flatMap((colour, i) => [
    ...(i > 0 ? [' · '] : []),
    ...marked(colour.name, 'name', q),
  ])
MatchNames.props = ['combo', 'q']
