<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { copyText } from '../ui/clipboard'

/** Copies one string and confirms it. The slot gets `copied`; the label flips to `Copied …`. */
const props = defineProps<{
  /** What lands on the clipboard. */
  text: string
  /** The accessible name before a copy, e.g. `Copy English Red #d96629`. */
  label: string
}>()

defineSlots<{
  default: (props: { copied: boolean }) => unknown
}>()

const CONFIRM_MS = 1400

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  if (!await copyText(props.text))
    return
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    copied.value = false
  }, CONFIRM_MS)
}

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
