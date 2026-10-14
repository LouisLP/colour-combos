import { describe, expect, it } from 'vitest'
import { toKanji } from './japanese'

describe('toKanji', () => {
  it.each([
    [1, '一'],
    [9, '九'],
    [10, '十'],
    [12, '十二'],
    [20, '二十'],
    [100, '百'],
    [110, '百十'],
    [101, '百一'],
    [241, '二百四十一'],
    [348, '三百四十八'],
  ])('writes %i as %s', (n, kanji) => {
    expect(toKanji(n)).toBe(kanji)
  })
})
