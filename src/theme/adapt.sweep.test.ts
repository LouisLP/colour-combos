// The AA guarantee (ADR 0002), run on the shipping adapter so a derivation
// tweak can't quietly regress contrast. `auditPalette` also checks accent fills
// on `surface-muted`, the regression ADR 0002 §4 exists to prevent.

import { describe, expect, it } from 'vitest'
import { COMBOS } from '../data/combos'
import { adapt, comboMode } from './adapt'
import { auditPalette } from './audit'
import { contrast, hexToOklch } from './colour'

/** Every combo in its canonical mode (ADR 0008). */
const RENDERINGS = COMBOS.map((combo) => {
  const mode = comboMode(combo)
  return { combo, mode, palette: adapt(combo, mode) }
})

describe('aA gate — WCAG 2.2 across the whole catalogue', () => {
  it('sweeps the full catalogue, one canonical mode per combo', () => {
    expect(COMBOS).toHaveLength(348)
    expect(RENDERINGS).toHaveLength(348)
  })

  it('has no failing pairing in any rendering', () => {
    const failures = RENDERINGS.flatMap(({ combo, mode, palette }) =>
      auditPalette(palette)
        .filter(row => !row.pass)
        .map(row => `#${combo.id}/${mode} ${row.pair} ${row.ratio.toFixed(2)} < ${row.target}`),
    )

    // Listed in full, so a failure is its own diagnosis.
    expect(failures).toEqual([])
  })

  // The dialog shows both modes, so the other one holds the same contract.
  it('has no failing pairing in the non-canonical mode either', () => {
    const failures = COMBOS.flatMap((combo) => {
      const mode = comboMode(combo) === 'light' ? 'dark' : 'light'
      return auditPalette(adapt(combo, mode))
        .filter(row => !row.pass)
        .map(row => `#${combo.id}/${mode} ${row.pair} ${row.ratio.toFixed(2)} < ${row.target}`)
    })

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
  // Measured on canonical renderings (ADR 0008). The bounds sit clear of the
  // measurements: they catch a visibly duller catalogue, not freeze numbers.
  // Moving one on purpose is fine.
  const accents = RENDERINGS.map(r => r.palette.roles.accent)

  it('keeps mean accent lightness drift low (measured 0.077)', () => {
    const mean = accents.reduce((s, a) => s + (a.shifted ?? 0), 0) / accents.length
    expect(mean).toBeLessThan(0.10)
  })

  it('rarely drags the accent far enough to lose its identity (measured 13.8%)', () => {
    const dragged = accents.filter(a => (a.shifted ?? 0) > 0.2).length
    expect(dragged / accents.length).toBeLessThan(0.18)
  })

  it('leaves most accents at their published Wada lightness (measured 47.7%)', () => {
    const untouched = accents.filter(a => (a.shifted ?? 1) === 0).length
    expect(untouched / accents.length).toBeGreaterThan(0.42)
  })

  it('yields a colourful UI (mean accent chroma, measured 0.136)', () => {
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

describe('worst surface', () => {
  // The audit only clamps against `--surface-muted`, which is safe only if it's
  // the worst surface. Check that instead of assuming it.
  const FOREGROUNDS = ['ink', 'ink-muted', 'border-strong', 'accent', 'accent-text']
  const OTHER_SURFACES = ['canvas', 'surface']

  it('is surface-muted, in every rendering in the catalogue', () => {
    const worse = RENDERINGS.flatMap(({ combo, mode, palette }) =>
      FOREGROUNDS.flatMap((fg) => {
        const floor = contrast(palette.roles[fg].hex, palette.roles['surface-muted'].hex)
        return OTHER_SURFACES
          .map(bg => ({ bg, ratio: contrast(palette.roles[fg].hex, palette.roles[bg].hex) }))
          .filter(({ ratio }) => ratio < floor - 0.005)
          .map(({ bg, ratio }) => `#${combo.id}/${mode} ${fg} on ${bg} ${ratio.toFixed(2)} < muted ${floor.toFixed(2)}`)
      }),
    )

    expect(worse).toEqual([])
  })
})
