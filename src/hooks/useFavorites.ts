import { useSyncExternalStore } from 'react'
import { getServerSnapshot, getSnapshot, isFavorite, subscribe } from '../state/favorites'

// Module-level, so each hook hands `useSyncExternalStore` the same function
// identity on every render.
function returnFalse() {
  return false
}

function returnZero() {
  return 0
}

function countSnapshot() {
  return getSnapshot().length
}

/**
 * The favourited ids, newest first. One line over the module store, per the
 * rule that a hook exists only to subscribe to something living outside React
 * (ADR 0005 §8).
 */
export function useFavorites(): number[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Whether one combo is favourited.
 *
 * This is what cards use, never `useFavorites()`. The snapshot is a boolean, so
 * starring a combo re-renders the one card whose answer changed rather than the
 * grid of 348 that would all see a new array (ADR 0005 §8).
 */
export function useIsFavorite(id: number): boolean {
  return useSyncExternalStore(subscribe, () => isFavorite(id), returnFalse)
}

/**
 * The nav's live count (ADR 0003 §3), subscribed to as a number for the same
 * reason: it changes on every toggle, and nothing else should.
 */
export function useFavoritesCount(): number {
  return useSyncExternalStore(subscribe, countSnapshot, returnZero)
}
