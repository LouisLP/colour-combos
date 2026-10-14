<script setup lang="ts">
import type { ColourFormat } from '../lib/format'
import { useColourFormat } from '../composables/useColourFormat'
import { setColourFormat } from '../state/colourFormat'

/**
 * Hex, `oklch()` or `rgb()` for every value on the combo page — the chips, the
 * role list and the code blocks that take a notation. A per-viewer preference,
 * like density, so it writes the store and never the URL.
 *
 * Pressed buttons, the same segmented control as the density toggle.
 */
const format = useColourFormat()

const options: { value: ColourFormat, label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'oklch', label: 'OKLCH' },
  { value: 'rgb', label: 'RGB' },
]
</script>

<template>
  <div class="format" role="group" aria-label="Colour format">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="format-option"
      :aria-pressed="format === option.value"
      @click="setColourFormat(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
/* The density toggle's segmented control (ADR 0014 §1). */
.format {
  display: inline-flex;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.format-option {
  font: inherit;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0.5rem 0.75rem;
  border: 0;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}

.format-option + .format-option {
  border-inline-start: 1px solid var(--border-strong);
}

.format-option:focus-visible {
  outline-offset: -3px;
}

.format-option[aria-pressed='true'] {
  background: var(--accent);
  color: var(--on-accent);
}
</style>
