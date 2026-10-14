import type { ComputedRef } from 'vue'
import type { ColourFormat } from '../lib/format'
import { colourFormat } from '../state/colourFormat'

/**
 * The combo page's colour notation. One line over the module store
 * (ADR 0005 §8); writes go through `setColourFormat` directly.
 */
export function useColourFormat(): ComputedRef<ColourFormat> {
  return colourFormat
}
