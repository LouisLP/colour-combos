// ADR 0002 §5 as checkable pairs: every foreground clears AA on every surface it
// can land on. `adapt.sweep.test.ts` runs it over the catalogue.

import type { Palette } from './adapt'
import { contrast } from './colour'

export interface AuditRow {
  pair: string
  ratio: number
  target: number
  pass: boolean
}

/** Float noise allowed under a target. */
const EPSILON = 0.005

/** Every promised pairing. `--border` is decorative, so it's absent. */
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
    // The key one (ADR 0002 §4): accents can land on muted cards. Clamping on
    // the canvas alone failed 454/696 renderings here.
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
