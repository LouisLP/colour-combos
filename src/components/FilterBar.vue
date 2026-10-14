<script setup lang="ts">
import type { Combo, ComboSize } from '../data/combos'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHubSearch } from '../composables/useHubSearch'
import { COMBO_SIZES } from '../data/combos'
import { countBySize } from '../data/filter'
import { toHubQuery } from '../routing/search'

/**
 * The sticky bar under the header: search field, size chips with their facet
 * counts, and a live count (ADR 0006 §7).
 *
 * The two controls take deliberately different history stances (ADR 0004 §5),
 * and that asymmetry is the whole point of this component:
 *
 * - **Typing `replace`s, debounced.** Back after a search returns to the
 *   pre-search grid in one step rather than unwinding letter by letter.
 * - **A chip `push`es.** Toggling a filter is a discrete, deliberate act, so
 *   back undoes exactly that toggle.
 *
 * It is route-agnostic: the params are read off whichever route is current, so
 * the same bar serves `/` and `/favorites` with the source list as the only
 * difference.
 */
const props = defineProps<{
  /** The route's unfiltered list. Facet counts are read off it. */
  source: Combo[]
  /** How many survive the current filter — the live count. */
  shown: number
}>()

/**
 * How long the field waits before writing `q` to the URL. The figure is ADR
 * 0006 §7's, where it was verified in a browser rather than asserted: long
 * enough that a typed word is one write, short enough that the count never
 * feels stale.
 */
const SEARCH_DEBOUNCE_MS = 250

const router = useRouter()
const search = useHubSearch()
const counts = computed(() => countBySize(props.source))

/**
 * Toggle a size chip. Clicking the engaged chip clears the filter, so a chip is
 * a toggle rather than a one-way trip into a filtered state — and
 * `aria-pressed` is what says so.
 *
 * `push` — toggling a filter is a discrete, deliberate act, so Back undoes
 * exactly this toggle (ADR 0004 §5). `c` is untouched.
 */
function toggleSize(size: ComboSize | undefined) {
  const engaged = search.value.size === size
  void router.push({ query: toHubQuery({ ...search.value, size: engaged ? undefined : size }) })
}

/**
 * The search field, with a local echo so it never lags a keystroke.
 *
 * The URL cannot be the field's value directly: a debounced write leaves it up
 * to 250 ms behind what has been typed, so binding to it would drop characters.
 * The draft is local, and the URL is written *from* it.
 *
 * That leaves one genuinely two-way seam — the URL moving under the field —
 * and it needs `written` to resolve. The field must ignore the URL catching up
 * to its own write (which is not news, and is stale by whatever was typed in
 * the meantime) while obeying a Back, a Forward, or a Clear filters (which is
 * the URL genuinely disagreeing). Without recording what it wrote, those two
 * are the same event and one of them has to be got wrong.
 */
const urlQ = computed(() => search.value.q ?? '')
const draft = ref(urlQ.value)
let written = urlQ.value

watch(urlQ, (next) => {
  if (next !== written)
    draft.value = next
})

// Whitespace is not a search, so it resolves to the same URL as an empty
// field — and comparing the *target* rather than the draft is what stops a
// field holding only spaces from rescheduling a write it can never satisfy.
const target = computed(() => draft.value.trim() === '' ? '' : draft.value)

watch([target, urlQ], ([next, current], _, onCleanup) => {
  if (next === current)
    return

  const timer = setTimeout(() => {
    // `replace`, so a typed word leaves one history entry rather than one per
    // keystroke (ADR 0004 §5). Absent rather than empty, to keep the URL
    // clean; `c` and the route are untouched — filtering never changes which
    // combo is selected.
    written = next
    void router.replace({ query: toHubQuery({ ...search.value, q: next === '' ? undefined : next }) })
  }, SEARCH_DEBOUNCE_MS)

  onCleanup(() => clearTimeout(timer))
})
</script>

<template>
  <div class="filter-bar">
    <label class="sr-only" for="combo-search">Search combinations</label>
    <input
      id="combo-search"
      v-model="draft"
      type="search"
      class="filter-field"
      autocomplete="off"
      placeholder="Search by colour name, hex or number…"
    >

    <!--
      Buttons rather than links, despite `size` living in the URL exactly as `c`
      does. A link to the current route would carry the router's own
      `aria-current="page"` — so every chip would claim to be the current page —
      and "open in a new tab" is not a meaningful thing to want from a toggle.
      The push a link gives for free is one call instead. `aria-pressed` is what
      the engaged look is styled off, so the look and the announced state cannot
      drift apart.
    -->
    <div class="filter-chips" role="group" aria-label="Filter by size">
      <button
        type="button"
        class="filter-chip"
        :aria-pressed="search.size === undefined"
        @click="toggleSize(undefined)"
      >
        {{ `Any (${source.length})` }}
      </button>
      <button
        v-for="size in COMBO_SIZES"
        :key="size"
        type="button"
        class="filter-chip"
        :aria-pressed="search.size === size"
        @click="toggleSize(size)"
      >
        {{ `${size} colours (${counts[size]})` }}
      </button>
    </div>

    <!-- `<output>` is a live region by default, so the count is announced as
         the list narrows without the field losing focus. -->
    <output class="filter-count">{{ `${shown} shown` }}</output>
  </div>
</template>

<style scoped>
/* Filters and search (ADR 0006 §7): a sticky bar directly under the header,
   holding the field, the size chips with their facet counts, and a live count.
   It bleeds to main's padding edges so the grid scrolls under it rather than
   past its sides. */
.filter-bar {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-inline: -1.5rem;
  margin-block-end: 1.25rem;
  padding: 0.85rem 1.5rem;
  background: var(--canvas);
  border-block-end: 1px solid var(--border);
  transition:
    background-color var(--dur-theme) var(--ease),
    border-color var(--dur-theme) var(--ease),
    color var(--dur-theme) var(--ease);
}

.filter-field {
  flex: 1 1 16rem;
  min-inline-size: 0;
  font: inherit;
  font-size: 0.9rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.45rem;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filter-chip {
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  line-height: 1;
  white-space: nowrap;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
}

/* --accent is spent only on interactive state (ADR 0006 §4), and an engaged
   filter is exactly that. */
.filter-chip[aria-pressed='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.filter-count {
  font-size: 0.8rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
</style>
