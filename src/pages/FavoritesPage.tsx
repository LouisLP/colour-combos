import { Link } from '@tanstack/react-router'
import { ClearFilters } from '../components/ClearFilters'
import { ComboGrid } from '../components/ComboGrid'
import { FilterBar } from '../components/FilterBar'
import { COMBO_COUNT, requireCombo } from '../data/combos'
import { filterCombos } from '../data/filter'
import { useFavorites } from '../hooks/useFavorites'
import { useHubSearch } from '../hooks/useHubSearch'
import { carryHubSearch } from '../routing/search'

/**
 * The starred combos, in insertion order — newest first (ADR 0003 §3).
 *
 * The route's only job is to supply a different source list: the same `<Grid>`
 * as browse, the same `c`/`q`/`size` contract, no duplicated UI. Ordering is
 * the one thing it differs from browse on, and that is deliberate.
 *
 * `q` and `size` narrow this list through the same `filterCombos` call browse
 * makes, over params the root route already carried across the navigation. A
 * `/favorites?q=blue` link therefore behaves exactly as `/?q=blue` does, with
 * no route-specific handling on either side.
 */
export function FavoritesPage() {
  const ids = useFavorites()
  const { q, size } = useHubSearch()

  // Safe by construction: the store drops ids the catalogue does not contain.
  const combos = ids.map(requireCombo)
  const shown = filterCombos(combos, { q, size })

  return (
    <section>
      {/* The visible page identity is the site header; this is for structure. */}
      <h1 className="sr-only">Favourite combinations</h1>

      {/* An empty list has nothing to narrow, and a filter bar over it would be
          chrome offering to do nothing. Counts run over the favourites, not the
          catalogue, so the chips stay facts about what is actually here. */}
      {combos.length > 0 && <FilterBar source={combos} shown={shown.length} />}

      <ComboGrid
        combos={shown}
        // Two ways to be empty, and they need different exits: no favourites at
        // all is a prompt to go and star some, while a filter that excludes all
        // of them is a prompt to widen the filter. Telling someone with 40
        // favourites that they have none would read as the feature being broken.
        empty={combos.length === 0
          ? (
              <>
                <p className="combo-empty-heading">★ No favourites yet</p>
                <p>Star any combination to save it here.</p>
                <Link to="/" search={carryHubSearch}>
                  {`Browse all ${COMBO_COUNT} →`}
                </Link>
              </>
            )
          : (
              <>
                <p className="combo-empty-heading">No favourites match that.</p>
                <p>Search covers colour names, hex values and the combination number.</p>
                <ClearFilters />
              </>
            )}
      />
    </section>
  )
}
