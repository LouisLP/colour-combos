// One colour value, written as CSS in the notation a reader asked for.

import type { ColourValue } from './scale'

export const COLOUR_FORMATS = ['hex', 'oklch', 'rgb'] as const
export type ColourFormat = typeof COLOUR_FORMATS[number]

/**
 * `#d96629`, `oklch(0.6312 0.1607 45.21)` or `rgb(217 102 41)`. All three are
 * the same 8-bit sRGB value (`ColourValue`); this only chooses how it is spelled.
 */
export function formatColour(value: ColourValue, format: ColourFormat): string {
  switch (format) {
    case 'hex':
      return value.hex
    case 'oklch':
      return `oklch(${value.oklch.join(' ')})`
    case 'rgb':
      return `rgb(${value.rgb.join(' ')})`
  }
}

/** What every emitter whose values are CSS colours accepts. */
export interface EmitOptions {
  /** How each literal colour is spelled. Hex by default, which is what the package ships. */
  format?: ColourFormat
}
