import { Link, Outlet } from '@tanstack/react-router'
import { carryHubSearch } from '../routing/search'
import { FavoritesLink } from './FavoritesLink'
import { NotFoundNotice } from './NotFoundNotice'
import { SiteFooter } from './SiteFooter'
import { ThemeStyle } from './ThemeStyle'

/**
 * The one layout both routes share (ADR 0004 §2). Every link carries the search
 * params across, so the selected combo, query and filter survive the move
 * between `/` and `/favorites`.
 */
export function HubLayout() {
  return (
    <>
      <ThemeStyle />
      <header>
        <nav aria-label="Primary">
          <Link to="/" search={carryHubSearch}>Browse</Link>
          <FavoritesLink />
        </nav>
      </header>
      <main>
        {/* Above the outlet, not inside a page: the resolution it explains
            happened in the root route, and it has to survive the move between
            `/` and `/favorites` that a bad link's recipient might make. */}
        <NotFoundNotice />
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}
