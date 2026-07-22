import { Link } from '@tanstack/react-router'
import { ComboGrid } from '../components/ComboGrid'
import { COMBO_COUNT, requireCombo } from '../data/combos'
import { useFavorites } from '../hooks/useFavorites'
import { carryHubSearch } from '../routing/search'

/**
 * The starred combos, in insertion order — newest first (ADR 0003 §3).
 *
 * The route's only job is to supply a different source list: the same `<Grid>`
 * as browse, the same `c`/`q`/`size` contract, no duplicated UI. Ordering is
 * the one thing it differs from browse on, and that is deliberate.
 */
export function FavoritesPage() {
  const ids = useFavorites()

  // Safe by construction: the store drops ids the catalogue does not contain.
  const combos = ids.map(requireCombo)

  return (
    <section>
      {/* The visible page identity is the site header; this is for structure. */}
      <h1 className="sr-only">Favourite combinations</h1>
      <ComboGrid
        combos={combos}
        // Not a dead end (ADR 0003 §3): the empty state says how to fill it and
        // links back to the catalogue, carrying the params across.
        empty={(
          <>
            <p className="combo-empty-heading">★ No favourites yet</p>
            <p>Star any combination to save it here.</p>
            <Link to="/" search={carryHubSearch}>
              {`Browse all ${COMBO_COUNT} →`}
            </Link>
          </>
        )}
      />
    </section>
  )
}
