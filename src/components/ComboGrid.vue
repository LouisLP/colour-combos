<script setup lang="ts">
import type { Combo } from '../data/combos'
import { useSelectedCombo } from '../composables/useSelectedCombo'
import ComboCard from './ComboCard.vue'

/**
 * The browse surface, shared by `/` and `/favorites` unchanged.
 *
 * Not virtualised, deliberately: 348 cards is 5,248 nodes and a full re-render
 * costs single-digit milliseconds, so windowing would buy nothing and cost
 * scroll restoration and find-in-page (ADR 0006 §6). `content-visibility` on the
 * grid items does the work instead, and it is load-bearing for search feel on a
 * slow phone rather than a stray optimisation.
 */
defineProps<{
  /** The list to render. The route supplies it; the grid never filters. */
  combos: Combo[]
}>()

defineSlots<{
  /**
   * Copy for an empty list. The only thing `/` and `/favorites` differ on
   * (ADR 0003 §3, ADR 0006 consequences) — everything else is shared.
   */
  empty: () => unknown
}>()

const selected = useSelectedCombo()
</script>

<template>
  <!-- An empty result is a live surface, not a dead end (ADR 0006 §7). -->
  <div v-if="combos.length === 0" class="combo-empty">
    <slot name="empty" />
  </div>

  <ul v-else class="combo-grid">
    <li v-for="combo in combos" :key="combo.id">
      <ComboCard :combo="combo" :selected="combo.id === selected.id" />
    </li>
  </ul>
</template>

<style scoped>
.combo-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;

  /* Tightened from 13rem so more cards fit per row (ADR 0007), while staying wide
     enough that the caption never ellipsises on its first word (ADR 0006 §5).
     6 columns at 1440px, 2 at 390px. */
  grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
}

@media (width >= 100rem) {
  .combo-grid {
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  }
}

/* Not an optimisation to be tidied away: this more than halves the *worst*
   filter keystroke on a 4×-throttled phone — 32 ms against 77 ms (ADR 0006 §6).
   Its price is a document height estimated rather than measured, so the
   scrollbar thumb drifts ~8% as skipped content renders for real. Accepted. */
.combo-grid > li {
  content-visibility: auto;
  contain-intrinsic-size: auto 7.5rem;
}

.combo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
}

/* The empty copy is the page's slot content, so it carries the page's scope,
   not this one — `:slotted` is what reaches it. */
.combo-empty :slotted(p) {
  max-inline-size: 32ch;
  margin: 0;
  font-size: var(--text-base);
  color: var(--ink-muted);
  text-wrap: pretty;
}

/* Serif heading so an empty result still feels composed rather than like an
   error dump — the same editorial voice as the hero, in miniature. */
.combo-empty :slotted(p.combo-empty-heading) {
  font-family: var(--serif);
  font-size: var(--text-xl);
  letter-spacing: -0.01em;
  color: var(--ink);
  text-wrap: balance;
}
</style>
