import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { HubLayout } from '../components/HubLayout'
import { BrowsePage } from '../pages/BrowsePage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { resolveComboId, validateHubSearch } from './search'

/**
 * The rejected `c` from a not-found link, carried in typed location state
 * rather than the URL — it survives the `replaceState` but not a reload, which
 * is right: it is a transient explanation of what just happened, not a fact
 * about the app (ADR 0005 §7).
 */
declare module '@tanstack/history' {
  interface HistoryState {
    notFoundCombo?: string
  }
}

/**
 * The root owns the search params, so both routes inherit one contract and
 * nothing is dropped when navigating between them (ADR 0004 §4).
 */
const rootRoute = createRootRoute({
  validateSearch: validateHubSearch,
  component: HubLayout,
  beforeLoad: ({ location }) => {
    const raw = new URLSearchParams(location.searchStr).get('c')
    const { id, rejected } = resolveComboId(raw)

    // The URL already names a valid combo — nothing to pin.
    if (raw !== null && rejected === undefined)
      return

    // Pin the resolved combo so the visit is reproducible and shareable from
    // the first frame. `replace`, so resolution never leaves a history entry
    // (ADR 0004 §5, §8). Idempotent: the redirected URL takes the branch above.
    throw redirect({
      replace: true,
      search: (prev: Record<string, unknown>) => ({ ...prev, c: id }),
      state: rejected === undefined
        ? undefined
        : prev => ({ ...prev, notFoundCombo: rejected }),
    })
  },
})

const browseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: BrowsePage,
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favorites',
  component: FavoritesPage,
})

const routeTree = rootRoute.addChildren([browseRoute, favoritesRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
