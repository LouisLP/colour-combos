import type { ComboScale } from '../scale'
import { describe, expect, it } from 'vitest'
import { emitCss, emitJs, emitScss, emitTailwind, emitTokens, emitTs, TOKENS_EXTENSION } from '.'
import { COMBOS, requireCombo } from '../../data/combos'
import { COLOUR_FORMATS, formatColour } from '../format'
import { buildScale, STEPS } from '../scale'

// A quad, so every accent rank and optional role is exercised.
const scale = buildScale(requireCombo(241))

/** `--x: value;` declarations of a CSS-like file, in order. */
function declarations(text: string, prefix: string): Map<string, string> {
  const re = new RegExp(`^\\s*${prefix.replace(/\$/g, '\\$')}([\\w-]+):\\s*(.+?);$`, 'gm')
  return new Map([...text.matchAll(re)].map(m => [m[1], m[2]]))
}

describe('emitCss', () => {
  const vars = declarations(emitCss(scale), '--cc-')

  it('emits every step of every ramp, with the anchor alias', () => {
    for (const ramp of scale.ramps) {
      for (const step of STEPS)
        expect(vars.get(`${ramp.slug}-${step}`)).toBe(ramp.steps[step].hex)
      expect(vars.get(ramp.slug)).toBe(`var(--cc-${ramp.slug}-${ramp.anchor})`)
    }
    for (const step of STEPS)
      expect(vars.get(`neutral-${step}`)).toBe(scale.neutral.steps[step].hex)
  })

  it('aliases the role ramps in accent rank order', () => {
    const top = scale.ramps[scale.accents[0]]
    expect(vars.get('accent-500')).toBe(`var(--cc-${top.slug}-500)`)
    const fourth = scale.ramps[scale.accents[3]]
    expect(vars.get('accent-4-50')).toBe(`var(--cc-${fourth.slug}-50)`)
  })

  it('pairs each semantic role across modes', () => {
    for (const [role, light] of Object.entries(scale.semantic.light))
      expect(vars.get(role)).toBe(`light-dark(${light.hex}, ${scale.semantic.dark[role as keyof typeof scale.semantic.dark]!.hex})`)
  })

  it('lets a data-theme subtree pick the mode', () => {
    expect(emitCss(scale)).toContain(`[data-theme='dark'] { color-scheme: dark; }`)
  })
})

