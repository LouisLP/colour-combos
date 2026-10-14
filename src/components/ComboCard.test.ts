// @vitest-environment jsdom
//
// The per-swatch copy affordance (ADR 0007) is a fact about the card, the
// clipboard and the confirmation together, not visible in any pure function. So
// this mounts the real route tree, presses a chip, and checks what reached the
// clipboard and what the chip then says.

import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMBOS } from '../data/combos'
import { click, mountHub } from '../test/mountHub'

const writeText = vi.fn<(text: string) => Promise<void>>(async () => {})
vi.stubGlobal('navigator', { clipboard: { writeText } })

async function mount(initial: string) {
  const view = await mountHub(initial)
  return {
    ...view,
    /** The copy chips of the first card, in colour order. */
    chips: () => [...view.container.querySelectorAll<HTMLButtonElement>('.combo-card .combo-copy')],
  }
}

beforeEach(() => {
  // Only the timers the card uses: `flushPromises` rides `setImmediate`, which
  // has to stay real for a click's navigation to settle.
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] })
  writeText.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('a swatch copy chip', () => {
  it('offers one chip per colour, each naming the hex it will copy', async () => {
    // A shared link with no `q`/`size` so the grid is the whole catalogue and the
    // first card is combo 1, whose colours are known from the data.
    const view = await mount('/?c=1')
    const first = COMBOS.find(c => c.id === 1)!

    const labels = view.chips()
      .slice(0, first.colours.length)
      .map(chip => chip.getAttribute('aria-label'))

    for (const colour of first.colours)
      expect(labels).toContain(`Copy ${colour.name} ${colour.hex}`)

    view.unmount()
  })

  it('writes the swatch hex to the clipboard and confirms it', async () => {
    const view = await mount('/?c=1')
    const first = COMBOS.find(c => c.id === 1)!
    const chip = view.chips()[0]

    await click(chip)

    expect(writeText).toHaveBeenCalledWith(first.colours[0].hex)
    // The confirmation is the chip's own accessible name flipping to "Copied".
    expect(chip.getAttribute('aria-label')).toBe(`Copied ${first.colours[0].hex}`)

    view.unmount()
  })

  it('clears the confirmation after a moment', async () => {
    const view = await mount('/?c=1')
    const first = COMBOS.find(c => c.id === 1)!
    const chip = view.chips()[0]

    await click(chip)
    expect(chip.getAttribute('aria-label')).toBe(`Copied ${first.colours[0].hex}`)

    vi.advanceTimersByTime(1500)
    await flushPromises()

    expect(chip.getAttribute('aria-label')).toBe(`Copy ${first.colours[0].name} ${first.colours[0].hex}`)

    view.unmount()
  })
})
