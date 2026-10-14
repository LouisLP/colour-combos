import type { HubSearch } from '../routing/search'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, RouterView } from 'vue-router'
import { createHubRouter } from '../routing/router'
import { validateHubSearch } from '../routing/search'

/** Mount the real router and page on a memory history at `initial`. */
export async function mountHub(initial: string) {
  // The dialog is an async component; warm its module so it lands with the
  // first flush, as it would shortly after a real page load.
  await import('../components/ComboDialog.vue')

  const history = createMemoryHistory()
  history.replace(initial)

  const router = createHubRouter(history)
  const wrapper = mount(RouterView, {
    attachTo: document.body,
    global: { plugins: [router] },
  })
  await router.isReady()
  await flushPromises()

  return {
    router,
    search: (): HubSearch => validateHubSearch(router.currentRoute.value.query),
    unmount: () => wrapper.unmount(),
  }
}

/** Dispatch a primary click and let the navigation it starts settle. */
export async function click(element: Element) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  await flushPromises()
}
