// PROTOTYPE — throwaway. Shared plumbing for the three browse variants.
//
// The URL param contract is the real one (#5): `c` selects + themes, `q`
// searches (replace, debounced), `size` filters (push). Favourites are the
// ADR 0003 §4 store shape but MEMORY ONLY — persistence is settled elsewhere
// and a prototype should not depend on it.

import type { Combo, Mode } from '../adaptation-model/adapt.ts'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import combosJson from '../adaptation-model/combos.json'

export const combos = combosJson as Combo[]

// ---------------------------------------------------------------------------
// URL params — the #5 contract, with its history semantics
// ---------------------------------------------------------------------------

export interface Params {
  /** Selected combo id — themes the page. */
  c: number
  /** Free-text search. */
  q: string
  /** Colour-count filter, or null for "any". */
  size: number | null
  /** Favourites-only. Stands in for the /favorites route. */
  fav: boolean
  // --- prototype chrome, not part of the design ---
  variant: string
  mode: Mode
  /** `content-visibility: auto` on the grid container. */
  cv: boolean
}

function read(): Params {
  const p = new URLSearchParams(window.location.search)
  const c = Number(p.get('c'))
  const size = Number(p.get('size'))
  return {
    c: combos.some(x => x.id === c) ? c : 0,
    q: p.get('q') ?? '',
    size: size >= 2 && size <= 4 ? size : null,
    fav: p.get('fav') === '1',
    variant: p.get('variant') ?? 'A',
    mode: p.get('mode') === 'dark' ? 'dark' : 'light',
    cv: p.get('cv') !== '0',
  }
}

function write(next: Params, how: 'push' | 'replace') {
  const p = new URLSearchParams()
  p.set('c', String(next.c))
  if (next.q)
    p.set('q', next.q)
  if (next.size)
    p.set('size', String(next.size))
  if (next.fav)
    p.set('fav', '1')
  p.set('variant', next.variant)
  p.set('mode', next.mode)
  if (!next.cv)
    p.set('cv', '0')
  const url = `${window.location.pathname}?${p}`
  if (how === 'push')
    window.history.pushState(null, '', url)
  else window.history.replaceState(null, '', url)
}

export function useParams() {
  const [params, setParams] = useState(read)
  // A mirror of the latest params, so `set` can compute the next URL WITHOUT
  // doing it inside a state updater. Updaters must stay pure: StrictMode
  // double-invokes them, which pushed every history entry twice and made Back
  // look like it did nothing.
  const latest = useRef(params)
  latest.current = params

  // A bare URL resolves to a random combo, replaceState'd in before the first
  // settled frame — ADR 0001 §6 / #5's resolution table.
  useEffect(() => {
    if (params.c === 0) {
      const next = { ...read(), c: combos[Math.floor(Math.random() * combos.length)].id }
      write(next, 'replace')
      setParams(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onPop = () => setParams(read())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const set = useCallback((patch: Partial<Params>, how: 'push' | 'replace' = 'push') => {
    const next = { ...latest.current, ...patch }
    latest.current = next
    write(next, how)
    setParams(next)
  }, [])

  return [params, set] as const
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Wada combos carry NO name of their own — only their colours do. So search
 * matches colour names, hexes, and the combo id, and a card's only stable
 * label is `#id`.
 */
export function filterCombos(source: Combo[], q: string, size: number | null): Combo[] {
  const needle = q.trim().toLowerCase()
  return source.filter((combo) => {
    if (size && combo.size !== size)
      return false
    if (!needle)
      return true
    if (String(combo.id) === needle)
      return true
    return combo.colours.some(c =>
      c.name.toLowerCase().includes(needle) || c.hex.toLowerCase().includes(needle),
    )
  })
}

// ---------------------------------------------------------------------------
// Favourites — ADR 0003 §4 shape, memory only
// ---------------------------------------------------------------------------

let ids: number[] = [12, 87, 301].filter(id => combos.some(c => c.id === id))
let index = new Set(ids)
let snapshot = { ids, index }
const listeners = new Set<() => void>()

export const favourites = {
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  getSnapshot: () => snapshot,
  toggle(id: number) {
    ids = index.has(id) ? ids.filter(x => x !== id) : [id, ...ids]
    index = new Set(ids)
    snapshot = { ids, index }
    listeners.forEach(fn => fn())
  },
}

export function useFavourites() {
  return useSyncExternalStore(favourites.subscribe, favourites.getSnapshot)
}

// ---------------------------------------------------------------------------
// Paint meter — prototype chrome. Measures rather than assumes.
// ---------------------------------------------------------------------------

export interface Sample { commit: number, frame: number, nodes: number }

/**
 * `commit` = React render + layout (measured at useLayoutEffect).
 * `frame`  = through to the next painted frame.
 * Both are measured from the top of the App render that `key` changed on.
 */
export function useRenderMeter(key: unknown) {
  const t0 = useRef(0)
  const seen = useRef<unknown>(null)
  const [sample, setSample] = useState<Sample>({ commit: 0, frame: 0, nodes: 0 })

  if (seen.current !== key) {
    seen.current = key
    t0.current = performance.now()
  }

  useEffect(() => {
    const start = t0.current
    const commit = performance.now() - start
    requestAnimationFrame(() => {
      setSample({
        commit,
        frame: performance.now() - start,
        nodes: document.querySelectorAll('*').length,
      })
    })
  }, [key])

  return sample
}
