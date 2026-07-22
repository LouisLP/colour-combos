import { describe, expect, it } from 'vitest'
import { COMBO_COUNT, comboLabel, COMBOS, requireCombo } from './combos'

describe('the catalogue', () => {
  it('is the 348 classic combos on contiguous ids', () => {
    expect(COMBO_COUNT).toBe(348)
    expect(COMBOS.map(combo => combo.id)).toEqual(
      Array.from({ length: 348 }, (_, i) => i + 1),
    )
  })

  it('holds 2–4 colours per combo, matching the declared size', () => {
    for (const combo of COMBOS) {
      expect(combo.colours).toHaveLength(combo.size)
      expect(combo.size).toBeGreaterThanOrEqual(2)
      expect(combo.size).toBeLessThanOrEqual(4)
    }
  })
})

describe('comboLabel', () => {
  it('joins the colour names in order', () => {
    expect(comboLabel(requireCombo(1))).toBe(
      requireCombo(1).colours.map(colour => colour.name).join(' · '),
    )
  })

  it('names every colour, so no card label is silently truncated', () => {
    for (const combo of COMBOS) {
      const label = comboLabel(combo)
      for (const colour of combo.colours)
        expect(label).toContain(colour.name)
    }
  })
})
