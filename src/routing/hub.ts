import type { ComputedRef } from 'vue'
import type { Router } from 'vue-router'
import type { Combo } from '../data/combos'
import type { HueFamily } from '../data/hue'
import type { HubSearch } from './search'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { COMBO_COUNT, getCombo } from '../data/combos'
import { toHubQuery, validateHubSearch } from './search'

/**
 * Everything the site reads from or writes to the URL, and the history policy
 * of ADR 0015 §3: opening pushes, everything else replaces, and closing a
 * dialog we pushed goes Back.
 */
export interface Hub {
  search: ComputedRef<HubSearch>
  /** The open combo, if any. */
  combo: ComputedRef<Combo | undefined>
  setQuery: (q: string) => void
  toggleHue: (hue: HueFamily) => void
  open: (id: number) => void
  close: () => void
  /** Step through the catalogue, wrapping. */
  step: (delta: 1 | -1) => void
  /** An absolute link that opens a combo. */
  link: (id: number) => string
}

const hubs = new WeakMap<Router, Hub>()

/** The hub for a router. One per router, so tests get a fresh one each mount. */
export function hubFor(router: Router): Hub {
  const existing = hubs.get(router)
  if (existing)
    return existing

  const search = computed(() => validateHubSearch(router.currentRoute.value.query))
  const combo = computed(() => search.value.c === undefined ? undefined : getCombo(search.value.c))
  const replace = (next: HubSearch) => void router.replace({ query: toHubQuery(next) })

  // Whether we pushed the open dialog. A shared link has no entry of ours.
  let pushed = false
  router.afterEach((to) => {
    if (validateHubSearch(to.query).c === undefined)
      pushed = false
  })

  const hub: Hub = {
    search,
    combo,
    setQuery(q) {
      const next = q === '' ? undefined : q
      if (next !== search.value.q)
        replace({ ...search.value, q: next })
    },
    toggleHue(hue) {
      replace({ ...search.value, hue: search.value.hue === hue ? undefined : hue })
    },
    open(id) {
      pushed = true
      void router.push({ query: toHubQuery({ ...search.value, c: id }) })
    },
    close() {
      if (search.value.c === undefined)
        return
      if (pushed) {
        pushed = false
        router.back()
      }
      else {
        replace({ ...search.value, c: undefined })
      }
    },
    step(delta) {
      const c = search.value.c
      if (c !== undefined)
        replace({ ...search.value, c: ((c - 1 + delta + COMBO_COUNT) % COMBO_COUNT) + 1 })
    },
    link(id) {
      return new URL(router.resolve({ path: '/', query: toHubQuery({ c: id }) }).href, location.origin).href
    },
  }
  hubs.set(router, hub)
  return hub
}

export const useHub = (): Hub => hubFor(useRouter())
