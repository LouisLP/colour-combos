<script setup lang="ts">
import type { RampSteps, Step } from '../lib/scale'
import { STEPS } from '../lib/scale'
import { onColour } from '../theme/colour'
import CopyButton from './CopyButton.vue'
import CopyIcon from './CopyIcon.vue'

/** One ramp as eleven copyable chips. Labels use black or white, whichever wins. */
defineProps<{
  /** Wada name, or `Neutral`. */
  name: string
  /** The role ramp aliasing it (`accent`, `accent-2`, …), if any. */
  role?: string
  /** The step holding the exact Wada hex. Absent on the neutral ramp. */
  anchor?: Step
  steps: RampSteps
}>()
</script>

<template>
  <section class="ramp" :aria-label="name">
    <h4 class="ramp-name">
      {{ name }}
      <span v-if="role" class="ramp-role">{{ role }}</span>
    </h4>
    <ol class="ramp-steps">
      <li v-for="step in STEPS" :key="step">
        <CopyButton
          v-slot="{ copied }"
          class="ramp-chip"
          :class="{ 'is-anchor': step === anchor }"
          :style="{ background: steps[step].hex, color: onColour(steps[step].hex) }"
          :text="steps[step].hex"
          :label="`Copy ${name} ${step}${step === anchor ? ' (exact Wada colour)' : ''} ${steps[step].hex}`"
        >
          <span class="ramp-step">
            {{ step }}
            <span v-if="step === anchor" aria-hidden="true">◆</span>
          </span>
          <span class="ramp-value">
            <CopyIcon v-if="copied" :copied="true" />
            <template v-else>{{ steps[step].hex.slice(1) }}</template>
          </span>
        </CopyButton>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.ramp {
  display: grid;
  gap: var(--space-2xs);
}

.ramp-name {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 700;
}

.ramp-role {
  font-family: var(--mono);
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--ink-muted);
}

/* Eleven across on a wide screen, wrapping on a narrow one. */
.ramp-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3.6rem, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.ramp-chip {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4rem;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 3.5rem;
  padding: 0.35rem 0.4rem;
  border: 0;
  text-align: start;
  cursor: pointer;
  transition: transform var(--dur) var(--ease-bounce);
}

@media (hover: hover) {
  .ramp-chip:hover {
    transform: scale(1.06);
    position: relative;
    z-index: 1;
    border-radius: 0.4rem;
  }
}

.ramp-chip:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px currentColor;
}

.ramp-step {
  font-size: var(--text-xs);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ramp-value {
  font-family: var(--mono);
  font-size: 0.66rem;
  line-height: 1.3;
}

/* The anchor is the Wada swatch itself, sitting in its ramp (ADR 0012 §6). */
.ramp-chip.is-anchor {
  box-shadow: inset 0 0 0 2px currentColor;
}
</style>
