// One polite live region for the whole app (ADR 0014 §5).
//
// Copying and starring from the keyboard change nothing a screen reader would
// otherwise hear, so they announce. One region in the layout rather than one per
// card: 348 idle `role="status"` nodes cost DOM and buy nothing, and a single
// region is also the one place that can speak for a keyboard shortcut whose
// target card has no visible confirmation of its own.

import { computed, nextTick, shallowRef } from 'vue'

/** How long an announcement stays before the region empties again. */
export const ANNOUNCE_MS = 1400

const message = shallowRef('')
let timer: ReturnType<typeof setTimeout> | undefined

export const announcement = computed(() => message.value)

/**
 * Say something. The region is emptied first and refilled a tick later, so
 * copying the same hex twice is announced twice — a live region only speaks
 * when its text changes.
 */
export function announce(text: string): void {
  clearTimeout(timer)
  message.value = ''
  void nextTick(() => {
    message.value = text
    timer = setTimeout(() => {
      message.value = ''
    }, ANNOUNCE_MS)
  })
}
