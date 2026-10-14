import type { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { createRouter } from 'vue-router'
import HubLayout from '../components/HubLayout.vue'
import BrowsePage from '../pages/BrowsePage.vue'
import FavoritesPage from '../pages/FavoritesPage.vue'
import { firstValue, resolveComboId } from './search'

/**
 * The rejected `c` from a not-found link rides in history state rather than the
 * URL — it survives the `replaceState` but not a reload, which is right: it is a
 * transient explanation of what just happened, not a fact about the app
 * (ADR 0005 §7).
 */
export const NOT_FOUND_STATE_KEY = 'notFoundCombo'

/**
 * The layout owns both pages as children, so the search params are one contract
 * read off whichever route is current and nothing is dropped when navigating
 * between them (ADR 0004 §4).
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: HubLayout,
    children: [
      { path: '', component: BrowsePage },
      { path: 'favorites', component: FavoritesPage },
    ],
  },
]

/**
 * A factory so a test can mount the real routes and guard on a memory history,
 * while `main.ts` hands it the browser's.
 * The history semantics in ADR 0004 §5 are a property of the routes and the
 * components together, so a test that rebuilt an approximation of this would be
 * proving them about code that is not the code.
 */
export function createHubRouter(history: RouterHistory): Router {
  const router = createRouter({
    history,
    routes,
    // Every navigation lands at the top, as TanStack's default `resetScroll`
    // did — selecting a combo scrolls the re-themed identity band into view
    // (ADR 0011).
    scrollBehavior: () => ({ top: 0 }),
  })

  router.beforeEach((to) => {
    const raw = firstValue(to.query.c)
    const { id, rejected } = resolveComboId(raw)

    // The URL already names a valid combo in its canonical spelling — nothing
    // to pin.
    if (raw === String(id))
      return

    // Pin the resolved combo so the visit is reproducible and shareable from
    // the first frame. `replace`, so resolution never leaves a history entry
    // (ADR 0004 §5, §8). Idempotent: the redirected URL takes the branch above.
    return {
      path: to.path,
      query: { ...to.query, c: String(id) },
      hash: to.hash,
      replace: true,
      state: rejected === undefined ? undefined : { [NOT_FOUND_STATE_KEY]: rejected },
    }
  })

  return router
}
