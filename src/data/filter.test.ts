import { describe, expect, it } from 'vitest'
import { comboMode } from '../theme/adapt'
import { COMBO_COUNT, COMBO_SIZES, COMBOS, requireCombo } from './combos'
import { countByHue, countByMode, countBySize, filterCombos, highlight } from './filter'
import { comboHasHue } from './hue'

const ids = (combos: { id: number }[]) => combos.map(combo => combo.id)

describe('filterCombos', () => {
  it('returns the whole source when neither param is set', () => {
    expect(filterCombos(COMBOS, {})).toHaveLength(COMBO_COUNT)
    expect(filterCombos(COMBOS, { q: '   ' })).toHaveLength(COMBO_COUNT)
  })

  it('filters by size', () => {
    const triples = filterCombos(COMBOS, { size: 3 })
    expect(triples).not.toHaveLength(0)
    expect(triples.every(combo => combo.size === 3)).toBe(true)
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

  // ADR 0006 §3: a combo has no name of its own, so `No. N` is the only stable
  // label a user can search by — and it has to actually find that one combo.
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

  it('applies q and size together', () => {
    const both = filterCombos(COMBOS, { q: 'blue', size: 4 })
    const bySize = filterCombos(COMBOS, { q: 'blue' }).filter(combo => combo.size === 4)
    expect(ids(both)).toEqual(ids(bySize))
    expect(both.length).toBeLessThan(filterCombos(COMBOS, { q: 'blue' }).length)
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

  it('filters by the combo\'s canonical mode (ADR 0008)', () => {
    const dark = filterCombos(COMBOS, { mode: 'dark' })
    expect(dark.length).toBeGreaterThan(0)
    expect(dark.every(combo => comboMode(combo) === 'dark')).toBe(true)
    expect(dark.length + filterCombos(COMBOS, { mode: 'light' }).length).toBe(COMBO_COUNT)
  })

  it('applies every param together', () => {
    const all = filterCombos(COMBOS, { q: 'red', size: 3, hue: 'blue', mode: 'light' })
    const stepwise = filterCombos(filterCombos(filterCombos(filterCombos(COMBOS, { q: 'red' }), { size: 3 }), { hue: 'blue' }), { mode: 'light' })
    expect(all.length).toBeGreaterThan(0)
    expect(ids(all)).toEqual(ids(stepwise))
  })

  it('filters any source list, which is what /favorites reuses', () => {
    const source = [requireCombo(12), requireCombo(13)]
    expect(ids(filterCombos(source, { q: '12' }))).toEqual([12])
  })
})

describe('countBySize', () => {
  it('counts the catalogue: 120 pairs, 120 triples, 108 quads', () => {
    expect(countBySize(COMBOS)).toEqual({ 2: 120, 3: 120, 4: 108 })
  })

  it('totals the source, so the chips add up to Any', () => {
    const counts = countBySize(COMBOS)
    const total = COMBO_SIZES.reduce((sum, size) => sum + counts[size], 0)
    expect(total).toBe(COMBO_COUNT)
  })

  // Counts come off the unfiltered source, so they stay facts about the
  // catalogue rather than collapsing to the current selection (ADR 0006 §7).
  it('reports every size as zero for an empty source', () => {
    expect(countBySize([])).toEqual({ 2: 0, 3: 0, 4: 0 })
  })
})

describe('countByHue / countByMode', () => {
  it('counts a combo once under every family it touches', () => {
    const counts = countByHue([requireCombo(1)]) // English Red · Cerulian Blue
    expect(counts.orange).toBe(1)
    expect(counts.blue).toBe(1)
    expect(counts.green).toBe(0)
  })

  it('splits the catalogue between the two modes', () => {
    const { light, dark } = countByMode(COMBOS)
    expect(light + dark).toBe(COMBO_COUNT)
  })
})

describe('highlight', () => {
  const lit = (segments: { text: string, match: boolean }[]) =>
    segments.filter(segment => segment.match).map(segment => segment.text)

  it('marks every occurrence in a name, keeping the original case', () => {
    expect(highlight('Blue Violet Blue', 'name', 'blue')).toEqual([
      { text: 'Blue', match: true },
      { text: ' Violet ', match: false },
      { text: 'Blue', match: true },
    ])
  })

  it('leaves text alone with no query', () => {
    expect(highlight('Cerulian Blue', 'name', undefined)).toEqual([{ text: 'Cerulian Blue', match: false }])
    expect(highlight('Cerulian Blue', 'name', '  ')).toEqual([{ text: 'Cerulian Blue', match: false }])
  })

  // It must agree with the matcher, or a result would light up for a reason
  // that is not why it is there.
  it('lights hexes only for a hashed needle', () => {
    expect(lit(highlight('#d96629', 'hex', '#D96'))).toEqual(['#d96'])
    expect(lit(highlight('Dark d96', 'name', '#d96'))).toEqual([])
  })

  it('lights names and unprefixed hexes for a word', () => {
    expect(lit(highlight('#0093a5', 'hex', '93a'))).toEqual(['93a'])
    expect(lit(highlight('Raw Sienna', 'name', 'sien'))).toEqual(['Sien'])
  })

  it('lights nothing for a combo number', () => {
    expect(lit(highlight('#121212', 'hex', '12'))).toEqual([])
  })
})