describe('emitTailwind', () => {
  const text = emitTailwind(scale)
  const vars = declarations(text, '--color-cc-')

  it('is one @theme block', () => {
    expect(text.match(/@theme \{/g)).toHaveLength(1)
  })

  it('carries the same names and values as the CSS, all literal', () => {
    const css = declarations(emitCss(scale), '--cc-')
    expect([...vars.keys()]).toEqual([...css.keys()])
    for (const value of vars.values())
      expect(value).not.toContain('var(')
    expect(vars.get('accent-200')).toBe(scale.ramps[scale.accents[0]].steps[200].hex)
  })
})

describe('emitScss', () => {
  const text = emitScss(scale)
  const vars = declarations(text, '$cc-')

  it('names variables as the CSS names custom properties', () => {
    const css = declarations(emitCss(scale), '--cc-')
    for (const name of css.keys())
      expect(vars.has(name), name).toBe(true)
    expect(vars.get('canonical-mode')).toBe(scale.canonicalMode)
  })

  it('maps every ramp and both modes', () => {
    for (const base of [...scale.ramps.map(r => r.slug), 'neutral', 'accent', 'accent-4'])
      expect(text).toContain(`  '${base}': (`)
    expect(text).toContain(`    'canvas': ${scale.semantic.dark.canvas.hex},`)
  })
})

describe('colour formats', () => {
  const anchor = scale.ramps[0].steps[scale.ramps[0].anchor]

  it('spells one value three ways', () => {
    expect(formatColour(anchor, 'hex')).toBe(anchor.hex)
    expect(formatColour(anchor, 'oklch')).toMatch(/^oklch\(0\.\d+ \d\.\d+ [\d.]+\)$/)
    expect(formatColour(anchor, 'rgb')).toMatch(/^rgb\(\d{1,3} \d{1,3} \d{1,3}\)$/)
  })

  it.each([
    ['css', emitCss, '--cc-'],
    ['tailwind', emitTailwind, '--color-cc-'],
    ['scss', emitScss, '$cc-'],
  ] as const)('%s changes only how values are spelled', (_, emit, prefix) => {
    const hex = emit(scale)
    expect(emit(scale, { format: 'hex' })).toBe(hex)
    const names = [...declarations(hex, prefix).keys()]
    for (const format of COLOUR_FORMATS) {
      const text = emit(scale, { format })
      expect([...declarations(text, prefix).keys()]).toEqual(names)
      if (format !== 'hex')
        expect(text).not.toMatch(/#[0-9a-f]{6}/)
    }
    expect(emit(scale, { format: 'oklch' })).toContain(formatColour(anchor, 'oklch'))
  })
})

describe('emitTokens', () => {
  const doc = JSON.parse(emitTokens(scale))

  it('types every token as a colour and records the scale', () => {
    expect(doc.cc.$type).toBe('color')
    expect(doc.$extensions[TOKENS_EXTENSION]).toEqual({ id: 241, canonicalMode: scale.canonicalMode })
  })

  it('keeps the anchor and the exact hex', () => {
    const ramp = scale.ramps[0]
    expect(doc.cc[ramp.slug].$extensions[TOKENS_EXTENSION].anchor).toBe(ramp.anchor)
    expect(doc.cc[ramp.slug][ramp.anchor].$value).toBe(ramp.steps[ramp.anchor].hex)
  })

  it('aliases role ramps to colour tokens that exist', () => {
    for (const step of STEPS) {
      const ref = doc.cc['accent-2'][step].$value as string
      const [, slug, at] = ref.match(/^\{cc\.([\w-]+)\.(\d+)\}$/)!
      expect(doc.cc[slug][at].$value).toBe(scale.ramps[scale.accents[1]].steps[step].hex)
    }
  })

  it('splits the semantic layer by mode', () => {
    expect(doc.cc.semantic.light.ink.$value).toBe(scale.semantic.light.ink.hex)
    expect(doc.cc.semantic.dark.ink.$value).toBe(scale.semantic.dark.ink.hex)
  })
})

describe('emitTs / emitJs', () => {
  /** Evaluate a generated module's default export. */
  async function load(source: string): Promise<ComboScale> {
    const js = source.replace(/^import type .*$/m, '').replace(/: ComboScale =/, ' =')
    const mod = await import(/* @vite-ignore */ `data:text/javascript,${encodeURIComponent(js)}`)
    return mod.default
  }

  it.each([1, 55, 69, 121, 241])('round-trips combo #%i', async (id) => {
    const s = buildScale(requireCombo(id))
    expect(await load(emitTs(s))).toEqual(s)
    expect(await load(emitJs(s))).toEqual(s)
  })

  it('escapes Wada names with an apostrophe', async () => {
    const s = buildScale(COMBOS.find(c => c.colours.some(col => col.name.includes('\'')))!)
    expect(await load(emitJs(s))).toEqual(s)
  })

  it('types the TS module against the package', () => {
    expect(emitTs(scale)).toContain(`import type { ComboScale } from 'colour-combos'`)
    expect(emitTs(scale)).toContain('const scale: ComboScale = {')
  })
})

describe('snapshots — so a format change is visible in review', () => {
  const s = buildScale(requireCombo(1))
  it.each([
    ['css', emitCss],
    ['tailwind', emitTailwind],
    ['scss', emitScss],
    ['tokens', emitTokens],
    ['ts', emitTs],
  ] as const)('%s', (_, emit) => {
    expect(emit(s)).toMatchSnapshot()
  })
})
