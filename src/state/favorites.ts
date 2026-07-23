// Favourites, as a module singleton (ADR 0003 §4, ADR 0005 §4). It is now the
// app's only module store — mode used to share the shape until it became
// combo-derived (ADR 0008).
//
// Memory is the truth for the session; localStorage is the durable mirror,
// written through on every mutation. A favourite is a bare numeric Wada id and
// never a copy of a combo's colours, so a corrected hex can leave nothing stale
// behind.

import { getCombo } from '../data/combos'

/** Namespaced, so nothing else on this origin can collide with it (§2). */
export const FAVORITES_KEY = 'colour-combos:favorites'

/**
 * Somewhere for a future schema change to hang a real migration. Until this
 * bumps there is no migration code to write, and an unknown version reads as
 * empty rather than as something to guess at.
 */
const VERSION = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Validate-or-reset (§2). Anything unrecognised yields an empty list rather
 * than throwing: a hand-corrupted key costs the visitor their stars, not their
 * page.
 *
 * Valid input is deduped and stripped of ids the dataset no longer contains.
 * Those vanish silently, which is correct for a static committed catalogue.
 */
function read(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (raw === null)
      return []

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.v !== VERSION || !Array.isArray(parsed.ids))
      return []

    const resolved: number[] = []
    const seen = new Set<number>()
    for (const id of parsed.ids) {
      // Not an array of integers — reject the whole record, don't salvage part
      // of it. Half a list is a worse answer than none.
      if (!Number.isInteger(id))
        return []
      if (seen.has(id) || getCombo(id) === undefined)
        continue
      seen.add(id)
      resolved.push(id)
    }
    return resolved
  }
  catch {
    return []
  }
}

/** Newest first: the array *is* the order, so nothing extra is stored (§3). */
let ids = read()
/** Derived, and kept in step deliberately: membership is O(1) on 348 cards. */
let index = new Set(ids)

const listeners = new Set<() => void>()

function emit(next: number[]) {
  ids = next
  index = new Set(next)
  listeners.forEach(listener => listener())
}

let warned = false

/** On a write failure, warn once and degrade to session-only (§6). */
function persist(next: number[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify({ v: VERSION, ids: next }))
  }
  catch {
    if (!warned) {
      warned = true
      console.warn(`Could not persist ${FAVORITES_KEY}; favourites will not survive a reload.`)
    }
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * The snapshot is the array itself, replaced wholesale on every mutation — so
 * `useSyncExternalStore` compares references and never sees a moving target.
 */
export const getSnapshot = (): number[] => ids

/** Prerendering has no storage to read (ADR 0005 consequences). */
const EMPTY: number[] = []
export const getServerSnapshot = (): number[] => EMPTY

export const isFavorite = (id: number): boolean => index.has(id)

/**
 * Add (prepending, so the list stays newest-first) or remove, then persist and
 * notify.
 *
 * Ids outside the catalogue are ignored rather than stored: they would be
 * dropped on the next read anyway, and a list that silently shrinks across a
 * reload is worse than one that never grew.
 */
export function toggle(id: number): void {
  if (index.has(id)) {
    const next = ids.filter(existing => existing !== id)
    persist(next)
    emit(next)
    return
  }

  if (getCombo(id) === undefined)
    return

  const next = [id, ...ids]
  persist(next)
  emit(next)
}

if (typeof window !== 'undefined') {
  // Another tab wrote the key: adopt wholesale, last write wins (§5). No merge
  // logic — a union would make unfavouriting unreliable, since a removal here
  // would be re-added by the other tab's copy. A `null` key is a `clear()`.
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== FAVORITES_KEY)
      return
    emit(read())
  })
}
