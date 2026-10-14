import type { HubSearch } from '../routing/search'
import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { createMemoryHistory, RouterView } from 'vue-router'
import { createHubRouter } from '../routing/router'
import { validateHubSearch } from '../routing/search'

/**
 * Mount the real routes, guard and layout on a memory history at `initial`.
 *
 * The history semantics of ADR 0004 §5 are a fact about the router and the
 * components together, so the component tests drive the whole tree rather than
 * a component in isolation.
 */
export async function mountHub(initial: string) {
  // Every navigation scrolls to the top (ADR 0011), and jsdom has no layout to
  // scroll — it only logs that it cannot.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

  const history = createMemoryHistory()
  history.replace(initial)

  // Memory history keeps its stack private, so count what Back would have to
  // unwind by counting the pushes onto it.
  let entries = 1
  const push = history.push.bind(history)
  history.push = (...args) => {
    entries++
    push(...args)
  }

  const router = createHubRouter(history)
  const wrapper = mount(RouterView, {
    attachTo: document.body,
    global: { plugins: [router] },
  })
  await router.isReady()
  await flushPromises()

  return {
    router,
    container: (wrapper.element as Node).parentElement!,
    /** Entries behind us — what Back would have to unwind. */
    entries: () => entries,
    search: (): HubSearch => validateHubSearch(router.currentRoute.value.query),
    unmount: () => wrapper.unmount(),
  }
}

/** Dispatch a primary click and let the navigation it starts settle. */
export async function click(element: HTMLElement) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  await flushPromises()
}
