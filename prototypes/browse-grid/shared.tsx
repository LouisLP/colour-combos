// PROTOTYPE — throwaway. The only things the three variants share: the star
// glyph and the props they all take. Deliberately NOT a shared layout —
// each variant is free to throw the page structure out.

import type { Combo, ComboColour } from '../adaptation-model/adapt.ts'
import { VARIANTS } from '../adaptation-model/adapt.ts'

export interface VariantProps {
  /** The filtered, ordered list to render. */
  list: Combo[]
  /** Full catalogue, for facet counts. */
  all: Combo[]
  selected: number
  onSelect: (id: number) => void
  favs: Set<number>
  onFav: (id: number) => void
  q: string
  onQ: (q: string) => void
  size: number | null
  onSize: (size: number | null) => void
  fav: boolean
  onFavFilter: (on: boolean) => void
}

export function StarIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
      <path
        d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.2 6.7L12 17.8 6.1 20.9l1.2-6.7L2.5 9.5l6.6-.9z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Colour names, joined — the closest thing a combo has to a name. */
export function comboLabel(combo: Combo) {
  return combo.colours.map(c => c.name).join(' · ')
}

export interface Band { colour: ComboColour, share: number }

const bandCache = new Map<number, Band[]>()

/**
 * Proportional bands, ordered and weighted by the ADR 0002 variant-C accent
 * ranking — so the band that dominates a tile is the colour that would
 * dominate the theme if you picked it. Rank 1 takes half; the rest split the
 * remainder, halving each step.
 */
export function bands(combo: Combo): Band[] {
  const hit = bandCache.get(combo.id)
  if (hit)
    return hit
  const { accents } = VARIANTS.C.assign(combo)
  const weights = accents.map((_, i) => 1 / 2 ** i)
  const total = weights.reduce((a, b) => a + b, 0)
  const out = accents.map((idx, i) => ({
    colour: combo.colours[idx],
    share: weights[i] / total,
  }))
  bandCache.set(combo.id, out)
  return out
}
