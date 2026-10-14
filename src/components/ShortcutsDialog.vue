<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { isBareShortcut } from '../ui/keyboard'

/**
 * The keyboard map (ADR 0014 §4): a `?` button in the filter bar, and the `?`
 * key from anywhere a shortcut is not being typed into a field.
 *
 * A native modal `<dialog>`: it traps focus, closes on Escape and hands focus
 * back to whatever opened it, all without code here.
 */
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

function open() {
  const el = dialog.value
  if (!el || el.open)
    return
  // jsdom has `<dialog>` but not always `showModal`; the attribute is the same
  // fact for a test.
  if (typeof el.showModal === 'function')
    el.showModal()
  else
    el.setAttribute('open', '')
}

function close() {
  const el = dialog.value
  if (typeof el?.close === 'function')
    el.close()
  else
    el?.removeAttribute('open')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === '?' && isBareShortcut(event)) {
    event.preventDefault()
    open()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const shortcuts: { keys: string[], action: string }[] = [
  { keys: ['/'], action: 'Search' },
  { keys: ['↓'], action: 'From search, jump to the first result' },
  { keys: ['j', 'k'], action: 'Next / previous result' },
  { keys: ['←', '→', '↑', '↓'], action: 'Move through the results' },
  { keys: ['Home', 'End'], action: 'First / last result' },
  { keys: ['Enter'], action: 'Theme the page with the focused combination' },
  { keys: ['f'], action: 'Favourite the focused combination' },
  { keys: ['c'], action: 'Copy its hexes' },
  { keys: ['Esc'], action: 'Back to search' },
  { keys: ['?'], action: 'This list' },
]
</script>

<template>
  <button type="button" class="shortcuts-button" aria-label="Keyboard shortcuts" aria-haspopup="dialog" @click="open">
    ?
  </button>

  <dialog ref="dialog" class="shortcuts" aria-labelledby="shortcuts-title">
    <h2 id="shortcuts-title" class="shortcuts-title">
      Keyboard shortcuts
    </h2>
    <dl class="shortcuts-list">
      <div v-for="shortcut in shortcuts" :key="shortcut.action">
        <dt>
          <kbd v-for="key in shortcut.keys" :key="key">{{ key }}</kbd>
        </dt>
        <dd>{{ shortcut.action }}</dd>
      </div>
    </dl>
    <button type="button" class="shortcuts-close" @click="close">
      Close
    </button>
  </dialog>
</template>

<style scoped>
.shortcuts-button {
  inline-size: 2rem;
  block-size: 2rem;
  flex: none;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}

.shortcuts {
  inline-size: min(100% - 2 * var(--space-md), 26rem);
  padding: var(--space-lg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-md);
}

.shortcuts::backdrop {
  background: oklch(0% 0 0 / 0.35);
}

.shortcuts-title {
  margin: 0 0 var(--space-md);
  font-family: var(--serif);
  font-size: var(--text-lg);
  font-weight: 600;
}

.shortcuts-list {
  display: grid;
  gap: var(--space-xs);
  margin: 0 0 var(--space-lg);
  font-size: var(--text-sm);
}

.shortcuts-list > div {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: var(--space-sm);
  align-items: baseline;
}

.shortcuts-list dt {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.shortcuts-list dd {
  margin: 0;
  color: var(--ink-muted);
}

kbd {
  min-inline-size: 1.6em;
  padding: 0.1em 0.4em;
  font-family: var(--mono);
  font-size: 0.85em;
  text-align: center;
  border: 1px solid var(--border-strong);
  border-block-end-width: 2px;
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  color: var(--ink);
}

.shortcuts-close {
  font: inherit;
  font-size: 0.85rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}
</style>
