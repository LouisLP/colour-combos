import { describe, expect, it } from 'vitest'
import { COMBO_COUNT, COMBOS, requireCombo } from './combos'
import { filterCombos } from './filter'
import { comboHasHue } from './hue'

const ids = (combos: { id: number }[]) => combos.map(combo => combo.id)

describe('filterCombos', () => {
  it('returns the whole catalogue when neither param is set', () => {
    expect(filterCombos(COMBOS, {})).toHaveLength(COMBO_COUNT)
    expect(filterCombos(COMBOS, { q: '   ' })).toHaveLength(COMBO_COUNT)
  })

  it('matches colour names, case-insensitively and on a partial word', () => {
    const hits = filterCombos(COMBOS, { q: 'BLUE' })
    expect(hits).not.toHaveLength(0)
    expect(hits.every(combo =>
      combo.colours.some(colour => colour.name.toLowerCase().includes('blue')),
    )).toBe(true)
  })

  it('matches a hex value, with or without the hash', () => {
    const hex = requireCombo(1).colours[0].hex
    expect(ids(filterCombos(COMBOS, { q: hex }))).toContain(1)
    expect(ids(filterCombos(COMBOS, { q: hex.slice(1).toUpperCase() }))).toContain(1)
  })

  // `No. N` is a combo's only label (ADR 0006 §3), so it must find exactly one.
  it.each(['12', 'no. 12', 'no 12', 'No.12'])('matches the combo number in %s', (q) => {
    expect(ids(filterCombos(COMBOS, { q }))).toEqual([12])
  })

  it('reads a bare number as a number only, never as a hex fragment', () => {
    const digitsInHexes = COMBOS.filter(combo =>
      combo.colours.some(colour => colour.hex.includes('12')),
    )
    expect(digitsInHexes.length).toBeGreaterThan(1)
    expect(filterCombos(COMBOS, { q: '12' })).toHaveLength(1)
  })

  it('reads a hashed needle as a hex only, never as a number', () => {
    expect(filterCombos(COMBOS, { q: '#12' })).not.toContainEqual(requireCombo(12))
  })

  it('preserves catalogue order', () => {
    const hits = ids(filterCombos(COMBOS, { q: 'blue' }))
    expect(hits).toEqual([...hits].sort((a, b) => a - b))
  })

  it('can come back empty — an empty result is a real state, not a bug', () => {
    expect(filterCombos(COMBOS, { q: 'zzzznotacolour' })).toEqual([])
  })

  it('filters by hue family', () => {
    const blues = filterCombos(COMBOS, { hue: 'blue' })
    expect(blues.length).toBeGreaterThan(0)
    expect(blues.length).toBeLessThan(COMBO_COUNT)
    expect(blues.every(combo => comboHasHue(combo, 'blue'))).toBe(true)
  })

  it('applies q and hue together', () => {
    const all = filterCombos(COMBOS, { q: 'red', hue: 'blue' })
    const stepwise = filterCombos(filterCombos(COMBOS, { q: 'red' }), { hue: 'blue' })
    expect(all.length).toBeGreaterThan(0)
    expect(ids(all)).toEqual(ids(stepwise))
  })
})
