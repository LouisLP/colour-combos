import { describe, expect, it } from 'vitest'
import { COMBOS } from './combos'
import { colourHueFamily, comboHasHue, HUE_FAMILIES } from './hue'

describe('colourHueFamily', () => {
  // Named Wada colours whose family nobody would argue with.
  it.each([
    ['Scarlet', '#cb2f43', 'red'],
    ['Orange', '#f37420', 'orange'],
    ['Yellow', '#fff200', 'yellow'],
    ['Green', '#489b6e', 'green'],
    ['Cerulian Blue', '#0093a5', 'blue'],
    ['Violet', '#4f4086', 'purple'],
  ])('puts %s in %s', (_name, hex, family) => {
    expect(colourHueFamily({ hex })).toBe(family)
  })

  // Greys have a noise hue in OKLCH; it mustn't pick their family.
  it.each(['#ffffff', '#111314', '#a1a39a'])('reads %s as neutral', (hex) => {
    expect(colourHueFamily({ hex })).toBe('neutral')
  })
})

describe('comboHasHue', () => {
  it('matches a combo when any one of its colours is in the family', () => {
    const combo = COMBOS.find(c => c.id === 1)! // English Red · Cerulian Blue
    expect(comboHasHue(combo, 'blue')).toBe(true)
    expect(comboHasHue(combo, 'orange')).toBe(true)
    expect(comboHasHue(combo, 'green')).toBe(false)
  })

  it('leaves no family empty across the catalogue', () => {
    for (const family of HUE_FAMILIES)
      expect(COMBOS.some(combo => comboHasHue(combo, family))).toBe(true)
  })
})
