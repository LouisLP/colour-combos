// @vitest-environment jsdom
//
// The history semantics of ADR 0004 §5 are the point of this component, and
// they are not visible in any pure function: "typing leaves one entry, a chip
// leaves one per toggle" is a fact about the field, the chips and the router
// together. So this mounts the real route tree on a memory history and counts
// entries.

import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMBOS } from '../data/combos'
import { filterCombos } from '../data/filter'
import { favorites, toggle as toggleFavorite } from '../state/favorites'
import { click, mountHub } from '../test/mountHub'

async function mount(initial: string) {
  const view = await mountHub(initial)
  return {
    ...view,
    field: () => view.container.querySelector<HTMLInputElement>('#combo-search')!,
    cards: () => view.container.querySelectorAll('.combo-card').length,
    chip: (label: string) => [...view.container.querySelectorAll<HTMLButtonElement>('.filter-chip')]
      .find(chip => chip.textContent?.trim().startsWith(label))!,
  }
}

/** What `v-model` listens for; assigning `.value` alone does not reach it. */
async function type(field: HTMLInputElement, value: string) {
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

async function advance(ms: number) {
  vi.advanceTimersByTime(ms)
  await flushPromises()
}

const settleDebounce = () => advance(500)

beforeEach(() => {
  // Only the debounce's timers: `flushPromises` rides `setImmediate`, which has
  // to stay real for a navigation to settle.
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
  // The favourites store is a module singleton, so it outlives a test.
  for (const id of [...favorites.value])
    toggleFavorite(id)
})

describe('a shared link', () => {
  it('reproduces the filtered grid exactly', async () => {
    const view = await mount('/?c=1&q=blue&size=3')
    const expected = filterCombos(COMBOS, { q: 'blue', size: 3 })

    expect(expected.length).toBeGreaterThan(0)
    expect(view.cards()).toBe(expected.length)
    expect(view.field().value).toBe('blue')
    expect(view.chip('3 colours').getAttribute('aria-pressed')).toBe('true')

    view.unmount()
  })

  it('leaves the selected combo alone — filtering is orthogonal to `c`', async () => {
    const view = await mount('/?c=1&q=blue&size=3')

    // Combo 1 is filtered out of the grid and still themes the page.
    expect(view.search().c).toBe(1)
    expect(view.cards()).toBeLessThan(COMBOS.length)

    view.unmount()
  })
})

describe('typing in the search field', () => {
  it('leaves one history entry, not one per keystroke', async () => {
    const view = await mount('/?c=1')
    const before = view.entries()

    for (const value of ['b', 'bl', 'blu', 'blue']) {
      await type(view.field(), value)
      await advance(60)
    }
    await settleDebounce()

    expect(view.search().q).toBe('blue')
    expect(view.entries()).toBe(before)

    view.unmount()
  })

  it('does not write to the URL until the typing settles', async () => {
    const view = await mount('/?c=1')

    await type(view.field(), 'blue')
    expect(view.search().q).toBeUndefined()
    // The field never lags a keystroke, even though the URL does.
    expect(view.field().value).toBe('blue')

    await settleDebounce()
    expect(view.search().q).toBe('blue')

    view.unmount()
  })

  it('keeps characters typed while its own write is in flight', async () => {
    const view = await mount('/?c=1')

    await type(view.field(), 'blu')
    await settleDebounce()
    await type(view.field(), 'blue')
    await settleDebounce()

    expect(view.field().value).toBe('blue')
    expect(view.search().q).toBe('blue')

    view.unmount()
  })

  it('drops an empty query from the URL rather than serialising it', async () => {
    const view = await mount('/?c=1&q=blue')

    await type(view.field(), '')
    await settleDebounce()

    expect(view.search().q).toBeUndefined()
    expect(view.router.currentRoute.value.fullPath).toBe('/?c=1')

    view.unmount()
  })

  it('survives typing a combo number', async () => {
    const view = await mount('/?c=1')

    await type(view.field(), '13')
    await settleDebounce()

    expect(view.search().q).toBe('13')
    expect(view.field().value).toBe('13')
    expect(view.cards()).toBe(1)

    view.unmount()
  })

  it('adopts a `q` the URL moved to under it', async () => {
    const view = await mount('/?c=1&q=blue')

    await view.router.push({ path: '/', query: { c: '1', q: 'rose' } })
    await flushPromises()

    expect(view.field().value).toBe('rose')

    view.unmount()
  })
})

describe('toggling a size chip', () => {
  it('leaves exactly one history entry per toggle', async () => {
    const view = await mount('/?c=1')
    const before = view.entries()

    await click(view.chip('3 colours'))
    expect(view.search().size).toBe(3)
    expect(view.entries()).toBe(before + 1)

    // Clicking the engaged chip clears the filter — a toggle, not a one-way trip.
    await click(view.chip('3 colours'))
    expect(view.search().size).toBeUndefined()
    expect(view.entries()).toBe(before + 2)

    view.unmount()
  })

  it('narrows the grid and keeps the query', async () => {
    const view = await mount('/?c=1&q=blue')
    const before = view.cards()

    await click(view.chip('3 colours'))

    expect(view.search().q).toBe('blue')
    expect(view.cards()).toBe(filterCombos(COMBOS, { q: 'blue', size: 3 }).length)
    expect(view.cards()).toBeLessThan(before)

    view.unmount()
  })
})

// The issue's "same contract, no route-specific branching". `/favorites`
// supplies a different source list and nothing else changes.
describe('/favorites', () => {
  it('narrows its own list through the same params', async () => {
    for (const id of [12, 13, 14])
      toggleFavorite(id)

    const view = await mount('/favorites?c=1&q=13')

    expect(view.cards()).toBe(1)
    expect(view.field().value).toBe('13')

    view.unmount()
  })

  it('counts facets over the favourites, not the catalogue', async () => {
    for (const id of [12, 13, 14])
      toggleFavorite(id)

    const view = await mount('/favorites?c=1')

    expect(view.chip('Any').textContent!.trim()).toBe('Any (3)')

    view.unmount()
  })

  it('offers no filter bar when there is nothing to narrow', async () => {
    const view = await mount('/favorites?c=1')

    expect(view.container.querySelector('.filter-bar')).toBeNull()
    expect(view.container.textContent).toContain('No favourites yet')

    view.unmount()
  })

  // Telling someone with favourites that they have none would read as the
  // feature being broken rather than as a filter excluding everything.
  it('distinguishes an excluding filter from an empty list', async () => {
    for (const id of [12, 13, 14])
      toggleFavorite(id)

    const view = await mount('/favorites?c=1&q=zzzznotacolour')

    expect(view.cards()).toBe(0)
    expect(view.container.textContent).toContain('No favourites match that.')
    expect(view.container.textContent).not.toContain('No favourites yet')

    view.unmount()
  })

  it('updates the nav count and the grid as a star toggles', async () => {
    const view = await mount('/favorites?c=1')
    const nav = () => view.container.querySelector('header nav')!.textContent

    expect(nav()).not.toContain('(1)')
    toggleFavorite(12)
    await flushPromises()

    expect(nav()).toContain('★ Favourites (1)')
    expect(view.cards()).toBe(1)

    view.unmount()
  })
})

describe('an empty result', () => {
  it('offers a way out that clears both params and keeps the combo', async () => {
    const view = await mount('/?c=1&q=zzzznotacolour&size=3')

    expect(view.cards()).toBe(0)
    const clear = view.container.querySelector<HTMLButtonElement>('.filter-clear')!
    await click(clear)

    expect(view.search().q).toBeUndefined()
    expect(view.search().size).toBeUndefined()
    expect(view.search().c).toBe(1)
    expect(view.cards()).toBe(COMBOS.length)
    // The URL moved under the field, and the field followed it.
    expect(view.field().value).toBe('')

    view.unmount()
  })
})
