import type { Combo, ComboColour } from './combos'
import { HUE_SOURCE_MIN_CHROMA } from '../theme/adapt'
import { hexToOklch } from '../theme/colour'

/** Hue families to filter by (ADR 0014 §3). Seven plain words, not a wheel. */
export const HUE_FAMILIES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'neutral'] as const
export type HueFamily = typeof HUE_FAMILIES[number]

/**
 * Where each family starts, in OKLCH hue degrees; red wraps through 0°. Fitted
 * to the catalogue's 159 colours, not a textbook wheel.
 */
const HUE_STARTS: [number, HueFamily][] = [
  [40, 'orange'],
  [75, 'yellow'],
  [115, 'green'],
  [185, 'blue'],
  [265, 'purple'],
  [350, 'red'],
]

const familyByHex = new Map<string, HueFamily>()

/** One colour's family. Below the hue-source chroma floor, it's `neutral`. */
export function colourHueFamily(colour: Pick<ComboColour, 'hex'>): HueFamily {
  const cached = familyByHex.get(colour.hex)
  if (cached)
    return cached

  const { c, h } = hexToOklch(colour.hex)
  let family: HueFamily = 'red'
  if (c < HUE_SOURCE_MIN_CHROMA) {
    family = 'neutral'
  }
  else {
    for (const [start, name] of HUE_STARTS) {
      if (h >= start)
        family = name
    }
    // Past 350° wraps back to red.
  }

  familyByHex.set(colour.hex, family)
  return family
}

/** A combo is in a family when *any* of its colours is (ADR 0006 §2). */
export function comboHasHue(combo: Combo, family: HueFamily): boolean {
  return combo.colours.some(colour => colourHueFamily(colour) === family)
}
