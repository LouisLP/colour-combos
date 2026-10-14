// @vitest-environment jsdom
//
// The combo page (T6) is a fact about the route, the guard, the stores and the
// emitters together, so this mounts the real route tree and drives it.

import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { requireCombo } from '../data/combos'
import { formatColour } from '../lib/format'
import { buildScale } from '../lib/scale'
import { announcement } from '../state/announcer'
import { COLOUR_FORMAT_KEY, colourFormat, setColourFormat } from '../state/colourFormat'
import { click, mountHub } from '../test/mountHub'
import { CODE_TABS } from '../ui/codeTabs'

// Real Shiki is slow under jsdom, and `ui/highlight.test.ts` already proves its
// output keeps the text byte for byte. Here a stand-in that escapes and wraps
// the same way proves the page swaps it in and shows the right text.
vi.mock('../ui/highlight', () => ({
  highlight: async (code: string) => {
    const pre = document.createElement('pre')
    pre.className = 'shiki'
    pre.textContent = code
    return pre.outerHTML
  },
}))

const writeText = vi.fn<(text: string) => Promise<void>>(async () => {})
vi.stubGlobal('navigator', { clipboard: { writeText } })

const mounted: (() => void)[] = []

async function mount(initial: string) {
  const view = await mountHub(initial)
  mounted.push(view.unmount)
  const $ = <T extends Element = HTMLElement>(selector: string) => view.container.querySelector<T>(selector)
  const $$ = <T extends Element = HTMLElement>(selector: string) => [...view.container.querySelectorAll<T>(selector)]
  return {
    ...view,
    $,
    $$,
    path: () => view.router.currentRoute.value.fullPath,
    button: (label: string) => $$<HTMLButtonElement>('button').find(b => b.textContent?.trim() === label)!,
  }
}

async function press(key: string, target: Element = document.body) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  await flushPromises()
  return event
}

afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount()
  document.body.replaceChildren()
  writeText.mockClear()
  setColourFormat('hex')
  localStorage.clear()
})

describe('routing', () => {
  it('themes the site from the path, and writes no `c`', async () => {
    const page = await mount('/combo/42')
    expect(page.path()).toBe('/combo/42')
    expect(page.search().c).toBe(42)
    expect(page.$('h1')?.textContent).toContain('No. 42')
    // The page header stands in for the identity band.
    expect(page.$('.combo-hero')).toBeNull()
  })

  it('drops a `c` that would contradict the path', async () => {
    const page = await mount('/combo/42?c=7&q=blue')
    expect(page.path()).toBe('/combo/42?q=blue')
    expect(page.search().c).toBe(42)
  })

  it('redirects a legacy `?combo=` link, keeping the other params', async () => {
    const page = await mount('/?combo=42&c=7&size=3')
    expect(page.path()).toBe('/combo/42?size=3')
    expect(page.entries()).toBe(1)
  })

  it('resolves a bad id to a combo, and says so', async () => {
    const page = await mount('/combo/999')
    const shown = page.search().c
    expect(page.path()).toBe(`/combo/${shown}`)
    expect(page.$('.notice')?.textContent).toContain('999')
  })

  it('leaves browse selection on `?c=`', async () => {
    const page = await mount('/?c=42')
    expect(page.path()).toBe('/?c=42')
    expect(page.$('.combo-hero')).not.toBeNull()
  })
})

describe('prev / next', () => {
  it('steps with ← and →, wrapping at the ends, carrying the filters', async () => {
    const page = await mount('/combo/1?q=red')

    await press('ArrowRight')
    expect(page.path()).toBe('/combo/2?q=red')
    await press('ArrowLeft')
    await press('ArrowLeft')
    expect(page.path()).toBe('/combo/348?q=red')
    expect(page.entries()).toBe(4)
  })

  it('leaves the arrows to the code tabs while they hold focus', async () => {
    const page = await mount('/combo/10')
    const tab = page.$('[role="tab"]')!
    tab.focus()
    await press('ArrowRight', tab)
    expect(page.path()).toBe('/combo/10')
    expect(page.$('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe('Tailwind')
  })
})

describe('copying', () => {
  it('copies a scale step in the chosen notation, and says so', async () => {
    const page = await mount('/combo/241')
    const scale = buildScale(requireCombo(241))
    const ramp = scale.ramps[0]!

    await click(page.button('OKLCH'))
    expect(colourFormat.value).toBe('oklch')
    expect(localStorage.getItem(COLOUR_FORMAT_KEY)).toBe('oklch')

    const chip = page.$$<HTMLButtonElement>('.ramp-chip')[3]!
    await click(chip)
    const value = formatColour(ramp.steps[300], 'oklch')
    expect(writeText).toHaveBeenLastCalledWith(value)
    await vi.waitFor(() => expect(announcement.value).toBe(`Copied ${value}`))
    expect(page.$('.toast')?.textContent).toContain(value)
  })

  it('marks the anchor as the exact Wada colour', async () => {
    const page = await mount('/combo/241')
    const ramp = buildScale(requireCombo(241)).ramps[0]!
    const anchor = page.$$('.ramp')[0]!.querySelector('.is-anchor')!
    expect(anchor.getAttribute('aria-label')).toContain(`${ramp.anchor} (exact Wada colour) ${ramp.steps[ramp.anchor].hex}`)
    expect(ramp.steps[ramp.anchor].hex).toBe(requireCombo(241).colours[0]!.hex)
  })
})

describe('code blocks', () => {
  it.each(['hex', 'oklch', 'rgb'] as const)('byte-match the emitters in %s, highlighted or not', async (format) => {
    setColourFormat(format)
    const page = await mount('/combo/241')
    const scale = buildScale(requireCombo(241))

    for (const tab of CODE_TABS) {
      await click(page.$$<HTMLButtonElement>('[role="tab"]').find(b => b.textContent?.trim() === tab.label)!)
      const expected = tab.code(scale, format)
      expect(page.$('[data-code]')?.textContent, tab.id).toBe(expected)
      // The highlighter lands asynchronously; its output must be the same text.
      await vi.waitFor(() => expect(page.$('.code-shiki')).not.toBeNull(), { timeout: 5000 })
      expect(page.$('[data-code]')?.textContent, `${tab.id} highlighted`).toBe(expected)
      expect(page.$('.code-install code')?.textContent).toBe(tab.install(241))
    }
  }, 20_000)

  it('copies the whole block', async () => {
    const page = await mount('/combo/241')
    await click(page.button('Copy'))
    expect(writeText).toHaveBeenLastCalledWith(CODE_TABS[0]!.code(buildScale(requireCombo(241)), 'hex'))
  })
})
