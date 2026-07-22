import { describe, expect, it } from 'vitest'
import { COMBOS, requireCombo } from '../data/combos'
import { adapt } from './adapt'
import { paletteToCss } from './tokens'

function declarations(css: string) {
  return Object.fromEntries(
    css.split(';').filter(Boolean).map((decl) => {
      const [name, value] = decl.split(':')
      return [name, value]
    }),
  )
}

/** A combo of each size, so the rank-filling rules are exercised for real. */
const BY_SIZE = [2, 3, 4].map(size => COMBOS.find(c => c.size === size)!)

describe('paletteToCss', () => {
  it('emits the hue source and nothing of the neutral ramp', () => {
    const css = declarations(paletteToCss(adapt(requireCombo(153), 'light')))

    expect(css['--hue-source']).toMatch(/^#[0-9a-f]{6}$/)
    // The ramp is CSS's job (ADR 0002 §6); emitting it here would fork it.
    for (const neutral of ['--canvas', '--surface', '--surface-muted', '--ink', '--ink-muted', '--border'])
      expect(css).not.toHaveProperty(neutral)
  })

  it('emits every clamped role, because CSS cannot search for contrast', () => {
    const css = declarations(paletteToCss(adapt(requireCombo(153), 'dark')))

    expect(Object.keys(css)).toEqual([
      '--hue-source',
      '--tint-scale',
      '--border-strong',
      '--accent',
      '--accent-text',
      '--on-accent',
      '--accent-2',
      '--accent-2-text',
      '--on-accent-2',
      '--accent-3',
      '--accent-3-text',
      '--on-accent-3',
    ])
  })

  it.each(BY_SIZE)('fills all three accent ranks for a $size-colour combo', (combo) => {
    const css = declarations(paletteToCss(adapt(combo, 'light')))

    for (const [name, value] of Object.entries(css)) {
      if (name !== '--tint-scale')
        expect(value, name).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('repeats a lower rank rather than leaving a slot empty', () => {
    const twoColour = BY_SIZE[0]
    const css = declarations(paletteToCss(adapt(twoColour, 'light')))

    // ADR 0002 §3: no combo renders a role empty. A 2-colour combo has no
    // rank-3 colour, so rank 3 repeats rank 2.
    expect(css['--accent-3']).toBe(css['--accent-2'])
    expect(css['--on-accent-3']).toBe(css['--on-accent-2'])
  })

  it('turns the tint off for the achromatic combo', () => {
    // Combo #69 (Warm Gray + Black): no colour clears the chroma floor, so the
    // site renders genuinely grey rather than with a fabricated hue.
    const achromatic = COMBOS.filter(c => !adapt(c, 'light').tinted)

    expect(achromatic.map(c => c.id)).toEqual([69])
    expect(declarations(paletteToCss(adapt(achromatic[0], 'light')))['--tint-scale']).toBe('0')
    expect(declarations(paletteToCss(adapt(requireCombo(153), 'light')))['--tint-scale']).toBe('1')
  })

  it('emits only machine-generated values, for every rendering', () => {
    const suspicious = COMBOS.flatMap(combo =>
      (['light', 'dark'] as const)
        .map(mode => paletteToCss(adapt(combo, mode)))
        .filter(css => !/^(?:--[\w-]+:(?:#[0-9a-f]{6}|[01]);)+$/.test(css)),
    )

    // The block is interpolated into a `<style>` tag unescaped, so its shape is
    // the safety argument (ADR 0005 §2).
    expect(suspicious).toEqual([])
  })
})
