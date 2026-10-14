// @vitest-environment jsdom
//
// The identity band (ADR 0009) is shared chrome that reads the active combo from
// the URL. This mounts the real route tree and checks that the band names the
// URL's combo with its raw colours, and — since the band's job is to make the
// selected combo obvious across the chrome — that the header marks the active
// route the accent underline hangs off.

import { afterEach, describe, expect, it } from 'vitest'
import { comboLabel, COMBOS } from '../data/combos'
import { mountHub } from '../test/mountHub'

async function mount(initial: string) {
  const view = await mountHub(initial)
  return {
    ...view,
    hero: () => view.container.querySelector<HTMLElement>('.combo-hero')!,
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

    expect(hero.querySelector('.combo-hero-id')!.textContent!.trim()).toBe('Combination No. 1')
    expect(hero.querySelector('.combo-hero-names')!.textContent!.trim()).toBe(comboLabel(combo))

    // One raw swatch per colour, each painted its own value — shown as itself,
    // never a role (the swatches-are-sacred contract). jsdom serialises the hex
    // to `rgb()`, so this checks each cell carries a background rather than the
    // exact string; raw-hex fidelity is covered where the value is read back.
    const swatches = [...hero.querySelectorAll<HTMLElement>('.combo-hero-swatches i')]
    expect(swatches).toHaveLength(combo.colours.length)
    for (const swatch of swatches)
      expect(swatch.style.background).not.toBe('')

    view.unmount()
  })

  it('tracks the selected combo as the URL changes', async () => {
    const view = await mount('/?c=200')

    expect(view.hero().querySelector('.combo-hero-id')!.textContent!.trim()).toBe('Combination No. 200')

    await view.router.push({ query: { c: '201' } })
    expect(view.hero().querySelector('.combo-hero-id')!.textContent!.trim()).toBe('Combination No. 201')

    view.unmount()
  })

  it('marks the active route so the accent underline has something to hang off', async () => {
    const view = await mount('/?c=1')
    const active = document.querySelectorAll('header nav a[aria-current="page"]')

    expect(active).toHaveLength(1)
    expect(active[0].textContent!.trim()).toBe('Browse')

    view.unmount()
  })

  it('marks no card as the current page except the selected one', async () => {
    const view = await mount('/?c=1')
    const current = view.container.querySelectorAll('.combo-card a[aria-current]')

    // The router ignores the query when matching, so without an explicit
    // override every card's query-only link would claim to be the page.
    expect(current).toHaveLength(1)
    expect(current[0].getAttribute('aria-current')).toBe('true')

    view.unmount()
  })
})
