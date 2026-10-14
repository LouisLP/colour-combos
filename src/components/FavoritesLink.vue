<script setup lang="ts">
import { useFavoritesCount } from '../composables/useFavorites'
import { useHubSearch } from '../composables/useHubSearch'
import { carryHubSearch, toHubQuery } from '../routing/search'

/**
 * The persistent entry point, with a live count (ADR 0003 §3). The count
 * doubles as feedback that a star toggle registered, and reads plain at zero
 * rather than as `(0)`.
 *
 * Its own component, not inlined into `HubLayout`: reading the count here keeps
 * a star toggle re-rendering a link and one card, and never the layout that
 * owns the grid.
 */
const count = useFavoritesCount()
const search = useHubSearch()
</script>

<template>
  <RouterLink :to="{ path: '/favorites', query: toHubQuery(carryHubSearch(search)) }">
    {{ count === 0 ? 'Favourites' : `★ Favourites (${count})` }}
  </RouterLink>
</template>
