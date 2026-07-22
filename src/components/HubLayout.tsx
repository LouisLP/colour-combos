import { Link, Outlet } from '@tanstack/react-router'
import { carryHubSearch } from '../routing/search'

/**
 * The one layout both routes share (ADR 0004 §2). Every link carries the search
 * params across, so the selected combo, query and filter survive the move
 * between `/` and `/favorites`.
 */
export function HubLayout() {
  return (
    <>
      <header>
        <nav aria-label="Primary">
          <Link to="/" search={carryHubSearch}>Browse</Link>
          <Link to="/favorites" search={carryHubSearch}>Favourites</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
