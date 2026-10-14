import type { ComputedRef } from 'vue'
import type { HubSearch } from '../routing/search'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { validateHubSearch } from '../routing/search'

/** The `q` / `hue` / `c` params, validated off the current route. The URL is the only state. */
export function useHubSearch(): ComputedRef<HubSearch> {
  const route = useRoute()
  return computed(() => validateHubSearch(route.query))
}
