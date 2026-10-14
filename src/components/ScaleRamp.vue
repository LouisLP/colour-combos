<script setup lang="ts">
import type { ColourFormat } from '../lib/format'
import type { RampSteps, Step } from '../lib/scale'
import { formatColour } from '../lib/format'
import { STEPS } from '../lib/scale'
import { onColour } from '../theme/colour'
import CopyButton from './CopyButton.vue'
import CopyIcon from './CopyIcon.vue'

/**
 * One tonal ramp as a row of eleven chips, `50` to `950` (ADR 0012). Each chip
 * is the step's colour, labelled with its step and value, and copies the value
 * in the viewer's notation on a click or a keypress.
 *
 * Text sits on the step in whichever of black or white contrasts more, which
 * clears 4.5:1 against any sRGB colour — the same rule as the list's hex labels
 * (ADR 0014 §1).
 */
defineProps<{
  /** Wada name, or `Neutral`. */
  name: string
  /** The role ramp aliasing it (`accent`, `accent-2`, …), if any. */
  role?: string
  /** The step holding the exact Wada hex. Absent on the neutral ramp. */
  anchor?: Step
  steps: RampSteps
  format: ColourFormat
}>()
</script>

<template>
  <section class="ramp" :aria-label="name">
    <h3 class="ramp-name">
      {{ name }}
      <span v-if="role" class="ramp-role">{{ role }}</span>
    </h3>
    <ol class="ramp-steps">
      <li v-for="step in STEPS" :key="step">
        <CopyButton
          v-slot="{ copied }"
          class="ramp-chip"
          :class="{ 'is-anchor': step === anchor }"
          :style="{ background: steps[step].hex, color: onColour(steps[step].hex) }"
          :text="formatColour(steps[step], format)"
          :label="`Copy ${name} ${step}${step === anchor ? ' (exact Wada colour)' : ''} ${formatColour(steps[step], format)}`"
        >
          <span class="ramp-step">
            {{ step }}
            <span v-if="step === anchor" class="ramp-anchor" title="The exact Wada colour">◆</span>
          </span>
          <span class="ramp-value">
            <CopyIcon v-if="copied" :copied="true" />
            <template v-else>{{ formatColour(steps[step], format) }}</template>
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
  font-weight: 600;
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
  grid-template-columns: repeat(auto-fit, minmax(5.25rem, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* A flush tile. The ring sits inside it (the strip's `overflow` would clip one
   outside), `--accent` on a `--surface` band as on the card swatches, so it
   holds whatever the step's colour (ADR 0014 §4). */
.ramp-chip {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.6rem;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 4.25rem;
  padding: 0.4rem 0.45rem;
  border: 0;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.ramp-chip:focus-visible {
  outline: none;
  box-shadow:
    inset 0 0 0 3px var(--accent),
    inset 0 0 0 5px var(--surface);
}

.ramp-step {
  font-size: var(--text-xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ramp-value {
  font-family: var(--mono);
  font-size: 0.66rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

/* The anchor is the swatch itself, sitting in its ramp (ADR 0012 §6): a
   diamond by the step and a hairline frame in the chip's own text colour. */
.ramp-chip.is-anchor {
  box-shadow: inset 0 0 0 2px currentColor;
}

.ramp-chip.is-anchor:focus-visible {
  box-shadow:
    inset 0 0 0 3px var(--accent),
    inset 0 0 0 5px var(--surface);
}
</style>
