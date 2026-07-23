// @vitest-environment jsdom
//
// The identity band (ADR 0009) is shared chrome that reads the active combo from
// the URL. This mounts the real route tree and checks that the band names the
// URL's combo with its raw colours, and — since the band's job is to make the
// selected combo obvious across the chrome — that the header marks the active
// route the accent underline hangs off.

import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { comboLabel, COMBOS } from '../data/combos'
import { routeTree } from '../routing/router'

vi.hoisted(() => {
  globalThis.matchMedia ??= (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof matchMedia
})

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

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
    hero: () => container.querySelector<HTMLElement>('.combo-hero')!,
    unmount: async () => {
      await act(async () => root.unmount())
      container.remove()
    },
  }
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('the identity band', () => {
  it('names the URL\'s combo and paints its raw colours', async () => {
    const view = await mount('/?c=1')
    const combo = COMBOS.find(c => c.id === 1)!
    const hero = view.hero()

    expect(hero.querySelector('.combo-hero-id')!.textContent).toBe('Combination No. 1')
    expect(hero.querySelector('.combo-hero-names')!.textContent).toBe(comboLabel(combo))

    // One raw swatch per colour, each painted its own value — shown as itself,
    // never a role (the swatches-are-sacred contract). jsdom serialises the hex
    // to `rgb()`, so this checks each cell carries a background rather than the
    // exact string; raw-hex fidelity is covered where the value is read back.
    const swatches = [...hero.querySelectorAll<HTMLElement>('.combo-hero-swatches i')]
    expect(swatches).toHaveLength(combo.colours.length)
    for (const swatch of swatches)
      expect(swatch.style.background).not.toBe('')

    await view.unmount()
  })

  it('tracks the selected combo as the URL changes', async () => {
    const view = await mount('/?c=200')

    expect(view.hero().querySelector('.combo-hero-id')!.textContent).toBe('Combination No. 200')

    await view.unmount()
  })

  it('marks the active route so the accent underline has something to hang off', async () => {
    const view = await mount('/?c=1')
    const active = document.querySelector('header nav a[aria-current="page"]')

    expect(active).not.toBeNull()
    expect(active!.textContent).toBe('Browse')

    await view.unmount()
  })
})
