// Light/dark, as a module singleton (ADR 0005 §4).
//
// React is not this fact's only owner: the pre-hydration head script primes it,
// `matchMedia` and the `storage` event push into it, and `color-scheme` on
// `<html>` is a DOM fact that outlives any component. Memory is the truth;
// localStorage and `color-scheme` are mirrors of it.

import type { Mode } from '../theme/adapt'

/**
 * DUPLICATED IN `index.html`. The head script resolves the same key by the same
 * rule, before this module exists — it has to, or the page flashes the wrong
 * mode. A change to either the key or the rule must be made in both places.
 */
export const MODE_KEY = 'colour-combos:mode'

const QUERY = '(prefers-color-scheme: dark)'

const isMode = (value: unknown): value is Mode => value === 'light' || value === 'dark'

/**
 * Absence is meaningful: no override means follow the system, live. Anything
 * that is not a mode is treated as absent (validate-or-reset, ADR 0003 §2).
 */
function readOverride(): Mode | undefined {
  try {
    const stored = localStorage.getItem(MODE_KEY)
    return isMode(stored) ? stored : undefined
  }
  catch {
    return undefined
  }
}

function systemMode(): Mode {
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches ? 'dark' : 'light'
}

let override = readOverride()
let value: Mode = override ?? systemMode()

const listeners = new Set<() => void>()

function emit(next: Mode) {
  if (next === value)
    return
  value = next
  document.documentElement.style.colorScheme = next
  listeners.forEach(listener => listener())
}

let warned = false

/** On a write failure, warn once and keep working for the session (ADR 0003). */
function persist(mode: Mode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  }
  catch {
    if (!warned) {
      warned = true
      console.warn(`Could not persist ${MODE_KEY}; mode will reset on reload.`)
    }
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSnapshot = (): Mode => value

/** Prerendering has no system preference to read, so it gets the ADR's default. */
export const getServerSnapshot = (): Mode => 'light'

export function setMode(mode: Mode): void {
  override = mode
  persist(mode)
  emit(mode)
}

export const toggle = (): void => setMode(value === 'dark' ? 'light' : 'dark')

if (typeof window !== 'undefined') {
  // Attached always, but acts only while no override exists — the "follow the
  // system, live" row of the table falls out of the store's shape rather than
  // needing a mode-of-modes.
  matchMedia(QUERY).addEventListener('change', () => {
    if (!override)
      emit(systemMode())
  })

  // Another tab wrote the key: adopt wholesale, last write wins (ADR 0003).
  // A `null` key is a `clear()`, which puts us back to following the system.
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== MODE_KEY)
      return
    override = readOverride()
    emit(override ?? systemMode())
  })
}
