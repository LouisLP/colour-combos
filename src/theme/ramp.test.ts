// The neutral ramp lives in CSS and the AA sweep audits TypeScript, so the two
// have to be the same ladder. This test is the joint.
//
// It holds only because the neutral steps are *points on the ladder* — none of
// them is a contrast search — which is asserted below over the whole catalogue.
// The moment a neutral starts clamping, relative colour can no longer express
// it and it has to move into `paletteToCss` alongside `--border-strong`.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { COMBOS } from '../data/combos'
import { adapt, LADDER, TINT, TINT_CAP, TINT_FLOOR } from './adapt'

// Read as text, not imported: Vitest hands a CSS import back empty, and it is
// the authored stylesheet this test is checking.
const CSS = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8')

interface Step {
  /** Lightness in each mode, as the adapter states it. */
  l: [number, number]
  frac: number
  cap: number
  floor: number
}

const STEPS: Record<string, Step> = {
  'canvas': { l: [LADDER.light.canvas, LADDER.dark.canvas], frac: TINT.canvas, cap: TINT_CAP.canvas, floor: TINT_CAP.canvas * TINT_FLOOR },
  'surface': { l: [LADDER.light.surface, LADDER.dark.surface], frac: TINT.surface, cap: TINT_CAP.surface, floor: TINT_CAP.surface * TINT_FLOOR },
  'surface-muted': { l: [LADDER.light.muted, LADDER.dark.muted], frac: TINT.muted, cap: TINT_CAP.muted, floor: TINT_CAP.muted * TINT_FLOOR },
  // Ink is the one step with no chroma floor (`derivePalette` computes `inkC`
  // with a bare `min`), so the stylesheet's lower bound must be 0.
  'ink': { l: [LADDER.light.ink, LADDER.dark.ink], frac: TINT.ink, cap: TINT_CAP.ink, floor: 0 },
  'ink-muted': { l: [LADDER.light.inkMuted, LADDER.dark.inkMuted], frac: TINT.ink, cap: TINT_CAP.ink, floor: 0 },
  'border': { l: [LADDER.light.border, LADDER.dark.border], frac: TINT.border, cap: TINT_CAP.border, floor: TINT_CAP.border * TINT_FLOOR },
}

/** The `--x: light-dark(oklch(from …), oklch(from …));` declaration for a role. */
function declaration(role: string): string {
  const match = CSS.match(new RegExp(`--${role}:\\s*light-dark\\(([\\s\\S]*?)\\);`))
  if (!match)
    throw new Error(`index.css declares no --${role} ramp`)
  return match[1]
}

function numbers(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)].map(m => Number(m[1]))
}

describe('the css neutral ramp matches the adapter ladder', () => {
  it.each(Object.entries(STEPS))('%s sits at the ladder lightness in both modes', (role, step) => {
    const lightness = numbers(declaration(role), /oklch\(from var\(--hue-source\) ([\d.]+)%/g)

    expect(lightness).toHaveLength(2)
    expect(lightness[0] / 100).toBeCloseTo(step.l[0], 6)
    expect(lightness[1] / 100).toBeCloseTo(step.l[1], 6)
  })

  it.each(Object.entries(STEPS))('%s tints by the adapter floor, fraction and cap', (role, step) => {
    const decl = declaration(role)
    const floors = numbers(decl, /clamp\(calc\(([\d.]+) \* var\(--tint-scale\)\)/g)
    const fracs = numbers(decl, /calc\(c \* ([\d.]+) \* var\(--tint-scale\)\)/g)
    const caps = numbers(decl, /, calc\(([\d.]+) \* var\(--tint-scale\)\)\) h\)/g)

    // Both modes, and both stating the same chroma rule.
    expect([floors, fracs, caps].map(xs => xs.length)).toEqual([2, 2, 2])
    for (const [a, b] of [floors, fracs, caps])
      expect(a).toBe(b)

    expect(floors[0]).toBeCloseTo(step.floor, 6)
    expect(fracs[0]).toBeCloseTo(step.frac, 6)
    expect(caps[0]).toBeCloseTo(step.cap, 6)
  })

  it('never lets a neutral drift from its ladder point', () => {
    // If this fails, the CSS above is a lie for those combos: the browser would
    // render the ladder value while the sweep audited the clamped one.
    const clamped = COMBOS.flatMap(combo =>
      (['light', 'dark'] as const).flatMap(mode =>
        Object.keys(STEPS)
          .filter(role => (adapt(combo, mode).roles[role].shifted ?? 0) > 0)
          .map(role => `#${combo.id}/${mode} ${role}`),
      ),
    )

    expect(clamped).toEqual([])
  })

  it('leaves the ramp achromatic until a combo is selected', () => {
    // The token baseline of ADR 0001 §6 is the ramp itself, at zero tint.
    expect(CSS).toMatch(/--tint-scale:\s*0;/)
    expect(CSS).toMatch(/--hue-source:\s*#[0-9a-f]{6};/)
  })
})
