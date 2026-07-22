// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'colour-combos:mode'

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

/** A `prefers-color-scheme` the test can change, which jsdom's own cannot. */
function stubSystem(prefersDark: boolean) {
  const listeners = new Set<() => void>()
  const mql = {
    matches: prefersDark,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', () => mql)
  return (next: boolean) => {
    mql.matches = next
    listeners.forEach(listener => listener())
  }
}

/** The store reads storage at import time, so each case gets a fresh module. */
const load = () => import('./mode')

beforeEach(() => {
  vi.resetModules()
  stubStorage()
  document.documentElement.style.colorScheme = ''
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('with no override stored', () => {
  it('follows the system', async () => {
    stubSystem(true)

    expect((await load()).getSnapshot()).toBe('dark')
  })

  it('follows a system change live, and tells subscribers', async () => {
    const setSystem = stubSystem(false)
    const { getSnapshot, subscribe } = await load()
    const listener = vi.fn()
    subscribe(listener)

    setSystem(true)

    expect(getSnapshot()).toBe('dark')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('treats a garbage value as absent', async () => {
    stubStorage('aubergine')
    const setSystem = stubSystem(false)
    const { getSnapshot } = await load()

    expect(getSnapshot()).toBe('light')

    // Absent means absent: the system is still allowed to drive.
    setSystem(true)
    expect(getSnapshot()).toBe('dark')
  })
})

describe('with an override stored', () => {
  it('ignores the system, in both directions', async () => {
    stubStorage('light')
    const setSystem = stubSystem(true)
    const { getSnapshot } = await load()

    expect(getSnapshot()).toBe('light')

    setSystem(false)
    setSystem(true)
    expect(getSnapshot()).toBe('light')
  })
})

describe('setting the mode', () => {
  it('persists, mirrors color-scheme and notifies', async () => {
    const storage = stubStorage()
    stubSystem(false)
    const { getSnapshot, setMode, subscribe } = await load()
    const listener = vi.fn()
    subscribe(listener)

    setMode('dark')

    expect(getSnapshot()).toBe('dark')
    expect(storage.getItem(KEY)).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('stops following the system once toggled', async () => {
    const setSystem = stubSystem(false)
    const { getSnapshot, toggle } = await load()

    toggle()
    expect(getSnapshot()).toBe('dark')

    setSystem(true)
    setSystem(false)
    expect(getSnapshot()).toBe('dark')
  })

  it('unsubscribes cleanly', async () => {
    stubSystem(false)
    const { setMode, subscribe } = await load()
    const listener = vi.fn()

    subscribe(listener)()
    setMode('dark')

    expect(listener).not.toHaveBeenCalled()
  })

  it('warns once and keeps working when storage refuses the write', async () => {
    const storage = stubStorage()
    stubSystem(false)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    const { getSnapshot, setMode } = await load()

    setMode('dark')
    setMode('light')
    setMode('dark')

    expect(getSnapshot()).toBe('dark')
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

describe('another tab', () => {
  it('adopts its write wholesale', async () => {
    const storage = stubStorage()
    stubSystem(false)
    const { getSnapshot, subscribe } = await load()
    const listener = vi.fn()
    subscribe(listener)

    storage.setItem(KEY, 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: 'dark' }))

    expect(getSnapshot()).toBe('dark')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('goes back to following the system when it clears storage', async () => {
    const storage = stubStorage('light')
    const setSystem = stubSystem(true)
    const { getSnapshot } = await load()

    storage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))

    expect(getSnapshot()).toBe('dark')

    setSystem(false)
    expect(getSnapshot()).toBe('light')
  })

  it('ignores writes to keys that are not ours', async () => {
    stubStorage('dark')
    stubSystem(false)
    const { getSnapshot } = await load()

    window.dispatchEvent(new StorageEvent('storage', { key: 'colour-combos:favorites', newValue: '[1]' }))

    expect(getSnapshot()).toBe('dark')
  })
})
