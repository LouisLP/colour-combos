// @vitest-environment jsdom

import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { COMBO_COUNT } from '../data/combos'
import { click, mountHub } from '../test/mountHub'

let hub: Awaited<ReturnType<typeof mountHub>> | undefined
afterEach(() => {
  hub?.unmount()
  hub = undefined
  document.body.innerHTML = ''
})

const cards = () => [...document.querySelectorAll('.grid .card')]
const dialog = () => document.querySelector('[role="dialog"]')

async function settle() {
  await flushPromises()
  // Reka's presence waits a frame before unmounting a closed dialog.
  await new Promise(resolve => setTimeout(resolve, 20))
  await flushPromises()
}

describe('home page', () => {
  it('shows the whole catalogue with no dialog', async () => {
    hub = await mountHub('/')
    expect(cards()).toHaveLength(COMBO_COUNT)
    expect(dialog()).toBeNull()
  })

  it('narrows by q and hue from the URL', async () => {
    hub = await mountHub('/?q=12')
    expect(cards()).toHaveLength(1)
    expect(cards()[0]!.textContent).toContain('No. 12')
  })

  it('opens a card\'s dialog, and Back closes it', async () => {
    hub = await mountHub('/')
    await click(cards()[40]!)
    await settle()
    expect(hub.search().c).toBe(41)
    expect(dialog()?.textContent).toContain('No. 41')

    hub.router.back()
    await settle()
    expect(hub.search().c).toBeUndefined()
    expect(dialog()).toBeNull()
  })

  it('opens straight from a shared link, and closing drops c', async () => {
    hub = await mountHub('/?hue=blue&c=7')
    expect(dialog()?.textContent).toContain('No. 7')
    await click(document.querySelector('[aria-label="Close"]')!)
    await settle()
    expect(hub.search()).toEqual({ q: undefined, hue: 'blue', c: undefined })
    expect(dialog()).toBeNull()
  })

  it('steps through the catalogue, wrapping', async () => {
    hub = await mountHub('/?c=1')
    await click(document.querySelector('[aria-label="Previous combination"]')!)
    expect(hub.search().c).toBe(COMBO_COUNT)
    await click(document.querySelector('[aria-label="Next combination"]')!)
    expect(hub.search().c).toBe(1)
  })

  it('drops an invalid c', async () => {
    hub = await mountHub('/?c=999&q=red')
    expect(hub.router.currentRoute.value.fullPath).toBe('/?q=red')
    expect(dialog()).toBeNull()
  })

  it.each([
    ['/combo/42', '/?c=42'],
    ['/combo/42?hue=red', '/?hue=red&c=42'],
    ['/?combo=42', '/?c=42'],
    ['/favorites?q=blue', '/?q=blue'],
  ])('redirects the old %s to %s', async (from, to) => {
    hub = await mountHub(from)
    expect(hub.router.currentRoute.value.fullPath).toBe(to)
  })
})
