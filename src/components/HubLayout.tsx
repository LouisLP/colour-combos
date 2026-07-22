import { Link, Outlet } from '@tanstack/react-router'
import { carryHubSearch } from '../routing/search'
import { ModeToggle } from './ModeToggle'
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
          <Link to="/favorites" search={carryHubSearch}>Favourites</Link>
        </nav>
        <ModeToggle />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
