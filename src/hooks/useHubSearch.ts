import type { HubSearch } from '../routing/search'
import { rootRouteId, useSearch } from '@tanstack/react-router'

/**
 * The `c` / `q` / `size` params, read from the root route so every component
 * sees one contract regardless of which route it renders under (ADR 0004 §4).
 *
 * A hook exists only to subscribe to something that lives outside React; it
 * holds no logic and makes no decisions (ADR 0005 §8).
 */
export function useHubSearch(): HubSearch {
  return useSearch({ from: rootRouteId })
}
