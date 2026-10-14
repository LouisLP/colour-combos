// One colour value, written as CSS in the notation a reader asked for.

import type { ColourValue } from './scale'

export const COLOUR_FORMATS = ['hex', 'oklch', 'rgb'] as const
export type ColourFormat = typeof COLOUR_FORMATS[number]

/** `#d96629`, `oklch(0.6312 0.1607 45.21)` or `rgb(217 102 41)`: same value, three spellings. */
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
  /** How colours are written. Hex by default, like the package files. */
  format?: ColourFormat
}
