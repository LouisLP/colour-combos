// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { watch } from 'vue'

const KEY = 'colour-combos:favorites'

const stored = (ids: number[]) => JSON.stringify({ v: 1, ids })

/**
 * jsdom's `localStorage` is not exposed as a global by the test environment, and
 * a store this small is clearer than the real one anyway.
 */
function stubStorage(seed?: string) {
  const entries = new Map<string, string>()
  if (seed !== undefined)
    entries.set(KEY, seed)
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
  }
  vi.stubGlobal('localStorage', storage)
  return storage
}

/** The store reads storage at import time, so each case gets a fresh module. */
const load = () => import('./favorites')

beforeEach(() => {
  vi.resetModules()
  stubStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('reading storage', () => {
  it('restores what was stored, in order', async () => {
    stubStorage(stored([12, 87, 301]))

    expect((await load()).favorites.value).toEqual([12, 87, 301])
  })

  it('starts empty when nothing is stored', async () => {
    expect((await load()).favorites.value).toEqual([])
  })

  it.each([
    ['unparseable JSON', '{not json'],
    ['a non-object', '[12, 87]'],
    ['an unknown version', JSON.stringify({ v: 2, ids: [12] })],
    ['a missing version', JSON.stringify({ ids: [12] })],
    ['ids that are not an array', JSON.stringify({ v: 1, ids: 12 })],
    ['ids that are not integers', JSON.stringify({ v: 1, ids: [12, '87'] })],
    ['fractional ids', JSON.stringify({ v: 1, ids: [12, 8.5] })],
  ])('resets rather than throwing on %s', async (_, raw) => {
    stubStorage(raw)

    expect((await load()).favorites.value).toEqual([])
  })

  it('dedupes, and drops ids the catalogue does not contain', async () => {
    stubStorage(stored([12, 12, 9999, 87, -1, 0]))

    expect((await load()).favorites.value).toEqual([12, 87])
  })

  it('starts empty when reading storage throws', async () => {
    const storage = stubStorage(stored([12]))
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect((await load()).favorites.value).toEqual([])
  })
})

describe('toggling', () => {
  it('prepends, so the list is newest-first', async () => {
    const { favorites, toggle } = await load()

    toggle(12)
    toggle(87)
    toggle(301)

    expect(favorites.value).toEqual([301, 87, 12])
  })

  it('removes without disturbing the rest of the order', async () => {
    stubStorage(stored([301, 87, 12]))
    const { favorites, toggle } = await load()

    toggle(87)

    expect(favorites.value).toEqual([301, 12])
  })

  it('persists every mutation', async () => {
    const storage = stubStorage()
    const { toggle } = await load()

    toggle(12)
    toggle(87)
    toggle(12)

    expect(storage.getItem(KEY)).toBe(stored([87]))
  })

  it('answers membership and notifies watchers', async () => {
    const { favorites, isFavorite, toggle } = await load()
    const listener = vi.fn()
    watch(favorites, listener, { flush: 'sync' })

    toggle(12)

    expect(isFavorite(12)).toBe(true)
    expect(isFavorite(87)).toBe(false)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('replaces the snapshot rather than mutating it', async () => {
    const { favorites, toggle } = await load()
    const before = favorites.value

    toggle(12)

    expect(favorites.value).not.toBe(before)
    expect(before).toEqual([])
  })

  it('ignores ids the catalogue does not contain', async () => {
    const storage = stubStorage()
    const { favorites, toggle } = await load()

    toggle(9999)

    expect(favorites.value).toEqual([])
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('stops notifying a watcher that has stopped', async () => {
    const { favorites, toggle } = await load()
    const listener = vi.fn()

    watch(favorites, listener, { flush: 'sync' }).stop()
    toggle(12)

    expect(listener).not.toHaveBeenCalled()
  })

  it('warns once and keeps working when storage refuses the write', async () => {
    const storage = stubStorage()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    const { favorites, toggle } = await load()

    toggle(12)
    toggle(87)
    toggle(12)

    expect(favorites.value).toEqual([87])
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

describe('another tab', () => {
  it('adopts its write wholesale', async () => {
    const storage = stubStorage(stored([12]))
    const { favorites } = await load()
    const listener = vi.fn()
    watch(favorites, listener, { flush: 'sync' })

    storage.setItem(KEY, stored([87, 12]))
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }))

    expect(favorites.value).toEqual([87, 12])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('lets a removal there win here — last write wins, not a union', async () => {
    const storage = stubStorage(stored([87, 12]))
    const { favorites } = await load()

    storage.setItem(KEY, stored([87]))
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }))

    expect(favorites.value).toEqual([87])
  })

  it('empties when it clears storage', async () => {
    const storage = stubStorage(stored([12]))
    const { favorites } = await load()

    storage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))

    expect(favorites.value).toEqual([])
  })

  it('ignores writes to keys that are not ours', async () => {
    stubStorage(stored([12]))
    const { favorites } = await load()

    window.dispatchEvent(new StorageEvent('storage', { key: 'some-other-app:setting', newValue: 'x' }))

    expect(favorites.value).toEqual([12])
  })
})
