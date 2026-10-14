// @vitest-environment jsdom
//
// T5's "find a combo by colour name or hex and open it without touching the
// mouse" is a fact about the search field, the results, the router and the
// stores together, so these mount the real route tree and drive it with keys.

import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { comboHexes, COMBOS, requireCombo } from '../data/combos'
import { filterCombos } from '../data/filter'
import { announcement } from '../state/announcer'
import { density, DENSITY_KEY, setDensity } from '../state/density'
import { favorites, isFavorite, toggle as toggleFavorite } from '../state/favorites'
import { click, mountHub } from '../test/mountHub'

const writeText = vi.fn<(text: string) => Promise<void>>(async () => {})
vi.stubGlobal('navigator', { clipboard: { writeText } })

async function mount(initial: string) {
  const view = await mountHub(initial)
  const results = () => [...view.container.querySelectorAll<HTMLElement>('.combo-results > li')]
  return {
    ...view,
    field: () => view.container.querySelector<HTMLInputElement>('#combo-search')!,
    results,
    /** The id of the result holding focus, read off its selection link. */
    focusedId: () => {
      const link = document.activeElement?.closest('li')?.querySelector<HTMLAnchorElement>('[data-roving]')
      return link ? Number(new URL(link.href, 'http://x').searchParams.get('c')) : undefined
    },
    chip: (label: string) => [...view.container.querySelectorAll<HTMLButtonElement>('.filter-chip')]
      .find(chip => chip.textContent?.trim().startsWith(label))!,
  }
}

/** A keydown on whatever has focus, bubbling as a real one does. */
async function press(key: string, init: KeyboardEventInit = {}) {
  const target = document.activeElement ?? document.body
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  await flushPromises()
  return event
}

async function type(field: HTMLInputElement, value: string) {
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout'] })
  writeText.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
  // Both stores are module singletons, so they outlive a test.
  for (const id of [...favorites.value])
    toggleFavorite(id)
  setDensity('grid')
  localStorage.clear()
})

