import type { ComboScale, RoleName } from './scale'
import { describe, expect, it } from 'vitest'
import { COMBOS, requireCombo } from '../data/combos'
import { adapt, assignRoles, comboMode } from '../theme/adapt'
import { hexToOklch } from '../theme/colour'
import { buildScale, colourValue, STEPS, TARGET_Y } from './scale'

describe('buildScale', () => {
  it('is memoised per combo', () => {
    const combo = requireCombo(1)
    expect(buildScale(combo)).toBe(buildScale(combo))
  })

  it('has one ramp per colour, in combo order, and eleven steps in each', () => {
    const combo = requireCombo(241)
    const scale = buildScale(combo)
    expect(scale.ramps.map(r => r.name)).toEqual(combo.colours.map(c => c.name))
    for (const ramp of [...scale.ramps, scale.neutral])
      expect(Object.keys(ramp.steps).map(Number)).toEqual([...STEPS])
  })

  it('marks the canonical mode and ranks accents the way the adapter does', () => {
    for (const combo of COMBOS) {
      const scale = buildScale(combo)
      expect(scale.canonicalMode).toBe(comboMode(combo))
      expect(scale.accents).toEqual(assignRoles(combo).accents)
    }
  })

  it('exports the adapter\'s exact role values for both modes (ADR 0012 §9)', () => {
    for (const combo of COMBOS) {
      const scale = buildScale(combo)
      for (const mode of ['light', 'dark'] as const) {
        const roles = adapt(combo, mode).roles
        expect(Object.keys(scale.semantic[mode]).sort()).toEqual(Object.keys(roles).sort())
        for (const [name, role] of Object.entries(roles))
          expect(scale.semantic[mode][name as RoleName]?.hex).toBe(role.hex)
      }
    }
  })

  it('renders a true-grey neutral when no colour can carry a hue (#69)', () => {
    const { neutral } = buildScale(requireCombo(69))
    for (const step of STEPS)
      expect(neutral.steps[step].oklch[1]).toBe(0)
  })

  it('keeps every tinted neutral at or below 0.03 chroma', () => {
    const worst = Math.max(...COMBOS.flatMap(c =>
      STEPS.map(s => hexToOklch(buildScale(c).neutral.steps[s].hex).c)))
    // Measured on the emitted hex, so 8-bit rounding may add a hair.
    expect(worst).toBeLessThan(0.0305)
  })
})

describe('lightness curve (ADR 0012 §3)', () => {
  it('matches the ADR\'s luminance targets', () => {
    expect(TARGET_Y.map(y => y.toFixed(3))).toEqual(
      ['0.980', '0.822', '0.574', '0.397', '0.270', '0.179', '0.114', '0.068', '0.034', '0.010', '0.001'],
    )
  })

  it('lands anchors where the ADR measured them', () => {
    const histogram = STEPS.map(step =>
      COMBOS.flatMap(c => buildScale(c).ramps).filter(r => r.anchor === step).length)
    expect(histogram).toEqual([1, 92, 178, 193, 135, 135, 96, 114, 50, 38, 0])
  })
})

describe('colourValue', () => {
  it('describes one 8-bit colour three ways', () => {
    expect(colourValue('#d96629')).toEqual({ hex: '#d96629', oklch: [0.6406, 0.1612, 45.11], rgb: [217, 102, 41] })
  })

  it('reports a grey\'s hue as 0', () => {
    expect(colourValue('#808080').oklch).toEqual([0.5999, 0, 0])
  })
})

describe('naming (ADR 0012 §8)', () => {
  // Every custom-property name an export can emit, without the `--cc-` prefix.
  const colourNames = new Set(COMBOS.flatMap(c => buildScale(c).ramps.flatMap(r => [r.slug, ...STEPS.map(s => `${r.slug}-${s}`)])))
  const roleNames = new Set(COMBOS.flatMap((c) => {
    const scale = buildScale(c)
    const rampNames = ['neutral', ...scale.accents.map((_, rank) => rank === 0 ? 'accent' : `accent-${rank + 1}`)]
    return [
      ...rampNames.flatMap(base => STEPS.map(s => `${base}-${s}`)),
      ...Object.keys(scale.semantic.light),
      ...Object.keys(scale.semantic.dark),
    ]
  }))

  it('keeps colour slugs and role names disjoint', () => {
    expect([...colourNames].filter(n => roleNames.has(n))).toEqual([])
  })

  it('maps each slug to exactly one hex across the catalogue', () => {
    const bySlug = new Map<string, Set<string>>()
    for (const c of COMBOS) {
      for (const r of buildScale(c).ramps)
        bySlug.set(r.slug, (bySlug.get(r.slug) ?? new Set()).add(r.steps[r.anchor].hex))
    }
    expect([...bySlug].filter(([, hexes]) => hexes.size > 1).map(([slug]) => slug)).toEqual([])
  })
})

describe('snapshots — so a curve change is visible in review', () => {
  // A pair, a triple, a quad, the hue-source special case (#55: Old Rose +
  // White) and the true-grey neutral (#69).
  // Hex only: `oklch` and `rgb` are functions of it, and one line per ramp
  // keeps a curve change readable in a diff.
  const digest = (scale: ComboScale) => ({
    canonicalMode: scale.canonicalMode,
    accents: scale.accents,
    ramps: [...scale.ramps, scale.neutral].map(r =>
      `${r.slug}${'anchor' in r ? `@${r.anchor}` : ''}: ${STEPS.map(s => r.steps[s].hex).join(' ')}`),
    semantic: Object.fromEntries((['light', 'dark'] as const).map(mode =>
      [mode, Object.entries(scale.semantic[mode]).map(([name, v]) => `${name} ${v.hex}`)])),
  })

  it.each([1, 55, 69, 121, 241])('combo #%i', (id) => {
    expect(digest(buildScale(requireCombo(id)))).toMatchSnapshot()
  })
})
