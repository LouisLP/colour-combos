import type { Mode } from '../theme/adapt'
import { useSyncExternalStore } from 'react'
import { getServerSnapshot, getSnapshot, subscribe } from '../state/mode'

/**
 * The active mode. One line over the module store, per the rule that a hook
 * exists only to subscribe to something living outside React (ADR 0005 §8).
 */
export function useMode(): Mode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
