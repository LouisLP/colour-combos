import type { ComputedRef } from 'vue'
import { announcement } from '../state/announcer'

/** The live region's current text. One line over the module store (ADR 0005 §8). */
export function useAnnouncement(): ComputedRef<string> {
  return announcement
}
