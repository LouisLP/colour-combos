<script setup lang="ts">
import { computed } from 'vue'
import ClearFilters from '../components/ClearFilters.vue'
import ComboGrid from '../components/ComboGrid.vue'
import FilterBar from '../components/FilterBar.vue'
import { useHubSearch } from '../composables/useHubSearch'
import { COMBO_COUNT, COMBOS } from '../data/combos'
import { filterCombos } from '../data/filter'

/**
 * The whole catalogue, narrowed by the URL's `q` and `size`.
 *
 * The route supplies the source list and the grid renders whatever it is given
 * (ADR 0006 consequences), so `/favorites` narrows its own list through this
 * same call. The params are route-agnostic and nothing here branches on the
 * route — the two pages differ only in the list they hand over.
 */
const search = useHubSearch()
const shown = computed(() => filterCombos(COMBOS, { q: search.value.q, size: search.value.size }))
</script>

<template>
  <section>
    <!-- The visible page identity is the site header; this is for structure. -->
    <h1 class="sr-only">
      {{ `Browse all ${COMBO_COUNT} combinations` }}
    </h1>
    <FilterBar :source="COMBOS" :shown="shown.length" />
    <ComboGrid :combos="shown">
      <template #empty>
        <p class="combo-empty-heading">
          No combinations match that.
        </p>
        <p>Search covers colour names, hex values and the combination number.</p>
        <ClearFilters />
      </template>
    </ComboGrid>
  </section>
</template>
