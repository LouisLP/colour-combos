import type { ComputedRef } from 'vue'
import type { HubSearch } from '../routing/search'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { validateHubSearch } from '../routing/search'

/**
 * The `c` / `q` / `size` params, validated off the current route's query, so
 * every component sees one contract regardless of which route it renders under
 * (ADR 0004 §4).
 *
 * A composable exists only to subscribe to something that lives outside the
 * component tree; it holds no logic and makes no decisions (ADR 0005 §8).
 */
export function useHubSearch(): ComputedRef<HubSearch> {
  const route = useRoute()
  return computed(() => validateHubSearch(route.query))
}