describe('finding a combo without the mouse', () => {
  it('goes / → type → ↓ → Enter', async () => {
    const view = await mount('/?c=1')

    // `/` from anywhere focuses the search…
    expect((await press('/')).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(view.field())

    // …a colour name narrows it, and ↓ lands on the first match *without*
    // waiting out the debounce — the write is flushed so "first" means first
    // for what is in the field.
    await type(view.field(), 'cerulian')
    await press('ArrowDown')
    const expected = filterCombos(COMBOS, { q: 'cerulian' })
    expect(view.search().q).toBe('cerulian')
    expect(view.focusedId()).toBe(expected[0]!.id)

    // Enter on a focused link is the browser's own activation: what matters is
    // that focus sits on the link that selects this combo.
    expect(document.activeElement?.tagName).toBe('A')
    await click(document.activeElement as HTMLElement)
    expect(view.search().c).toBe(expected[0]!.id)

    view.unmount()
  })

  it('finds by hex the same way', async () => {
    const view = await mount('/?c=1')
    const hex = requireCombo(200).colours[0]!.hex

    await press('/')
    await type(view.field(), hex)
    await press('Enter')

    expect(view.focusedId()).toBe(filterCombos(COMBOS, { q: hex })[0]!.id)
    expect(filterCombos(COMBOS, { q: hex }).map(c => c.id)).toContain(200)

    view.unmount()
  })

  it('leaves / alone while typing in the field', async () => {
    const view = await mount('/?c=1')
    view.field().focus()

    expect((await press('/')).defaultPrevented).toBe(false)

    view.unmount()
  })
})

describe('moving through the results', () => {
  it('steps with j/k and the arrows, and jumps with Home/End', async () => {
    const view = await mount('/?c=1&size=2')
    const ids = filterCombos(COMBOS, { size: 2 }).map(c => c.id)

    await press('/')
    await press('ArrowDown')
    expect(view.focusedId()).toBe(ids[0])

    await press('j')
    await press('j')
    expect(view.focusedId()).toBe(ids[2])

    await press('k')
    expect(view.focusedId()).toBe(ids[1])

    // No layout in a test DOM, so a visual row is one result wide.
    await press('ArrowDown')
    expect(view.focusedId()).toBe(ids[2])

    await press('End')
    expect(view.focusedId()).toBe(ids.at(-1))

    await press('Home')
    expect(view.focusedId()).toBe(ids[0])

    view.unmount()
  })

  it('hands focus back to the search on Escape', async () => {
    const view = await mount('/?c=1')

    await press('/')
    await press('ArrowDown')
    await press('Escape')

    expect(document.activeElement).toBe(view.field())

    view.unmount()
  })

  it('leaves modified keys to the browser', async () => {
    const view = await mount('/?c=1')

    await press('/')
    await press('ArrowDown')
    const event = await press('j', { metaKey: true })

    expect(event.defaultPrevented).toBe(false)
    expect(view.focusedId()).toBe(1)

    view.unmount()
  })
})

describe('acting on the focused result', () => {
  it.each(['grid', 'list'] as const)('f toggles its favourite in the %s', async (layout) => {
    setDensity(layout)
    const view = await mount('/?c=1')

    await press('/')
    await press('ArrowDown')
    await press('j')
    await press('f')

    expect(isFavorite(2)).toBe(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(announcement.value).toBe('Added No. 2 to favourites')

    await press('f')
    expect(isFavorite(2)).toBe(false)

    view.unmount()
  })

  it.each(['grid', 'list'] as const)('c copies all its hexes and confirms on every chip in the %s', async (layout) => {
    setDensity(layout)
    const view = await mount('/?c=1')

    await press('/')
    await press('ArrowDown')
    await press('c')

    expect(writeText).toHaveBeenCalledWith(comboHexes(requireCombo(1)))
    const first = view.results()[0]!
    const confirmed = first.querySelectorAll('.is-copied')
    // One per colour, plus the row's "copy all".
    expect(confirmed.length).toBe(requireCombo(1).colours.length + (layout === 'list' ? 1 : 0))

    view.unmount()
  })
})

describe('the compact list', () => {
  it('switches layout without touching the URL or history', async () => {
    const view = await mount('/?c=1&q=blue')
    const before = { path: view.router.currentRoute.value.fullPath, entries: view.entries() }

    await click([...view.container.querySelectorAll<HTMLButtonElement>('.density-option')].find(b => b.textContent?.trim() === 'List')!)

    expect(view.container.querySelectorAll('.combo-row')).toHaveLength(filterCombos(COMBOS, { q: 'blue' }).length)
    expect(view.container.querySelector('.combo-card')).toBeNull()
    expect(view.router.currentRoute.value.fullPath).toBe(before.path)
    expect(view.entries()).toBe(before.entries)
    expect(localStorage.getItem(DENSITY_KEY)).toBe('list')

    view.unmount()
  })

  it('shows every hex inline, each copying itself', async () => {
    setDensity('list')
    const view = await mount('/?c=1')
    const combo = requireCombo(1)
    const hexes = [...view.results()[0]!.querySelectorAll<HTMLButtonElement>('.combo-row-hex')]

    expect(hexes.map(b => b.textContent?.trim())).toEqual(combo.colours.map(c => c.hex.slice(1)))
    await click(hexes[1]!)
    expect(writeText).toHaveBeenCalledWith(combo.colours[1]!.hex)

    const all = view.results()[0]!.querySelector<HTMLButtonElement>('.combo-row-action')!
    await click(all)
    expect(writeText).toHaveBeenLastCalledWith(comboHexes(combo))

    view.unmount()
  })

  it('is the density a returning viewer left', async () => {
    expect(density.value).toBe('grid')
    setDensity('list')
    const view = await mount('/?c=1')

    expect(view.container.querySelector('.combo-results.is-list')).not.toBeNull()

    view.unmount()
  })
})

describe('search highlighting', () => {
  it('marks the matched run in each name', async () => {
    const view = await mount('/?c=1&q=cerulian')
    const marks = [...view.container.querySelectorAll('.combo-results mark.match')]

    expect(marks.length).toBeGreaterThanOrEqual(filterCombos(COMBOS, { q: 'cerulian' }).length)
    expect(new Set(marks.map(mark => mark.textContent))).toEqual(new Set(['Cerulian']))

    view.unmount()
  })

  it('marks the matched run in a hex, in the list', async () => {
    setDensity('list')
    const view = await mount('/?c=1&q=%23d966')
    const marks = [...view.container.querySelectorAll('.combo-row-hex mark.match')]

    expect(marks.length).toBeGreaterThan(0)
    expect(marks.every(mark => mark.textContent === 'd966')).toBe(true)

    view.unmount()
  })
})

describe('hue and mode filters', () => {
  it('reproduce from a shared link', async () => {
    const view = await mount('/?c=1&hue=blue&mode=dark')

    expect(view.results()).toHaveLength(filterCombos(COMBOS, { hue: 'blue', mode: 'dark' }).length)
    expect(view.chip('Blue').getAttribute('aria-pressed')).toBe('true')
    expect(view.chip('Dark').getAttribute('aria-pressed')).toBe('true')

    view.unmount()
  })

  it('push one entry per toggle and round-trip through the URL', async () => {
    const view = await mount('/?c=1&q=red')
    const before = view.entries()

    await click(view.chip('Green'))
    await click(view.chip('Light'))
    expect(view.entries()).toBe(before + 2)
    expect(view.router.currentRoute.value.fullPath).toBe('/?c=1&q=red&hue=green&mode=light')
    expect(view.results()).toHaveLength(filterCombos(COMBOS, { q: 'red', hue: 'green', mode: 'light' }).length)

    // The engaged chip clears its own filter and only its own.
    await click(view.chip('Green'))
    expect(view.search()).toMatchObject({ q: 'red', hue: undefined, mode: 'light' })

    view.unmount()
  })

  it('survive the move to /favorites', async () => {
    const view = await mount('/?c=1&hue=blue&mode=dark')
    const nav = view.container.querySelector<HTMLAnchorElement>('header nav a[href*="favorites"]')!

    await click(nav)

    expect(view.router.currentRoute.value.path).toBe('/favorites')
    expect(view.search()).toMatchObject({ hue: 'blue', mode: 'dark' })

    view.unmount()
  })
})

describe('the shortcuts dialog', () => {
  it('opens on ? from outside a field', async () => {
    const view = await mount('/?c=1')
    const dialog = view.container.querySelector('dialog')!

    expect(dialog.open).toBe(false)
    await press('?', { shiftKey: true })
    expect(dialog.open).toBe(true)
    expect(dialog.textContent).toContain('Copy its hexes')

    view.unmount()
  })
})
