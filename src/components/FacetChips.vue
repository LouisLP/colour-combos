<script setup lang="ts" generic="T extends string | number">
/**
 * One row of filter chips over a closed set of values, each carrying its facet
 * count (ADR 0006 §7). Size, hue family and mode are all this shape (ADR 0014
 * §3): an `Any` chip that clears the filter, one chip per value, and exactly one
 * engaged.
 *
 * Buttons rather than links, despite every filter living in the URL. A link to
 * the current route would carry the router's own `aria-current="page"` — so
 * every chip would claim to be the current page — and "open in a new tab" is
 * not a meaningful thing to want from a toggle. `aria-pressed` is what the
 * engaged look is styled off, so the look and the announced state cannot drift
 * apart.
 *
 * Presentational: it emits the value pressed and the bar decides what that does
 * to the URL.
 */
defineProps<{
  /** The group's accessible name, e.g. `Filter by size`. */
  label: string
  /** The `Any` chip's text, before its count. */
  anyLabel: string
  /** The unfiltered total, for the `Any` chip. */
  total: number
  options: readonly { value: T, label: string, count: number }[]
  /** The engaged value, or `undefined` for `Any`. */
  selected: T | undefined
}>()

defineEmits<{
  toggle: [value: T | undefined]
}>()
</script>

<template>
  <div class="filter-chips" role="group" :aria-label="label">
    <button
      type="button"
      class="filter-chip"
      :aria-pressed="selected === undefined"
      @click="$emit('toggle', undefined)"
    >
      {{ `${anyLabel} (${total})` }}
    </button>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="filter-chip"
      :aria-pressed="selected === option.value"
      @click="$emit('toggle', option.value)"
    >
      {{ `${option.label} (${option.count})` }}
    </button>
  </div>
</template>

<style scoped>
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
</style>
