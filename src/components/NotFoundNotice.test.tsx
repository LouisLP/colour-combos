// @vitest-environment jsdom
//
// The notice is only meaningful as a property of the redirect that produced it:
// the root route rejects `c`, replaces the URL, and hands the rejected value
// forward in location state (ADR 0005 §7). Nothing about that is visible in the
// component alone, so this mounts the real route tree on a memory history and
// asserts on what a mistyped shared link actually renders.

import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

const mounted: (() => Promise<void>)[] = []

async function mount(initial: string) {
  const history = createMemoryHistory({ initialEntries: [initial] })
  const router = createRouter({ routeTree, history })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(<RouterProvider router={router} />)
  })

  mounted.push(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  return {
    notice: () => container.querySelector('.notice'),
    dismiss: () => container.querySelector<HTMLButtonElement>('.notice-dismiss')!,
    selected: () => router.state.location.search.c,
  }
}

afterEach(async () => {
  for (const unmount of mounted.splice(0)) await unmount()
})

describe('the not-found notice', () => {
  it('names what was refused and what is showing instead', async () => {
    const page = await mount('/?c=999')

    // Both halves matter: "999 not found" alone leaves the reader wondering
    // what they are looking at, and the resolved id alone hides the failure.
    expect(page.notice()?.textContent).toContain('999')
    expect(page.notice()?.textContent).toContain(String(page.selected()))
  })

  it('stays silent when the link was fine', async () => {
    const page = await mount('/?c=153')

    expect(page.selected()).toBe(153)
    expect(page.notice()).toBeNull()
  })

  it('stays silent on a bare visit, which resolves without refusing anything', async () => {
    // A bare `/` also redirects (ADR 0004 §8), so silence here is the thing
    // that distinguishes "resolved" from "rejected".
    const page = await mount('/')

    expect(page.notice()).toBeNull()
  })

  it('rides along to the other route, since the redirect happened in the root', async () => {
    const page = await mount('/favorites?c=abc')

    expect(page.notice()?.textContent).toContain('abc')
  })

  it('dismisses', async () => {
    const page = await mount('/?c=999')

    await act(async () => page.dismiss().click())

    expect(page.notice()).toBeNull()
  })

  it('truncates a rejected value long enough to break the layout', async () => {
    // `?c=` accepts anything, so the echoed value is unbounded user input.
    const page = await mount(`/?c=${'combination'.repeat(20)}`)

    expect(page.notice()!.textContent!.length).toBeLessThan(80)
    expect(page.notice()?.textContent).toContain('…')
  })
})
