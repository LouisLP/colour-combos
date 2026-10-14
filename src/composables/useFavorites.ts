import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { favorites, isFavorite } from '../state/favorites'

/**
 * The favourited ids, newest first. One line over the module store, per the
 * rule that a composable exists only to subscribe to something living outside
 * the component tree (ADR 0005 §8).
 */
export function useFavorites(): ComputedRef<number[]> {
  return favorites
}

/**
 * Whether one combo is favourited.
 *
 * This is what cards use, never `useFavorites()`. A computed only triggers when
 * its value changes, so starring a combo re-renders the one card whose answer
 * flipped rather than the grid of 348 (ADR 0005 §8, ADR 0011).
 */
export function useIsFavorite(id: MaybeRefOrGetter<number>): ComputedRef<boolean> {
  return computed(() => isFavorite(toValue(id)))
}

/**
 * The nav's live count (ADR 0003 §3), a number for the same reason: it changes
 * on every toggle, and nothing else should.
 */
export function useFavoritesCount(): ComputedRef<number> {
  return computed(() => favorites.value.length)
}
