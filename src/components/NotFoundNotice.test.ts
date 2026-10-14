// @vitest-environment jsdom
//
// The notice is only meaningful as a property of the redirect that produced it:
// the router guard rejects `c`, replaces the URL, and hands the rejected value
// forward in history state (ADR 0005 §7). Nothing about that is visible in the
// component alone, so this mounts the real route tree on a memory history and
// asserts on what a mistyped shared link actually renders.

import { afterEach, describe, expect, it } from 'vitest'
import { click, mountHub } from '../test/mountHub'

const mounted: (() => void)[] = []

async function mount(initial: string) {
  const view = await mountHub(initial)
  mounted.push(view.unmount)

  return {
    ...view,
    notice: () => view.container.querySelector('.notice'),
    dismiss: () => view.container.querySelector<HTMLButtonElement>('.notice-dismiss')!,
    selected: () => view.search().c,
  }
}

afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount()
  document.body.replaceChildren()
})

describe('the not-found notice', () => {
  it('names what was refused and what is showing instead', async () => {
    const page = await mount('/?c=999')

    // Both halves matter: "999 not found" alone leaves the reader wondering
    // what they are looking at, and the resolved id alone hides the failure.
    expect(page.notice()?.textContent).toContain('999')
    expect(page.notice()?.textContent).toContain(String(page.selected()))
  })

  it('pins the resolved combo without leaving a history entry', async () => {
    const page = await mount('/?c=999')

    expect(page.router.currentRoute.value.query.c).toBe(String(page.selected()))
    expect(page.entries()).toBe(1)
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

    expect(page.router.currentRoute.value.query.c).toBe(String(page.selected()))
    expect(page.notice()).toBeNull()
  })

  it('rides along to the other route, since the redirect happened in the guard', async () => {
    const page = await mount('/favorites?c=abc')

    expect(page.notice()?.textContent).toContain('abc')
  })

  it('dismisses', async () => {
    const page = await mount('/?c=999')

    await click(page.dismiss())

    expect(page.notice()).toBeNull()
  })

  it('truncates a rejected value long enough to break the layout', async () => {
    // `?c=` accepts anything, so the echoed value is unbounded user input.
    const page = await mount(`/?c=${'combination'.repeat(20)}`)

    expect(page.notice()!.textContent!.trim().length).toBeLessThan(80)
    expect(page.notice()?.textContent).toContain('…')
  })
})
