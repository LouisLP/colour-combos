import { describe, expect, it } from 'vitest'
import { COMBO_COUNT } from '../data/combos'
import { resolveComboId, toHubQuery, validateHubSearch } from './search'

describe('resolveComboId', () => {
  it('passes a valid id through', () => {
    expect(resolveComboId('153')).toBe(153)
    expect(resolveComboId(1)).toBe(1)
    expect(resolveComboId(String(COMBO_COUNT))).toBe(COMBO_COUNT)
  })

  it.each([undefined, '', '999', '0', '-1', 'abc', '1.5', '12abc'])('opens nothing for %s', (raw) => {
    expect(resolveComboId(raw)).toBeUndefined()
  })
})

describe('validateHubSearch', () => {
  it('reads every param', () => {
    expect(validateHubSearch({ q: 'blue', hue: 'red', c: '12' })).toEqual({ q: 'blue', hue: 'red', c: 12 })
  })

  it('degrades a bad param to absent', () => {
    expect(validateHubSearch({ q: '', hue: 'teal', c: '999' })).toEqual({ q: undefined, hue: undefined, c: undefined })
  })

  it('takes the first of a repeated param', () => {
    expect(validateHubSearch({ q: ['a', 'b'] }).q).toBe('a')
  })
})

describe('toHubQuery', () => {
  it('leaves absent params out, in a fixed order', () => {
    expect(toHubQuery({})).toEqual({})
    expect(Object.keys(toHubQuery({ c: 3, hue: 'blue', q: 'x' }))).toEqual(['q', 'hue', 'c'])
  })

  it('round-trips through validation', () => {
    const search = { q: 'sienna', hue: 'orange', c: 241 } as const
    expect(validateHubSearch(toHubQuery(search) as Record<string, string>)).toEqual(search)
  })
})
