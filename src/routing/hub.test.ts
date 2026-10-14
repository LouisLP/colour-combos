// @vitest-environment jsdom

import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { COMBO_COUNT } from '../data/combos'
import { hubFor } from './hub'

async function start(initial: string) {
  const history = createMemoryHistory()
  const router = createRouter({ history, routes: [{ path: '/', component: {} }] })
  await router.push(initial)
  await router.isReady()
  const hub = hubFor(router)
  const settle = async () => {
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve))
    await flushPromises()
  }
  return { router, history, hub, settle, url: () => router.currentRoute.value.fullPath }
}

describe('hub', () => {
  it('pushes on open, and closing goes Back', async () => {
    const { hub, history, settle, url } = await start('/?q=red')
    const before = history.state.position
    hub.open(5)
    await settle()
    expect(url()).toBe('/?q=red&c=5')
    expect(hub.combo.value?.id).toBe(5)
    hub.close()
    await settle()
    expect(url()).toBe('/?q=red')
    expect(history.state.position).toBe(before)
  })

  it('replaces when closing a dialog from a shared link', async () => {
    const { hub, history, settle, url } = await start('/?c=7')
    const before = history.state.position
    hub.close()
    await settle()
    expect(url()).toBe('/')
    expect(history.state.position).toBe(before)
  })

  it('forgets the push once something else closes the dialog', async () => {
    const { router, hub, history, settle, url } = await start('/')
    hub.open(3)
    await settle()
    router.back()
    await settle()
    await router.push('/?c=9')
    const before = history.state.position
    hub.close()
    await settle()
    expect(url()).toBe('/')
    expect(history.state.position).toBe(before)
  })

  it('steps and wraps without adding entries', async () => {
    const { hub, history, settle, url } = await start('/?hue=blue&c=1')
    const before = history.state.position
    hub.step(-1)
    await settle()
    expect(url()).toBe(`/?hue=blue&c=${COMBO_COUNT}`)
    hub.step(1)
    await settle()
    expect(url()).toBe('/?hue=blue&c=1')
    expect(history.state.position).toBe(before)
  })

  it('replaces for search and hue, and drops empty values', async () => {
    const { hub, history, settle, url } = await start('/')
    const before = history.state.position
    hub.setQuery('rose')
    await settle()
    hub.toggleHue('red')
    await settle()
    expect(url()).toBe('/?q=rose&hue=red')
    hub.toggleHue('red')
    await settle()
    hub.setQuery('')
    await settle()
    expect(url()).toBe('/')
    expect(history.state.position).toBe(before)
  })

  it('links to a combo on its own', async () => {
    const { hub } = await start('/?q=red&c=2')
    expect(hub.link(42)).toBe(`${location.origin}/?c=42`)
  })
})
