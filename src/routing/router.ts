import type { Router, RouterHistory } from 'vue-router'
import { createRouter } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import { firstValue, resolveComboId, toHubQuery, validateHubSearch } from './search'

/**
 * One page (ADR 0015). The dialog is a query param, not a route, so opening it
 * never re-renders the grid behind it.
 *
 * The old paths still land somewhere sensible: `/combo/42` and `?combo=42` open
 * No. 42's dialog, `/favorites` is the home page, since favourites are gone.
 */
export function createHubRouter(history: RouterHistory): Router {
  const router = createRouter({
    history,
    routes: [
      { path: '/', component: HomePage },
      {
        path: '/combo/:id',
        redirect: to => ({ path: '/', query: { ...to.query, c: firstValue(to.params.id) as string } }),
      },
      { path: '/:rest(.*)*', redirect: to => ({ path: '/', query: to.query }) },
    ],
  })

  // Rewrite `?combo=` and drop an invalid `c`, so the URL always says exactly
  // what is on screen. `replace`, so none of it leaves a history entry.
  router.beforeEach((to) => {
    const { combo, c } = to.query
    const raw = firstValue(combo ?? c)
    if (combo === undefined && (c === undefined || String(resolveComboId(raw)) === raw))
      return
    const search = validateHubSearch({ ...to.query, c: raw })
    return { path: to.path, query: toHubQuery(search), hash: to.hash, replace: true }
  })

  return router
}
