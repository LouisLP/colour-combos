import { Link } from '@tanstack/react-router'
import { useFavoritesCount } from '../hooks/useFavorites'
import { carryHubSearch } from '../routing/search'

/**
 * The persistent entry point, with a live count (ADR 0003 §3). The count
 * doubles as feedback that a star toggle registered, and reads plain at zero
 * rather than as `(0)`.
 *
 * Its own component, not inlined into `HubLayout`: subscribing here keeps a
 * star toggle re-rendering a link and one card, and never the layout that owns
 * the grid.
 */
export function FavoritesLink() {
  const count = useFavoritesCount()

  return (
    <Link to="/favorites" search={carryHubSearch}>
      {count === 0 ? 'Favourites' : `★ Favourites (${count})`}
    </Link>
  )
}
