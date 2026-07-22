import type { ReactNode } from 'react'
import type { Combo } from '../data/combos'
import { useSelectedCombo } from '../hooks/useSelectedCombo'
import { ComboCard } from './ComboCard'

interface ComboGridProps {
  /** The list to render. The route supplies it; the grid never filters. */
  combos: Combo[]
  /**
   * Copy for an empty list. The only thing `/` and `/favorites` differ on
   * (ADR 0003 §3, ADR 0006 consequences) — everything else is shared.
   */
  empty: ReactNode
}

/**
 * The browse surface, shared by `/` and `/favorites` unchanged.
 *
 * Not virtualised, deliberately: 348 cards is 5,248 nodes and a full re-render
 * costs single-digit milliseconds, so windowing would buy nothing and cost
 * scroll restoration and find-in-page (ADR 0006 §6). `content-visibility` on the
 * grid items does the work instead, and it is load-bearing for search feel on a
 * slow phone rather than a stray optimisation.
 */
export function ComboGrid({ combos, empty }: ComboGridProps) {
  const selected = useSelectedCombo()

  // An empty result is a live surface, not a dead end (ADR 0006 §7).
  if (combos.length === 0)
    return <div className="combo-empty">{empty}</div>

  return (
    <ul className="combo-grid">
      {combos.map(combo => (
        <li key={combo.id}>
          <ComboCard combo={combo} selected={combo.id === selected.id} />
        </li>
      ))}
    </ul>
  )
}
