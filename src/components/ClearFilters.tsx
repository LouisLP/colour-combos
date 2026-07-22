import { useNavigate } from '@tanstack/react-router'

/**
 * The way out of an empty result. An empty grid is a live surface, not a dead
 * end (ADR 0006 §7), and this is the part that makes it one.
 *
 * Clears `q` and `size` together and leaves `c` alone — the page keeps the
 * combo it is wearing, because filtering never selected it in the first place.
 *
 * A button rather than a link for the same reason the chips are: its target is
 * a subset of the current URL, so a `<Link>` would advertise itself as
 * `aria-current="page"` while offering to change the page.
 */
export function ClearFilters() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className="filter-clear"
      onClick={() => {
        void navigate({ to: '.', search: prev => ({ ...prev, q: undefined, size: undefined }) })
      }}
    >
      Clear filters
    </button>
  )
}
