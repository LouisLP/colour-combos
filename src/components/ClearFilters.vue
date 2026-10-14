<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useHubSearch } from '../composables/useHubSearch'
import { toHubQuery } from '../routing/search'

/**
 * The way out of an empty result. An empty grid is a live surface, not a dead
 * end (ADR 0006 §7), and this is the part that makes it one.
 *
 * Clears `q` and `size` together and leaves `c` alone — the page keeps the
 * combo it is wearing, because filtering never selected it in the first place.
 *
 * A button rather than a link for the same reason the chips are: its target is
 * the current route, so a `<RouterLink>` would advertise itself as
 * `aria-current="page"` while offering to change the page.
 */
const router = useRouter()
const search = useHubSearch()

function clear() {
  void router.push({ query: toHubQuery({ c: search.value.c }) })
}
</script>

<template>
  <button type="button" class="filter-clear" @click="clear">
    Clear filters
  </button>
</template>

<style scoped>
.filter-clear {
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.45rem 0.9rem;
  border-radius: 0.45rem;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
}
</style>
