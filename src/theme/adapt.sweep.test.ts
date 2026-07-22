// The AA guarantee, locked in. Ported from `prototypes/adaptation-model/sweep.ts`
// per ADR 0002 — the prototype proved 0 failures over 348 combos x 2 modes x 13
// pairings, and this runs the same proof against the shipping adapter so a tweak
// to the derivation ladder cannot silently regress contrast.
//
// The pairing set is wider than the prototype's 13: `auditPalette` also checks
// the accent fills against `surface-muted`, without which the sweep cannot see
// the regression ADR 0002 §4 exists to prevent.

import { describe, expect, it } from 'vitest'
import { COMBOS } from '../data/combos'
import { adapt } from './adapt'
import { auditPalette } from './audit'
import { hexToOklch } from './colour'

const MODES = ['light', 'dark'] as const

/** Every (combo, mode) rendering in the catalogue, derived once. */
const RENDERINGS = COMBOS.flatMap(combo =>
  MODES.map(mode => ({ combo, mode, palette: adapt(combo, mode) })),
)

describe('aA gate — WCAG 2.2 across the whole catalogue', () => {
  it('sweeps the full catalogue in both modes', () => {
    expect(COMBOS).toHaveLength(348)
    expect(RENDERINGS).toHaveLength(696)
  })

  it('has no failing pairing in any rendering', () => {
    const failures = RENDERINGS.flatMap(({ combo, mode, palette }) =>
      auditPalette(palette)
        .filter(row => !row.pass)
        .map(row => `#${combo.id}/${mode} ${row.pair} ${row.ratio.toFixed(2)} < ${row.target}`),
    )

    // Listed in full rather than counted: if this ever breaks, the failing
    // pairings are the whole diagnosis.
    expect(failures).toEqual([])
  })

  it('never hits the lightness rail without reaching its target', () => {
    const unreached = RENDERINGS.flatMap(({ combo, mode, palette }) =>
      Object.entries(palette.roles)
        .filter(([, role]) => role.reached === false)
        .map(([name]) => `#${combo.id}/${mode} ${name}`),
    )

    expect(unreached).toEqual([])
  })
})

describe('drift budget — regression signal, not a gate', () => {
  // ADR 0002 measured these on variant C. The bounds below sit deliberately
  // clear of the measured values: they are meant to catch a derivation change
  // that makes the catalogue visibly duller or draggier, not to freeze the
  // numbers. Moving a bound is a legitimate edit — silently blowing past one
  // is what this is here to prevent.
  const accents = RENDERINGS.map(r => r.palette.roles.accent)

  it('keeps mean accent lightness drift low (measured 0.052)', () => {
    const mean = accents.reduce((s, a) => s + (a.shifted ?? 0), 0) / accents.length
    expect(mean).toBeLessThan(0.07)
  })

  it('rarely drags the accent far enough to lose its identity (measured 8.5%)', () => {
    const dragged = accents.filter(a => (a.shifted ?? 0) > 0.2).length
    expect(dragged / accents.length).toBeLessThan(0.12)
  })

  it('leaves most accents at their published Wada lightness (measured 62%)', () => {
    const untouched = accents.filter(a => (a.shifted ?? 1) === 0).length
    expect(untouched / accents.length).toBeGreaterThan(0.55)
  })

  it('yields a colourful UI (mean accent chroma, measured 0.138)', () => {
    const mean = accents.reduce((s, a) => s + hexToOklch(a.hex).c, 0) / accents.length
    expect(mean).toBeGreaterThan(0.12)
  })
})

describe('role assignment', () => {
  it('fills every accent slot the combo can support', () => {
    for (const { combo, palette } of RENDERINGS) {
      expect(palette.accentColours).toHaveLength(Math.min(3, combo.colours.length))
      expect(palette.roles.accent).toBeDefined()
    }
  })

  it('is invariant across modes', () => {
    for (const combo of COMBOS) {
      const light = adapt(combo, 'light').assignment
      const dark = adapt(combo, 'dark').assignment
      expect(light).toEqual(dark)
    }
  })
})
