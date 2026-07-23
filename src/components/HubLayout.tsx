import { Link, Outlet } from '@tanstack/react-router'
import { carryHubSearch } from '../routing/search'
import { ComboIdentity } from './ComboIdentity'
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
        {/* The active combo, shown large and raw (ADR 0009). Shared chrome, so
            it lives here above both routes rather than inside a page, and reads
            the combo from the URL like everything else. */}
        <ComboIdentity />
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
