import { COMBO_COUNT } from '../data/combos'

/**
 * Combo sizes the catalogue actually contains — 120 pairs, 120 triples,
 * 108 quads (ADR 0004 §4).
 */
export const COMBO_SIZES = [2, 3, 4] as const
export type ComboSize = typeof COMBO_SIZES[number]

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
 * Validators are not called once: StrictMode double-invokes them, and TanStack
 * re-validates whenever *any* search param changes. A bare `Math.random()` here
 * would hand back a different combo on each call and the site would re-theme
 * itself as the user typed in the search box (ADR 0005 §6). Memoising makes the
 * validator pure with respect to the document: a reload picks a new combo, a
 * re-validation cannot.
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
 * Validate and default the search params during route matching — synchronously,
 * not in an async loader, so the theme is a function of the URL from the first
 * frame (ADR 0004 §7).
 */
export function validateHubSearch(input: Record<string, unknown>): HubSearch {
  return {
    c: resolveComboId(input.c).id,
    q: resolveQuery(input.q),
    size: resolveSize(input.size),
  }
}

/**
 * Carry the whole param set across a navigation unchanged — the reducer every
 * `<Link>` passes as its `search`.
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
