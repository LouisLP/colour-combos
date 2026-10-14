<script setup lang="ts">
import type { Density } from '../state/density'
import { useDensity } from '../composables/useDensity'
import { setDensity } from '../state/density'

/**
 * Grid or compact list (ADR 0014 §1). A per-viewer preference rather than a URL
 * param, so it writes the store and never the history.
 *
 * A pair of pressed buttons rather than a radio group: two options, one press
 * each, the same `aria-pressed` idiom as the filter chips beside it.
 */
const density = useDensity()

const options: { value: Density, label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
]
</script>

<template>
  <div class="density" role="group" aria-label="Layout">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="density-option"
      :aria-pressed="density === option.value"
      @click="setDensity(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
/* A segmented control: one hairline frame, the engaged half filled. */
.density {
  display: inline-flex;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.density-option {
  font: inherit;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0.5rem 0.75rem;
  border: 0;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}

.density-option + .density-option {
  border-inline-start: 1px solid var(--border-strong);
}

/* The ring would be clipped by the frame's `overflow: hidden`, so it sits
   inside the button instead. */
.density-option:focus-visible {
  outline-offset: -3px;
}

/* An engaged option is interactive state, the one thing --accent is spent on
   beside the chrome (ADR 0006 §4, ADR 0009). */
.density-option[aria-pressed='true'] {
  background: var(--accent);
  color: var(--on-accent);
}
</style>
