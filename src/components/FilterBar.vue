<script setup lang="ts">
import type { HueFamily } from '../data/hue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHubSearch } from '../composables/useHubSearch'
import { HUE_FAMILIES } from '../data/hue'
import { toHubQuery } from '../routing/search'
import { onColour } from '../theme/colour'
import { HUE_DOT, HUE_KANJI } from '../ui/japanese'

/**
 * Search and the hue chips. Both write the URL with `replace`, so typing never
 * fills the history (ADR 0015).
 */
defineProps<{ shown: number }>()

const router = useRouter()
const search = useHubSearch()

// The URL follows the field, and the field follows the URL only on Back.
const text = ref(search.value.q ?? '')
watch(() => search.value.q, (q) => {
  if ((q ?? '') !== text.value)
    text.value = q ?? ''
})
watch(text, (q) => {
  const next = q === '' ? undefined : q
  if (next !== search.value.q)
    void router.replace({ query: toHubQuery({ ...search.value, q: next }) })
})

function toggleHue(hue: HueFamily) {
  void router.replace({ query: toHubQuery({ ...search.value, hue: search.value.hue === hue ? undefined : hue }) })
}
</script>

<template>
  <div class="bar" role="search">
    <label class="search">
      <span class="sr-only">Search combinations</span>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4" />
        <path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
      <input
        v-model="text"
        type="search"
        placeholder="Name, hex or number…"
        autocomplete="off"
        spellcheck="false"
      >
    </label>

    <ul class="hues" aria-label="Filter by hue">
      <li v-for="hue in HUE_FAMILIES" :key="hue">
        <button
          type="button"
          class="hue"
          :aria-pressed="search.hue === hue"
          :style="{ '--dot': HUE_DOT[hue], '--on-dot': onColour(HUE_DOT[hue]) }"
          @click="toggleHue(hue)"
        >
          <span class="hue-kanji" aria-hidden="true">{{ HUE_KANJI[hue] }}</span>
          {{ hue }}
        </button>
      </li>
    </ul>

    <p class="count" aria-live="polite">
      {{ shown }} {{ shown === 1 ? 'combo' : 'combos' }}
    </p>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-md);
}

.search {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex: 1 1 16rem;
  max-inline-size: 24rem;
  padding: 0 1rem;
  border: 2px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--bg-sunk);
  color: var(--ink-muted);
  transition: border-color var(--dur-fast) var(--ease);
}

.search:focus-within {
  border-color: var(--kin);
  color: var(--ink);
}

.search input {
  flex: 1;
  min-inline-size: 0;
  block-size: 2.75rem;
  border: 0;
  background: none;
  color: var(--ink);
  font: inherit;
  outline: none;
}

.search input::placeholder {
  color: var(--ink-muted);
}

.hues {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* A chip with a coloured kanji blob. Pressed fills it with the hue itself. */
.hue {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.75rem 0.2rem 0.2rem;
  border: 2px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--bg-raised);
  font-size: var(--text-sm);
  font-weight: 500;
  text-transform: capitalize;
  cursor: pointer;
  transition:
    transform var(--dur) var(--ease-bounce),
    border-color var(--dur-fast) var(--ease);
}

.hue-kanji {
  display: grid;
  place-items: center;
  inline-size: 1.7rem;
  block-size: 1.7rem;
  border-radius: 50%;
  background: var(--dot);
  color: var(--on-dot);
  font-size: 0.85rem;
  font-weight: 700;
}

@media (hover: hover) {
  .hue:hover {
    transform: translateY(-2px) rotate(-2deg);
    border-color: var(--line-strong);
  }
}

.hue[aria-pressed='true'] {
  border-color: var(--dot);
  background: color-mix(in oklch, var(--dot) 22%, var(--bg-raised));
}

.count {
  margin: 0 0 0 auto;
  color: var(--ink-muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}
</style>
