// @vitest-environment jsdom
//
// Code blocks are part of the AA promise, but their colours are Shiki's, so the
// sweep can't see them. This measures every token against the block's bg.

import type { CodeLang } from './highlight'
import { describe, expect, it } from 'vitest'
import { requireCombo } from '../data/combos'
import { buildScale } from '../lib/scale'
import { contrast } from '../theme/colour'
import { CODE_TABS } from './codeTabs'
import { highlight } from './highlight'

const scale = buildScale(requireCombo(241))

const BLOCKS: [CodeLang, string][] = CODE_TABS.map(tab => [tab.lang, tab.code(scale)])

function parse(html: string) {
  return new DOMParser().parseFromString(html, 'text/html').querySelector('pre')!
}

/** Each block highlighted once, shared by every test below. */
let highlighted: Promise<string[]> | undefined
const highlightAll = () => highlighted ??= Promise.all(BLOCKS.map(([lang, code]) => highlight(code, lang)))

/** `color:#abc` → `#abc`, skipping `background-color`. */
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
