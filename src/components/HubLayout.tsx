import { Link, Outlet } from '@tanstack/react-router'
import { carryHubSearch } from '../routing/search'
import { ComboHero } from './ComboHero'
import { FavoritesLink } from './FavoritesLink'
import { NotFoundNotice } from './NotFoundNotice'
import { SiteFooter } from './SiteFooter'
import { ThemeStyle } from './ThemeStyle'

/**
 * The one layout both routes share (ADR 0004 §2). Every link carries the search
 * params across, so the selected combo, query and filter survive the move
 * between `/` and `/favorites`.
 *
 * Order top to bottom: the wordmark chrome, the combo identity band, then the
 * page. The band sits above the outlet, not inside a page, because both routes
 * wear the same combo and it survives the move between them (T4).
 */
export function HubLayout() {
  return (
    <>
      <ThemeStyle />
      <header className="site-header">
        <div className="site-header-inner">
          {/* Identity in `--ink`, home link. The serif mark is the one editorial
              voice; the sub is a quiet provenance line. */}
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
      <ComboHero />
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
