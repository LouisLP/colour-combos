<script setup lang="ts">
import type { Combo } from '../data/combos'
import { comboLabel } from '../data/combos'
import { toKanji } from '../ui/japanese'

/**
 * One combo in the grid: its raw colours in equal bands and a caption. The
 * whole card is one button that opens the details dialog (ADR 0015).
 */
defineProps<{ combo: Combo }>()
defineEmits<{ open: [id: number] }>()
</script>

<template>
  <button type="button" class="card" @click="$emit('open', combo.id)">
    <!-- Raw Wada hex, never adjusted. Equal split, so a quad's minor colours
         are never slivers (ADR 0006 §2). -->
    <span class="swatches" aria-hidden="true">
      <i v-for="colour in combo.colours" :key="colour.index" :style="{ background: colour.hex }" />
    </span>
    <span class="caption">
      <span class="no">
        No. {{ combo.id }}
        <span class="kanji" aria-hidden="true">{{ toKanji(combo.id) }}</span>
      </span>
      <span class="names">{{ comboLabel(combo) }}</span>
    </span>
  </button>
</template>

<style scoped>
/* A sticker: chunky border, a hard offset shadow that pops out on hover, and a
   little tilt that alternates across the grid. */
.card {
  --tilt: -1.2deg;

  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  inline-size: 100%;
  padding: 0.5rem 0.5rem 0.65rem;
  border: 2px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-raised);
  text-align: start;
  cursor: pointer;
  content-visibility: auto;
  contain-intrinsic-size: auto 13rem;
  transition:
    transform var(--dur) var(--ease-bounce),
    box-shadow var(--dur) var(--ease-bounce),
    border-color var(--dur-fast) var(--ease);
}

li:nth-child(even) > .card {
  --tilt: 1.2deg;
}

li:nth-child(3n) > .card {
  --tilt: -0.6deg;
}

@media (hover: hover) {
  .card:hover {
    transform: translateY(-4px) rotate(var(--tilt));
    border-color: var(--ink);
    box-shadow: 5px 6px 0 var(--shu);
  }
}

.card:active {
  transform: scale(0.97);
}

.swatches {
  display: flex;
  block-size: 8.5rem;
  border-radius: calc(var(--radius-md) - 0.35rem);
  overflow: hidden;
}

.swatches i {
  flex: 1;
}

.caption {
  display: grid;
  gap: 0.1rem;
  padding-inline: 0.2rem;
  min-inline-size: 0;
}

.no {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-family: var(--display);
  font-size: var(--text-base);
  line-height: 1.3;
}

.kanji {
  color: var(--shu);
  font-family: var(--sans);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.names {
  overflow: hidden;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
