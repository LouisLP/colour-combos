import type { Combo, ComboSize } from '../data/combos'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { COMBO_SIZES } from '../data/combos'
import { countBySize } from '../data/filter'
import { useHubSearch } from '../hooks/useHubSearch'

/**
 * How long the field waits before writing `q` to the URL. The figure is ADR
 * 0006 §7's, where it was verified in a browser rather than asserted: long
 * enough that a typed word is one write, short enough that the count never
 * feels stale.
 */
const SEARCH_DEBOUNCE_MS = 250

interface FilterBarProps {
  /** The route's unfiltered list. Facet counts are read off it. */
  source: Combo[]
  /** How many survive the current filter — the live count. */
  shown: number
}

/**
 * The sticky bar under the header: search field, size chips with their facet
 * counts, and a live count (ADR 0006 §7).
 *
 * The two controls take deliberately different history stances (ADR 0004 §5),
 * and that asymmetry is the whole point of this component:
 *
 * - **Typing `replace`s, debounced.** Back after a search returns to the
 *   pre-search grid in one step rather than unwinding letter by letter.
 * - **A chip `push`es.** Toggling a filter is a discrete, deliberate act, so
 *   back undoes exactly that toggle.
 *
 * It is route-agnostic: the params live on the root route, so the same bar
 * serves `/` and `/favorites` with the source list as the only difference.
 */
export function FilterBar({ source, shown }: FilterBarProps) {
  const { q, size } = useHubSearch()
  const counts = countBySize(source)

  return (
    <div className="filter-bar">
      <SearchField q={q} />

      <div className="filter-chips" role="group" aria-label="Filter by size">
        <Chip engaged={size === undefined} size={undefined}>
          {`Any (${source.length})`}
        </Chip>
        {COMBO_SIZES.map(candidate => (
          <Chip key={candidate} engaged={size === candidate} size={candidate}>
            {`${candidate} colours (${counts[candidate]})`}
          </Chip>
        ))}
      </div>

      {/* `<output>` is a live region by default, so the count is announced as
          the list narrows without the field losing focus. */}
      <output className="filter-count">{`${shown} shown`}</output>
    </div>
  )
}

/**
 * A size chip. Clicking the engaged chip clears the filter, so a chip is a
 * toggle rather than a one-way trip into a filtered state — and `aria-pressed`
 * is what says so.
 *
 * A button rather than the `<Link>` the combo card uses, despite `size` living
 * in the URL exactly as `c` does. A link would carry TanStack's own
 * `aria-current="page"`, which it applies to every chip whose target is a
 * subset of the current URL — so `Any` and the engaged chip would both claim to
 * be the current page — and "open in a new tab" is not a meaningful thing to
 * want from a toggle. The push a link gives for free is one argument instead.
 */
function Chip({ size, engaged, children }: {
  size: ComboSize | undefined
  engaged: boolean
  children: string
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className="filter-chip"
      // Styled off this rather than a class: the engaged look and the announced
      // state cannot drift apart if there is only one of them.
      aria-pressed={engaged}
      onClick={() => {
        // `push` — toggling a filter is a discrete, deliberate act, so Back
        // undoes exactly this toggle (ADR 0004 §5). `c` is untouched.
        void navigate({
          to: '.',
          search: prev => ({ ...prev, size: engaged ? undefined : size }),
        })
      }}
    >
      {children}
    </button>
  )
}

/**
 * The search field, with a local echo so it never lags a keystroke.
 *
 * The URL cannot be the field's value directly: a debounced write leaves it up
 * to 250 ms behind what has been typed, so binding to it would drop characters.
 * The draft is local, and the URL is written *from* it.
 *
 * That leaves one genuinely two-way seam — the URL moving under the field —
 * and it needs `writtenRef` to resolve. The field must ignore the URL catching up
 * to its own write (which is not news, and is stale by whatever was typed in
 * the meantime) while obeying a Back, a Forward, or a Clear filters (which is
 * the URL genuinely disagreeing). Without recording what it wrote, those two
 * are the same event and one of them has to be got wrong.
 */
function SearchField({ q }: { q: string | undefined }) {
  const urlQ = q ?? ''
  const navigate = useNavigate()
  const [draft, setDraft] = useState(urlQ)
  const [seen, setSeen] = useState(urlQ)
  const writtenRef = useRef(urlQ)

  if (seen !== urlQ) {
    setSeen(urlQ)
    if (urlQ !== writtenRef.current)
      setDraft(urlQ)
  }

  // Whitespace is not a search, so it resolves to the same URL as an empty
  // field — and comparing the *target* rather than the draft is what stops a
  // field holding only spaces from rescheduling a write it can never satisfy.
  const target = draft.trim() === '' ? '' : draft

  useEffect(() => {
    if (target === urlQ)
      return

    const timer = setTimeout(() => {
      // `replace`, so a typed word leaves one history entry rather than one per
      // keystroke (ADR 0004 §5). Absent rather than empty, to keep the URL
      // clean; `c` and the route are untouched — filtering never changes which
      // combo is selected.
      writtenRef.current = target
      void navigate({
        to: '.',
        replace: true,
        search: prev => ({ ...prev, q: target === '' ? undefined : target }),
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [target, urlQ, navigate])

  return (
    <>
      <label className="sr-only" htmlFor="combo-search">Search combinations</label>
      <input
        id="combo-search"
        type="search"
        className="filter-field"
        value={draft}
        autoComplete="off"
        placeholder="Search by colour name, hex or number…"
        onChange={event => setDraft(event.target.value)}
      />
    </>
  )
}
