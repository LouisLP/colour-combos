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
 *
 * The header carries the site identity — a wordmark in `--ink` and the nav — over
 * T2's 4px accent rule (ADR 0009). The identity band sits just below, inside
 * `main` so it can butt flush under that rule (ADR 0010).
 */
export function HubLayout() {
  return (
    <>
      <ThemeStyle />
      <header className="site-header">
        <div className="site-header-inner">
          {/* Identity, in `--ink`: the serif mark plus a quiet provenance line.
              Links home, carrying the search params like every other link. */}
          <Link to="/" search={carryHubSearch} className="wordmark">
            <span className="wordmark-mark">Colour Combos</span>
            <span className="wordmark-sub">Sanzo Wada · 1933</span>
          </Link>
          <nav className="site-nav" aria-label="Primary">
            <Link to="/" search={carryHubSearch}>Browse</Link>
            <FavoritesLink />
          </nav>
        </div>
      </header>
      <main>
        {/* The active combo, shown large and raw (ADR 0009, refined in ADR 0010).
            Shared chrome, so it lives here above both routes rather than inside a
            page, and reads the combo from the URL like everything else. */}
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
