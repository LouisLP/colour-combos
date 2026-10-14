import { describe, expect, it } from 'vitest'
import { COMBO_COUNT, getCombo } from '../data/combos'
import { fallbackComboId, resolveComboId, toHubQuery, validateHubSearch } from './search'

describe('resolveComboId', () => {
  it('passes a valid id through untouched', () => {
    expect(resolveComboId('153')).toEqual({ id: 153 })
    expect(resolveComboId(1)).toEqual({ id: 1 })
    expect(resolveComboId(COMBO_COUNT)).toEqual({ id: COMBO_COUNT })
  })

  it('resolves an absent id silently', () => {
    expect(resolveComboId(undefined).rejected).toBeUndefined()
    expect(resolveComboId('').rejected).toBeUndefined()
  })

  it.each(['999', '0', '-1', 'abc', '1.5', '12abc'])('reports %s as rejected', (raw) => {
    const { id, rejected } = resolveComboId(raw)
    expect(rejected).toBe(raw)
    expect(getCombo(id)).toBeDefined()
  })

  it('always resolves to a combo that exists', () => {
    for (const raw of [undefined, '', '999', 'abc', '348', '1'])
      expect(getCombo(resolveComboId(raw).id)).toBeDefined()
  })

  // ADR 0005 §6: the query is re-validated on every param change, so a
  // non-memoised fallback would re-theme the site as the user typed in the
  // search box.
  it('picks the same fallback combo for the lifetime of the document', () => {
    const first = fallbackComboId()
    expect(fallbackComboId()).toBe(first)
    expect(resolveComboId(undefined).id).toBe(first)
    expect(resolveComboId('nonsense').id).toBe(first)
  })
})

describe('validateHubSearch', () => {
  it('drops an empty query rather than serialising it', () => {
    expect(validateHubSearch({ c: '1', q: '' }).q).toBeUndefined()
    expect(validateHubSearch({ c: '1' }).q).toBeUndefined()
    expect(validateHubSearch({ c: '1', q: 'blue' }).q).toBe('blue')
  })

  // `13` is the `No. 13` printed on a card — the one query a user can be
  // certain matches something, so it must survive as a string.
  it('keeps a numeric query', () => {
    expect(validateHubSearch({ c: '1', q: '13' }).q).toBe('13')
    expect(validateHubSearch({ c: '1', q: '0' }).q).toBe('0')
  })

  it('reads the first of a repeated param', () => {
    expect(validateHubSearch({ c: ['7', '9'], q: ['blue', 'rose'] })).toEqual({ c: 7, q: 'blue', size: undefined })
  })

  it('accepts only the sizes the catalogue contains', () => {
    expect(validateHubSearch({ c: '1', size: '3' }).size).toBe(3)
    expect(validateHubSearch({ c: '1', size: '5' }).size).toBeUndefined()
    expect(validateHubSearch({ c: '1', size: 'big' }).size).toBeUndefined()
  })
})

describe('toHubQuery', () => {
  it('writes c first and leaves absent params out', () => {
    expect(toHubQuery({ c: 7 })).toEqual({ c: '7' })
    expect(toHubQuery({ c: 7, q: 'blue', size: 3 })).toEqual({ c: '7', q: 'blue', size: '3' })
  })
})
