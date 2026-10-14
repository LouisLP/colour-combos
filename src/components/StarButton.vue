<script setup lang="ts">
/**
 * The favourite affordance, always visible (ADR 0006 §8). Hover-only dies on
 * touch and focus-only hides the feature from everyone not driving by keyboard,
 * so the star is present on every card — 348 permanent glyphs, which the grid
 * was measured with.
 *
 * It is positioned absolutely over the swatch block by the card, so it lands in
 * the same top-right spot regardless of caption length (ADR 0007); the CSS gives
 * it a `--surface` backdrop so it stays legible over any raw Wada colour.
 *
 * It stays presentational: the card reads `useIsFavorite` and hands the answer
 * down, so the store has exactly one consumer per card rather than one per glyph.
 */
defineProps<{
  comboId: number
  pressed: boolean
}>()

defineEmits<{
  toggle: [id: number]
}>()
</script>

<template>
  <!-- `aria-pressed` carries the state, so the accessible name stays the same
       sentence whether or not the combo is starred. -->
  <button
    type="button"
    class="combo-star"
    :aria-pressed="pressed"
    :aria-label="`Favourite combination ${comboId}`"
    @click="$emit('toggle', comboId)"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
      <path
        d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.2 6.7L12 17.8 6.1 20.9l1.2-6.7L2.5 9.5l6.6-.9z"
        :fill="pressed ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
/* Always visible, never hover-revealed: hover-only fails on touch outright (§8).
   Absolute top-right over the swatch block, in the same spot on every card
   (ADR 0007), with a --surface backdrop so it stays legible over any colour. */
.combo-star {
  position: absolute;
  inset-block-start: 0.3rem;
  inset-inline-end: 0.3rem;
  inline-size: 2rem;
  block-size: 2rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  line-height: 0;
  color: var(--ink-muted);
  cursor: pointer;
  user-select: none;
  transition:
    color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

/* --accent is spent only on interactive state (ADR 0006 §4), and a starred combo
   is exactly that. */
.combo-star[aria-pressed='true'] {
  color: var(--accent-text);
}

/* A press dips the whole chip; the glyph springs slightly past it, so a tap
   reads as a physical click even though the fill swap itself is instant. */
.combo-star:active {
  transform: scale(0.88);
}

.combo-star:active svg {
  transform: scale(1.15);
  transition: transform var(--dur-fast) var(--ease);
}
</style>
