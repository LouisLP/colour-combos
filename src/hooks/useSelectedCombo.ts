import type { Combo } from '../data/combos'
import { requireCombo } from '../data/combos'
import { useHubSearch } from './useHubSearch'

/**
 * The combo currently theming the site. Read from the URL, which is its only
 * source of truth (ADR 0004 §1) — there is no store behind this.
 *
 * A hook exists only to subscribe to something that lives outside React; it
 * holds no logic and makes no decisions (ADR 0005 §8).
 */
export function useSelectedCombo(): Combo {
  return requireCombo(useHubSearch().c)
}
