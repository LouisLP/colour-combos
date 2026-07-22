import { useSelectedCombo } from '../hooks/useSelectedCombo'

/**
 * Placeholder. The favourites store and this list land in #23, and inherit the
 * filter surface unchanged: `q` and `size` are already carried across this
 * navigation by the root route, so the page renders `<FilterBar>` over its own
 * source list and `filterCombos` over the same params (ADR 0003 §3).
 */
export function FavoritesPage() {
  const combo = useSelectedCombo()

  return (
    <section>
      <h1>Favourites</h1>
      <p>
        Selected: No.
        {' '}
        {combo.id}
      </p>
    </section>
  )
}
