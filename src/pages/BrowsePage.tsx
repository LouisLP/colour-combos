import { ClearFilters } from '../components/ClearFilters'
import { ComboGrid } from '../components/ComboGrid'
import { FilterBar } from '../components/FilterBar'
import { COMBO_COUNT, COMBOS } from '../data/combos'
import { filterCombos } from '../data/filter'
import { useHubSearch } from '../hooks/useHubSearch'

/**
 * The whole catalogue, narrowed by the URL's `q` and `size`.
 *
 * The route supplies the source list and the grid renders whatever it is given
 * (ADR 0006 consequences), so `/favorites` narrows its own list through this
 * same call. The params are route-agnostic and nothing here branches on the
 * route — the two pages differ only in the list they hand over.
 */
export function BrowsePage() {
  const { q, size } = useHubSearch()
  const shown = filterCombos(COMBOS, { q, size })

  return (
    <section>
      {/* The visible page identity is the site header; this is for structure. */}
      <h1 className="sr-only">{`Browse all ${COMBO_COUNT} combinations`}</h1>
      <FilterBar source={COMBOS} shown={shown.length} />
      <ComboGrid
        combos={shown}
        empty={(
          <>
            <p className="combo-empty-heading">No combinations match that.</p>
            <p>Search covers colour names, hex values and the combination number.</p>
            <ClearFilters />
          </>
        )}
      />
    </section>
  )
}
