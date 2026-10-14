// @vitest-environment jsdom
//
// A code block is part of the page, so it is part of the page's AA promise.
// The colours are Shiki's, not the adapter's, so the catalogue sweep cannot see
// them: this highlights what the page actually shows and measures every token
// colour against the block's own background, in both themes.

import type { CodeLang } from './highlight'
import { describe, expect, it } from 'vitest'
import { requireCombo } from '../data/combos'
import { emitCss, emitJs, emitScss, emitTailwind, emitTokens } from '../lib/emit'
import { COLOUR_FORMATS } from '../lib/format'
import { buildScale } from '../lib/scale'
import { contrast } from '../theme/colour'
import { highlight } from './highlight'

const scale = buildScale(requireCombo(241))

const BLOCKS: [CodeLang, string][] = COLOUR_FORMATS.flatMap(format => [
  ['css', emitCss(scale, { format })],
  ['css', emitTailwind(scale, { format })],
  ['scss', emitScss(scale, { format })],
] as [CodeLang, string][]).concat([
  ['json', emitTokens(scale)],
  ['ts', emitJs(scale)],
])

function parse(html: string) {
  return new DOMParser().parseFromString(html, 'text/html').querySelector('pre')!
}

/** Each block highlighted once, shared by every test below. */
let highlighted: Promise<string[]> | undefined
const highlightAll = () => highlighted ??= Promise.all(BLOCKS.map(([lang, code]) => highlight(code, lang)))

/** `--shiki-light:#abc` → `#abc`, for one theme. */
function themeColour(style: string, prop: string): string | undefined {
  return style.match(new RegExp(`${prop}:(#[0-9a-f]{6})`, 'i'))?.[1]
}

describe('highlight', () => {
  it('keeps every block\'s text byte for byte', async () => {
    const html = await highlightAll()
    BLOCKS.forEach(([lang, code], i) => expect(parse(html[i]!).textContent, `${i} ${lang}`).toBe(code))
  }, 20_000)

  it.each(['light', 'dark'] as const)('every token clears 4.5:1 on the %s background', async (theme) => {
    const failures: string[] = []
    const html = await highlightAll()
    for (const [i, [lang]] of BLOCKS.entries()) {
      const pre = parse(html[i]!)
      const bg = themeColour(pre.getAttribute('style')!, `--shiki-${theme}-bg`)!
      const fgs = new Set([pre, ...pre.querySelectorAll('span')].map(el =>
        themeColour(el.getAttribute('style') ?? '', `--shiki-${theme}`)).filter(Boolean) as string[])
      // Highlighted, not one plain colour: otherwise this proves nothing.
      expect(fgs.size, lang).toBeGreaterThan(2)
      for (const fg of fgs) {
        const ratio = contrast(fg, bg)
        if (ratio < 4.5)
          failures.push(`${lang} ${fg} on ${bg}: ${ratio.toFixed(2)}`)
      }
    }
    expect(failures).toEqual([])
  }, 20_000)
})
