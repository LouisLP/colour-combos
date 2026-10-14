<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import ComboCard from '../components/ComboCard.vue'
import FilterBar from '../components/FilterBar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import SiteHeader from '../components/SiteHeader.vue'
import { useComboDialog } from '../composables/useComboDialog'
import { useHubSearch } from '../composables/useHubSearch'
import { COMBOS } from '../data/combos'
import { filterCombos } from '../data/filter'

/**
 * The whole site (ADR 0015): the catalogue, narrowed by `q` and `hue`, and the
 * details dialog over it.
 *
 * The list reads `q` and `hue` through their own computeds, so opening,
 * stepping or closing the dialog — which only moves `c` — never re-renders the
 * grid.
 */
const search = useHubSearch()
const q = computed(() => search.value.q)
const hue = computed(() => search.value.hue)
const shown = computed(() => filterCombos(COMBOS, { q: q.value, hue: hue.value }))

const { open } = useComboDialog()

// Async, so the scale engine, the emitters and Reka stay out of the first paint;
// it loads straight after.
const ComboDialog = defineAsyncComponent(() => import('../components/ComboDialog.vue'))
</script>

<template>
  <SiteHeader />
  <main>
    <FilterBar :shown="shown.length" class="filters" />
    <ul v-if="shown.length" class="grid" aria-label="Combinations">
      <li v-for="combo in shown" :key="combo.id">
        <ComboCard :combo="combo" @open="open" />
      </li>
    </ul>
    <div v-else class="empty">
      <p class="empty-face" aria-hidden="true">
        (・_・;)
      </p>
      <p>No combinations match that. Search covers colour names, hex values and the combination number.</p>
    </div>
  </main>
  <SiteFooter />
  <ComboDialog />
</template>

<style scoped>
main {
  flex: 1;
  inline-size: 100%;
  max-inline-size: 80rem;
  margin-inline: auto;
  padding: 0 var(--space-lg);
}

/* Sticks under the top edge as the grid scrolls, on a blurred band. */
.filters {
  position: sticky;
  inset-block-start: 0;
  z-index: 5;
  margin-inline: calc(-1 * var(--space-lg));
  padding: var(--space-sm) var(--space-lg);
  background: oklch(from var(--bg) l c h / 0.85);
  backdrop-filter: blur(10px);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
  gap: var(--space-md);
  margin: var(--space-md) 0 0;
  padding: 0;
  list-style: none;
}

.empty {
  padding: var(--space-xl) 0;
  color: var(--ink-muted);
  text-align: center;
}

.empty-face {
  margin: 0;
  color: var(--kin);
  font-size: var(--text-xl);
}

@media (max-width: 40rem) {
  main {
    padding-inline: var(--space-md);
  }

  .filters {
    margin-inline: calc(-1 * var(--space-md));
    padding-inline: var(--space-md);
  }

  .grid {
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: var(--space-sm);
  }
}
</style>
