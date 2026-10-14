import type { LocationQueryRaw } from 'vue-router'
import type { ComboSize } from '../data/combos'
import { COMBO_COUNT, COMBO_SIZES } from '../data/combos'

/**
 * The search params every route carries. They are route-agnostic on purpose:
 * `c`, `q` and `size` all survive navigation between `/` and `/favorites`
 * (ADR 0004 §3–4), which is what lets `/favorites` reuse the browse grid
 * unchanged (ADR 0003 §3).
 */
export interface HubSearch {
  /** The selected combo. Always resolved — exactly one is always selected. */
  c: number
  /** Free-text search. Absent rather than empty, to keep the URL clean. */
  q?: string
  /** Size filter. Absent means no filter, not "all". */
  size?: ComboSize
}

/**
 * The random combo a bare or invalid `c` falls back to, picked at most once per
 * document.
 *
 * Validation is not called once: the router guard runs on every navigation and
 * every component re-reads the query whenever *any* param changes. A bare
 * `Math.random()` here would hand back a different combo on each call and the
 * site would re-theme itself as the user typed in the search box (ADR 0005 §6).
 * Memoising makes validation pure with respect to the document: a reload picks a
 * new combo, a re-validation cannot.
 */
let sessionComboId: number | undefined
export function fallbackComboId(): number {
  sessionComboId ??= 1 + Math.floor(Math.random() * COMBO_COUNT)
  return sessionComboId
}

export interface ComboResolution {
  /** Always a valid id in `1–COMBO_COUNT`. */
  id: number
  /**
   * The raw `c` we refused, present only when one was supplied and rejected.
   * Carries the "Combo 999 not found" notice (ADR 0005 §7).
   */
  rejected?: string
}

/**
 * Resolve an incoming `c` to exactly one combo (ADR 0004 §8).
 *
 * Absent resolves silently; invalid resolves *and* reports what it refused, so
 * a mistyped or stale shared link is explained rather than silently swallowed.
 */
export function resolveComboId(raw: unknown): ComboResolution {
  if (raw === undefined || raw === null || raw === '')
    return { id: fallbackComboId() }

  const n = Number(raw)
  if (Number.isInteger(n) && n >= 1 && n <= COMBO_COUNT)
    return { id: n }

  return { id: fallbackComboId(), rejected: String(raw) }
}

function resolveSize(raw: unknown): ComboSize | undefined {
  const n = Number(raw)
  return COMBO_SIZES.find(size => size === n)
}

function resolveQuery(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw !== '' ? raw : undefined
}

/**
 * A repeated param (`?q=a&q=b`) arrives as an array. The first one wins, the
 * same answer `URLSearchParams.get` gives, so a hand-edited URL degrades to one
 * reading rather than to none.
 */
export function firstValue(raw: unknown): unknown {
  return Array.isArray(raw) ? raw[0] : raw
}

/**
 * Validate and default the raw query — synchronously, on every read, so the
 * theme is a function of the URL from the first frame (ADR 0004 §7).
 */
export function validateHubSearch(input: Record<string, unknown>): HubSearch {
  return {
    c: resolveComboId(firstValue(input.c)).id,
    q: resolveQuery(firstValue(input.q)),
    size: resolveSize(firstValue(input.size)),
  }
}

/**
 * The query a `HubSearch` serialises to. Absent params are left out rather than
 * written empty, to keep the URL clean, and the order is fixed so a shared link
 * always reads `?c=…&q=…&size=…`.
 */
export function toHubQuery(search: HubSearch): LocationQueryRaw {
  return {
    c: String(search.c),
    ...(search.q !== undefined && { q: search.q }),
    ...(search.size !== undefined && { size: String(search.size) }),
  }
}

/**
 * Carry the whole param set across a navigation unchanged — what every
 * cross-route `<RouterLink>` passes through `toHubQuery`.
 *
 * `c` is required in the schema (exactly one combo is always selected), so a
 * link cannot silently drop it: TypeScript makes carrying the params the
 * explicit act rather than the forgettable one.
 */
export function carryHubSearch(prev: Partial<HubSearch>): HubSearch {
  return {
    c: resolveComboId(prev.c).id,
    q: prev.q,
    size: prev.size,
  }
}
