import type { ComputedRef } from 'vue'
import type { Density } from '../state/density'
import { density } from '../state/density'

/**
 * The browse density. One line over the module store (ADR 0005 §8); writes go
 * through `setDensity` directly, as favourites' go through `toggle`.
 */
export function useDensity(): ComputedRef<Density> {
  return density
}
