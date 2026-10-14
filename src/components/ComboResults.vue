<script setup lang="ts">
import type { Combo } from '../data/combos'
import { useDensity } from '../composables/useDensity'
import { useSelectedCombo } from '../composables/useSelectedCombo'
import { isBareShortcut, ROVING_ATTR, SEARCH_FIELD_ID } from '../ui/keyboard'
import { columnsOf, rovingTarget } from '../ui/roving'
import ComboCard from './ComboCard.vue'
import ComboRow from './ComboRow.vue'

/**
 * The browse surface, shared by `/` and `/favorites` unchanged, in whichever
 * density the viewer picked: the framed card grid (ADR 0006) or the compact
 * list (ADR 0014 §1). The list to render is the route's; this never filters.
 *
 * Not virtualised, deliberately: 348 cards is 5,248 nodes and a full re-render
 * costs single-digit milliseconds, so windowing would buy nothing and cost
 * scroll restoration and find-in-page (ADR 0006 §6). `content-visibility` on the
 * items does the work instead, and it is load-bearing for search feel on a
 * slow phone rather than a stray optimisation.
 *
 * It also owns movement between results (ADR 0014 §4). Each result marks one
 * element as its focus target; the arrows, `j`/`k`, Home and End move focus
 * between those targets, and Escape hands it back to the search field. The
 * per-result keys (`f`, `c`, Enter) belong to the result itself.
 */
defineProps<{
  /** The list to render. The route supplies it; the results never filter. */
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
const density = useDensity()

/**
 * Move focus between results. Native Tab order is left alone — every star and
 * copy chip stays reachable by Tab as ADR 0007 promised — so this is an extra,
 * faster lane over the same targets rather than a replacement tab stop.
 */
function onKeydown(event: KeyboardEvent) {
  if (!isBareShortcut(event))
    return

  if (event.key === 'Escape') {
    event.preventDefault()
    document.getElementById(SEARCH_FIELD_ID)?.focus()
    return
  }

  const items = (event.currentTarget as HTMLElement).children
  const index = Array.prototype.findIndex.call(items, item => item.contains(event.target as Node))
  if (index === -1)
    return

  const next = rovingTarget(event.key, index, items.length, columnsOf(items))
  if (next === undefined)
    return

  event.preventDefault()
  items[next]?.querySelector<HTMLElement>(`[${ROVING_ATTR}]`)?.focus()
}
</script>

<template>
  <!-- An empty result is a live surface, not a dead end (ADR 0006 §7). -->
  <div v-if="combos.length === 0" class="combo-empty">
    <slot name="empty" />
  </div>

  <ul v-else class="combo-results" :class="`is-${density}`" @keydown="onKeydown">
    <li v-for="combo in combos" :key="combo.id">
      <ComboRow v-if="density === 'list'" :combo="combo" :selected="combo.id === selected.id" />
      <ComboCard v-else :combo="combo" :selected="combo.id === selected.id" />
    </li>
  </ul>
</template>

<style scoped>
.combo-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
}

.combo-results.is-grid {
  gap: 1rem;

  /* Tightened from 13rem so more cards fit per row (ADR 0007), while staying wide
     enough that the caption never ellipsises on its first word (ADR 0006 §5).
     6 columns at 1440px, 2 at 390px. */
  grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
}

@media (width >= 100rem) {
  .combo-results.is-grid {
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  }
}

/* Not an optimisation to be tidied away: this more than halves the *worst*
   filter keystroke on a 4×-throttled phone — 32 ms against 77 ms (ADR 0006 §6).
   Its price is a document height estimated rather than measured, so the
   scrollbar thumb drifts ~8% as skipped content renders for real. Accepted. */
.combo-results > li {
  content-visibility: auto;
  contain-intrinsic-size: auto 7.5rem;

  /* Roving focus scrolls the focused result into view; this keeps it clear of
     the sticky filter bar rather than tucked under it (ADR 0014 §4). */
  scroll-margin-block: 5rem var(--space-md);
}

/* The compact list, row-major like the grid so the arrows mean the same thing
   in both (ADR 0014 §1, §4). Three columns at 1440px, one on a phone. A column
   gutter rather than a gap all round: the rows are ruled, so they butt. */
.combo-results.is-list {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 24rem), 1fr));
  column-gap: var(--space-lg);
}

/* Named so a row can lay itself out by its own width rather than the
   viewport's (ADR 0014 §1). */
.combo-results.is-list > li {
  contain-intrinsic-size: auto 1.5rem;
  container: combo-result / inline-size;
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
