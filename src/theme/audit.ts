// The contrast contract of ADR 0002 §5, expressed as checkable pairings.
//
// This is the machine-readable form of the promise the design system makes:
// every foreground role clears WCAG 2.2 AA against every surface it can legally
// land on. `adapt.sweep.test.ts` runs it over the whole catalogue in both modes.

import type { Palette } from './adapt'
import { contrast } from './colour'

export interface AuditRow {
  pair: string
  ratio: number
  target: number
  pass: boolean
}

/** Ratios within this much of target count as passing (float noise, not slack). */
const EPSILON = 0.005

/**
 * Every pairing the token contract promises. Roles with no contrast promise
 * (`--border` as a decorative hairline) are deliberately absent.
 */
export function auditPalette(palette: Palette): AuditRow[] {
  const { roles } = palette
  const hex = (name: string) => roles[name].hex

  const pairs: [string, string, number][] = [
    ['ink', 'canvas', 4.5],
    ['ink', 'surface', 4.5],
    ['ink', 'surface-muted', 4.5],
    ['ink-muted', 'canvas', 4.5],
    ['ink-muted', 'surface-muted', 4.5],
    ['border-strong', 'canvas', 3],
    ['accent', 'canvas', 3],
    // The load-bearing one (ADR 0002 §4): an accent fill or link can land on a
    // muted card, so it must clear there, not merely on the canvas. Clamping
    // against the canvas alone failed 454/696 renderings on this pairing.
    ['accent', 'surface-muted', 3],
    ['accent-text', 'canvas', 4.5],
    ['accent-text', 'surface-muted', 4.5],
    ['on-accent', 'accent', 4.5],
  ]

  if (roles['accent-2']) {
    pairs.push(
      ['accent-2', 'canvas', 3],
      ['accent-2', 'surface-muted', 3],
      ['accent-2-text', 'canvas', 4.5],
      ['accent-2-text', 'surface-muted', 4.5],
      ['on-accent-2', 'accent-2', 4.5],
    )
  }

  return pairs.map(([fg, bg, target]) => {
    const ratio = contrast(hex(fg), hex(bg))
    return { pair: `${fg} / ${bg}`, ratio, target, pass: ratio >= target - EPSILON }
  })
}
