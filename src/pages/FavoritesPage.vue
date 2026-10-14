<script setup lang="ts">
import { computed } from 'vue'
import ClearFilters from '../components/ClearFilters.vue'
import ComboResults from '../components/ComboResults.vue'
import FilterBar from '../components/FilterBar.vue'
import { useFavorites } from '../composables/useFavorites'
import { useHubSearch } from '../composables/useHubSearch'
import { COMBO_COUNT, requireCombo } from '../data/combos'
import { filterCombos } from '../data/filter'
import { carryHubSearch, toHubQuery } from '../routing/search'

/**
 * The starred combos, in insertion order — newest first (ADR 0003 §3).
 *
 * The route's only job is to supply a different source list: the same results as
 * browse, the same `c`/`q`/`size` contract, no duplicated UI. Ordering is the
 * one thing it differs from browse on, and that is deliberate.
 *
 * `q`, `size`, `hue` and `mode` narrow this list through the same `filterCombos` call browse
 * makes, over params every link carried across the navigation. A
 * `/favorites?q=blue` link therefore behaves exactly as `/?q=blue` does, with
 * no route-specific handling on either side.
 */
const ids = useFavorites()
const search = useHubSearch()

// Safe by construction: the store drops ids the catalogue does not contain.
const combos = computed(() => ids.value.map(requireCombo))
const shown = computed(() => filterCombos(combos.value, search.value))
</script>

<template>
  <section>
    <!-- The visible page identity is the site header; this is for structure. -->
    <h1 class="sr-only">
      Favourite combinations
    </h1>

    <!-- An empty list has nothing to narrow, and a filter bar over it would be
         chrome offering to do nothing. Counts run over the favourites, not the
         catalogue, so the chips stay facts about what is actually here. -->
    <FilterBar v-if="combos.length > 0" :source="combos" :shown="shown.length" />

    <!-- Two ways to be empty, and they need different exits: no favourites at
         all is a prompt to go and star some, while a filter that excludes all
         of them is a prompt to widen the filter. Telling someone with 40
         favourites that they have none would read as the feature being broken. -->
    <ComboResults :combos="shown">
      <template #empty>
        <template v-if="combos.length === 0">
          <p class="combo-empty-heading">
            ★ No favourites yet
          </p>
          <p>Star any combination to save it here.</p>
          <RouterLink :to="{ path: '/', query: toHubQuery(carryHubSearch(search)) }">
            {{ `Browse all ${COMBO_COUNT} →` }}
          </RouterLink>
        </template>
        <template v-else>
          <p class="combo-empty-heading">
            No favourites match that.
          </p>
          <p>Search covers colour names, hex values and the combination number.</p>
          <ClearFilters />
        </template>
      </template>
    </ComboResults>
  </section>
</template>
