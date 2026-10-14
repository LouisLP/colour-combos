// @vitest-environment jsdom
//
// A code block is part of the page, so it is part of the page's AA promise.
// The colours are Shiki's, not the adapter's, so the catalogue sweep cannot see
// them: this highlights what the page actually shows and measures every token
// colour against the block's own background.

import type { CodeLang } from './highlight'
import { describe, expect, it } from 'vitest'
import { requireCombo } from '../data/combos'
import { emitCss, emitJs, emitScss, emitTailwind, emitTokens } from '../lib/emit'
import { buildScale } from '../lib/scale'
import { contrast } from '../theme/colour'
import { highlight } from './highlight'

const scale = buildScale(requireCombo(241))

const BLOCKS: [CodeLang, string][] = [
  ['css', emitCss(scale)],
  ['css', emitTailwind(scale)],
  ['scss', emitScss(scale)],
  ['json', emitTokens(scale)],
  ['ts', emitJs(scale)],
]

function parse(html: string) {
  return new DOMParser().parseFromString(html, 'text/html').querySelector('pre')!
}

/** Each block highlighted once, shared by every test below. */
let highlighted: Promise<string[]> | undefined
const highlightAll = () => highlighted ??= Promise.all(BLOCKS.map(([lang, code]) => highlight(code, lang)))

/** `color:#abc` → `#abc`. Anchored, so `background-color` is not read as `color`. */
function styleColour(style: string, prop: string): string | undefined {
  return style.match(new RegExp(`(?:^|;)\\s*${prop}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
}

describe('highlight', () => {
  it('keeps every block\'s text byte for byte', async () => {
    const html = await highlightAll()
    BLOCKS.forEach(([lang, code], i) => expect(parse(html[i]!).textContent, `${i} ${lang}`).toBe(code))
  }, 20_000)

  it('every token clears 4.5:1 on the background', async () => {
    const failures: string[] = []
    const html = await highlightAll()
    for (const [i, [lang]] of BLOCKS.entries()) {
      const pre = parse(html[i]!)
      const bg = styleColour(pre.getAttribute('style')!, 'background-color')!
      const fgs = new Set([pre, ...pre.querySelectorAll('span')].map(el =>
        styleColour(el.getAttribute('style') ?? '', 'color')).filter(Boolean) as string[])
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
