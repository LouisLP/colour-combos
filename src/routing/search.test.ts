import { describe, expect, it } from 'vitest'
import { COMBO_COUNT, getCombo } from '../data/combos'
import { fallbackComboId, resolveComboId, validateHubSearch } from './search'

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

  // ADR 0005 §6: StrictMode double-invokes validators and TanStack re-validates
  // on any param change, so a non-memoised fallback would re-theme the site as
  // the user typed in the search box.
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

  // TanStack parses search params structurally, so `?q=13` arrives as a number.
  // Dropping it would lose the `No. 13` search — the one query a user can be
  // certain matches something, because it is printed on the card.
  it('keeps a numeric query, which the router hands over as a number', () => {
    expect(validateHubSearch({ c: '1', q: 13 }).q).toBe('13')
    expect(validateHubSearch({ c: '1', q: 0 }).q).toBe('0')
  })

  it('accepts only the sizes the catalogue contains', () => {
    expect(validateHubSearch({ c: '1', size: '3' }).size).toBe(3)
    expect(validateHubSearch({ c: '1', size: '5' }).size).toBeUndefined()
    expect(validateHubSearch({ c: '1', size: 'big' }).size).toBeUndefined()
  })
})
