// @vitest-environment jsdom
//
// The per-swatch copy affordance (ADR 0007) is a fact about the card, the
// clipboard and the confirmation together, not visible in any pure function. So
// this mounts the real route tree, presses a chip, and checks what reached the
// clipboard and what the chip then says.

import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMBOS } from '../data/combos'
import { routeTree } from '../routing/router'

// jsdom ships no `matchMedia`, and the mode store attaches its listener at
// import time (ADR 0005 §4). `vi.hoisted` runs before the module graph is
// evaluated, which is the only window in which this can be provided.
vi.hoisted(() => {
  globalThis.matchMedia ??= (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof matchMedia
})

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const writeText = vi.fn<(text: string) => Promise<void>>(async () => {})
vi.stubGlobal('navigator', { clipboard: { writeText } })

async function mount(initial: string) {
  const history = createMemoryHistory({ initialEntries: [initial] })
  const router = createRouter({ routeTree, history })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(<RouterProvider router={router} />)
  })

  return {
    container,
    /** The copy chips of the first card, in colour order. */
    chips: () => [...container.querySelectorAll<HTMLButtonElement>('.combo-card .combo-copy')],
    unmount: async () => {
      await act(async () => root.unmount())
      container.remove()
    },
  }
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
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

    await view.unmount()
  })

  it('writes the swatch hex to the clipboard and confirms it', async () => {
    const view = await mount('/?c=1')
    const first = COMBOS.find(c => c.id === 1)!
    const chip = view.chips()[0]

    await click(chip)

    expect(writeText).toHaveBeenCalledWith(first.colours[0].hex)
    // The confirmation is the chip's own accessible name flipping to "Copied".
    expect(chip.getAttribute('aria-label')).toBe(`Copied ${first.colours[0].hex}`)

    await view.unmount()
  })

  it('clears the confirmation after a moment', async () => {
    const view = await mount('/?c=1')
    const first = COMBOS.find(c => c.id === 1)!
    const chip = view.chips()[0]

    await click(chip)
    expect(chip.getAttribute('aria-label')).toBe(`Copied ${first.colours[0].hex}`)

    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    expect(chip.getAttribute('aria-label')).toBe(`Copy ${first.colours[0].name} ${first.colours[0].hex}`)

    await view.unmount()
  })
})
