<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { announce, ANNOUNCE_MS } from '../state/announcer'
import { copyText } from '../ui/clipboard'

/**
 * A button that copies one string and confirms it (ADR 0007 §4, ADR 0014 §5).
 *
 * The look is the caller's — a glyph chip over a card's swatch, a hex label on a
 * row's colour, a "copy all" icon — so the content is a slot that is told
 * whether the confirmation is showing. What every copy control shares lives
 * here: the clipboard write that may fail, the accessible name flipping to
 * `Copied …`, the announcement, and a confirmation that clears itself and is
 * restarted, not stacked, by a fast second copy.
 */
const props = defineProps<{
  /** What lands on the clipboard. */
  text: string
  /** The accessible name before a copy, e.g. `Copy English Red #d96629`. */
  label: string
}>()

defineSlots<{
  default: (props: { copied: boolean }) => unknown
}>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Show the confirmation without copying. A parent that copied a whole combo at
 * once (the `c` shortcut) calls this on each of its chips so the copy is
 * visible where the colours are.
 */
function confirm() {
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    copied.value = false
  }, ANNOUNCE_MS)
}

async function copy() {
  if (!await copyText(props.text))
    return
  confirm()
  announce(`Copied ${props.text}`)
}

defineExpose({ copy, confirm })

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <button
    type="button"
    :class="{ 'is-copied': copied }"
    :aria-label="copied ? `Copied ${text}` : label"
    @click="copy"
  >
    <slot :copied="copied" />
  </button>
</template>
