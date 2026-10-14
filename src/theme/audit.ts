// Checks a palette against the contract in `roles.ts`. `adapt.sweep.test.ts`
// runs it over the catalogue.

import type { Palette } from './adapt'
import { contrast } from './colour'
import { contrastPairs } from './roles'

export interface AuditRow {
  pair: string
  ratio: number
  target: number
  pass: boolean
}

/** Float noise allowed under a target. */
const EPSILON = 0.005

/** Every promised pairing, checked. */
export function auditPalette(palette: Palette): AuditRow[] {
  const { roles } = palette
  return contrastPairs(palette.assignment.accents.length).map(({ fg, bg, target }) => {
    const ratio = contrast(roles[fg].hex, roles[bg].hex)
    return { pair: `${fg} / ${bg}`, ratio, target, pass: ratio >= target - EPSILON }
  })
}
