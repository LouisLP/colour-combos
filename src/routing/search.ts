import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { HueFamily } from '../data/hue'
import { COMBO_COUNT } from '../data/combos'
import { HUE_FAMILIES } from '../data/hue'

/** Everything the URL says (ADR 0015). Absent, never empty, to keep links clean. */
export interface HubSearch {
  /** Free-text search. */
  q?: string
  /** Hue-family filter. */
  hue?: HueFamily
  /** The combo whose details dialog is open, if any. */
  c?: number
}

/** A valid combo id, or nothing, so `?c=999` opens no dialog. */
export function resolveComboId(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === '')
    return undefined
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= COMBO_COUNT ? n : undefined
}

/** First value of a repeated param, like `URLSearchParams.get`. */
export function firstValue(raw: unknown): unknown {
  return Array.isArray(raw) ? raw[0] : raw
}

/** Validate the raw query. A hand-edited `?hue=teal` degrades to no filter. */
export function validateHubSearch(query: LocationQuery | Record<string, unknown>): HubSearch {
  const q = firstValue(query.q)
  const hue = firstValue(query.hue)
  return {
    q: typeof q === 'string' && q !== '' ? q : undefined,
    hue: HUE_FAMILIES.find(family => family === hue),
    c: resolveComboId(firstValue(query.c)),
  }
}

/** A `HubSearch` as a query, always in `?q=…&hue=…&c=…` order. */
export function toHubQuery(search: HubSearch): LocationQueryRaw {
  return {
    ...(search.q !== undefined && { q: search.q }),
    ...(search.hue !== undefined && { hue: search.hue }),
    ...(search.c !== undefined && { c: String(search.c) }),
  }
}
