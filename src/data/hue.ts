import type { Combo, ComboColour } from './combos'
import { HUE_SOURCE_MIN_CHROMA } from '../theme/adapt'
import { hexToOklch } from '../theme/colour'

/**
 * The hue families a combo can be filtered by (ADR 0014 §3). Coarse on purpose:
 * seven words a person would actually reach for, not a colour wheel.
 */
export const HUE_FAMILIES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'neutral'] as const
export type HueFamily = typeof HUE_FAMILIES[number]

/**
 * Where each chromatic family *starts*, in OKLCH hue degrees, read clockwise.
 * A family runs until the next one starts, and red wraps through 0°.
 *
 * Fitted to the catalogue's 159 distinct colours rather than to a textbook
 * wheel: OKLCH puts Wada's browns and tans (Mars Brown, Cinnamon, Raw Sienna)
 * in 40–75°, his olives with the yellows they read as, and his carmines and
 * pinks either side of 0°.
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

/**
 * One colour's family. Too grey to carry a hue — the same chroma floor the
 * adapter uses to refuse a hue source (ADR 0002) — reads as `neutral`, so
 * White and Warm Gray do not land in whatever family their noise hue points at.
 */
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
    // Past 350° wraps back round to red, which the loop already left in place.
  }

  familyByHex.set(colour.hex, family)
  return family
}

/**
 * A combo is in a family when *any* of its colours is. A combo is a set of
 * colours with equal standing (ADR 0006 §2), so "a combo with a blue in it" is
 * the question, not "a combo whose accent is blue" — the accent is a theming
 * decision, invisible on the card.
 */
export function comboHasHue(combo: Combo, family: HueFamily): boolean {
  return combo.colours.some(colour => colourHueFamily(colour) === family)
}
