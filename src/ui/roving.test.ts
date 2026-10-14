import { describe, expect, it } from 'vitest'
import { rovingTarget } from './roving'

describe('rovingTarget', () => {
  // Ten results laid out four to a row.
  const move = (key: string, index: number) => rovingTarget(key, index, 10, 4)

  it('steps one result with j/k and ←/→', () => {
    expect(move('j', 2)).toBe(3)
    expect(move('ArrowRight', 2)).toBe(3)
    expect(move('k', 2)).toBe(1)
    expect(move('ArrowLeft', 2)).toBe(1)
  })

  it('steps one visual row with ↑/↓', () => {
    expect(move('ArrowDown', 1)).toBe(5)
    expect(move('ArrowUp', 5)).toBe(1)
  })

  it('jumps to the ends with Home/End', () => {
    expect(move('Home', 6)).toBe(0)
    expect(move('End', 2)).toBe(9)
  })

  // A wrap from the last result to the first would read as the list reloading.
  it('stops at the edges rather than wrapping', () => {
    expect(move('j', 9)).toBe(9)
    expect(move('k', 0)).toBe(0)
    expect(move('ArrowDown', 8)).toBe(9)
    expect(move('ArrowUp', 2)).toBe(0)
  })

  it('ignores keys that are not navigation', () => {
    expect(move('f', 2)).toBeUndefined()
    expect(move('Enter', 2)).toBeUndefined()
  })
})
