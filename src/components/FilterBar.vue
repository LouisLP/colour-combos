<script setup lang="ts">
import type { Combo } from '../data/combos'
import type { HubSearch } from '../routing/search'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHubSearch } from '../composables/useHubSearch'
import { COMBO_SIZES } from '../data/combos'
import { countByHue, countByMode, countBySize } from '../data/filter'
import { HUE_FAMILIES } from '../data/hue'
import { toHubQuery } from '../routing/search'
import { MODES } from '../theme/adapt'
import { isBareShortcut, ROVING_ATTR, SEARCH_FIELD_ID } from '../ui/keyboard'
import DensityToggle from './DensityToggle.vue'
import FacetChips from './FacetChips.vue'
import ShortcutsDialog from './ShortcutsDialog.vue'

/**
 * The sticky bar under the header — search field, live count, layout toggle and
 * the shortcuts key — over a row of facet chips for size, hue family and mode
 * (ADR 0006 §7, ADR 0014 §3). Only the first row sticks: three chip groups
 * wrap to two or three lines, and pinning all of that would cost the results
 * the very screen height the compact list exists to win.
 *
 * The two kinds of control take deliberately different history stances (ADR
 * 0004 §5), and that asymmetry is the whole point of this component:
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

/** Facet counts, read off the unfiltered source so they stay facts (§7). */
const sizes = computed(() => {
  const counts = countBySize(props.source)
  return COMBO_SIZES.map(size => ({ value: size, label: `${size} colours`, count: counts[size] }))
})
const hues = computed(() => {
  const counts = countByHue(props.source)
  return HUE_FAMILIES.map(hue => ({ value: hue, label: capitalise(hue), count: counts[hue] }))
})
const modes = computed(() => {
  const counts = countByMode(props.source)
  return MODES.map(mode => ({ value: mode, label: capitalise(mode), count: counts[mode] }))
})

function capitalise(word: string) {
  return word[0]!.toUpperCase() + word.slice(1)
}

type Facet = 'size' | 'hue' | 'mode'

/**
 * Toggle a facet chip. Clicking the engaged chip clears that filter, so a chip
 * is a toggle rather than a one-way trip into a filtered state — and
 * `aria-pressed` is what says so.
 *
 * `push` — toggling a filter is a discrete, deliberate act, so Back undoes
 * exactly this toggle (ADR 0004 §5). `c` is untouched.
 */
function toggleFacet<K extends Facet>(facet: K, value: HubSearch[K]) {
  const engaged = search.value[facet] === value
  void router.push({ query: toHubQuery({ ...search.value, [facet]: engaged ? undefined : value }) })
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

/** The write the debounce is holding, so a key that needs the results *now* can take it early. */
let pending: (() => Promise<unknown>) | undefined

watch([target, urlQ], ([next, current], _, onCleanup) => {
  if (next === current)
    return

  // `replace`, so a typed word leaves one history entry rather than one per
  // keystroke (ADR 0004 §5). Absent rather than empty, to keep the URL clean;
  // `c` and the route are untouched — filtering never changes which combo is
  // selected.
  const write = () => {
    pending = undefined
    written = next
    return router.replace({ query: toHubQuery({ ...search.value, q: next === '' ? undefined : next }) })
  }
  pending = write
  const timer = setTimeout(write, SEARCH_DEBOUNCE_MS)

  onCleanup(() => {
    clearTimeout(timer)
    if (pending === write)
      pending = undefined
  })
})

/**
 * ↓ or Enter in the field jumps to the first result (ADR 0014 §4), so a combo
 * can be found and opened without the mouse: `/`, type, ↓, Enter.
 *
 * The debounced write is flushed first. Within 250 ms of the last keystroke the
 * results still show the previous query, and "the first result" has to mean the
 * first one for what is in the field.
 */
async function toFirstResult(event: KeyboardEvent) {
  event.preventDefault()
  await pending?.()
  await nextTick()
  document.querySelector<HTMLElement>(`.combo-results [${ROVING_ATTR}]`)?.focus()
}

const field = useTemplateRef<HTMLInputElement>('field')

/** `/` focuses the search from anywhere a shortcut is not being typed. */
function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === '/' && isBareShortcut(event)) {
    event.preventDefault()
    field.value?.focus()
    field.value?.select()
  }
}

onMounted(() => document.addEventListener('keydown', onDocumentKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKeydown))
</script>

<template>
  <div class="filter-bar">
    <label class="sr-only" :for="SEARCH_FIELD_ID">Search combinations</label>
    <input
      :id="SEARCH_FIELD_ID"
      ref="field"
      v-model="draft"
      type="search"
      class="filter-field"
      autocomplete="off"
      aria-keyshortcuts="/"
      placeholder="Search by colour name, hex or number…"
      @keydown.down="toFirstResult"
      @keydown.enter="toFirstResult"
    >

    <!-- `<output>` is a live region by default, so the count is announced as
         the list narrows without the field losing focus. -->
    <output class="filter-count">{{ `${shown} shown` }}</output>
    <DensityToggle />
    <ShortcutsDialog />
  </div>

  <div class="filter-facets">
    <FacetChips
      label="Filter by size"
      any-label="Any"
      :total="source.length"
      :options="sizes"
      :selected="search.size"
      @toggle="toggleFacet('size', $event)"
    />
    <FacetChips
      label="Filter by hue"
      any-label="Any hue"
      :total="source.length"
      :options="hues"
      :selected="search.hue"
      @toggle="toggleFacet('hue', $event)"
    />
    <FacetChips
      label="Filter by mode"
      any-label="Any mode"
      :total="source.length"
      :options="modes"
      :selected="search.mode"
      @toggle="toggleFacet('mode', $event)"
    />
  </div>
</template>

<style scoped>
/* Filters and search (ADR 0006 §7, ADR 0014): a sticky bar directly under the
   header, holding the field, the live count, the layout toggle and the
   shortcuts key. It bleeds to main's padding edges so the grid scrolls under it rather than
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

/* The facets scroll away under the sticky row (see the component comment).
   Hue and mode sit beside size (ADR 0014 §3), each group wrapping on its own. */
.filter-facets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding-block: 0.85rem 1.25rem;
}

.filter-count {
  margin-inline-start: auto;
  font-size: 0.8rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
</style>
