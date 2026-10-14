<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHubSearch } from '../composables/useHubSearch'
import { NOT_FOUND_STATE_KEY } from '../routing/router'

/**
 * The longest rejected `c` worth echoing back. `?c=` accepts anything, so the
 * value is unbounded user input; past a couple of dozen characters it stops
 * being recognisable as "what I typed" and starts being a layout problem.
 */
const MAX_ECHO = 24

/**
 * The "Combo 999 not found — showing 71" notice of ADR 0004 §8.
 *
 * The rejected value is read from history state rather than the URL: the
 * router guard already `replaceState`d the resolved combo in, so the URL no
 * longer has it. History state survives that replace but not a reload, which is
 * right — it is a transient explanation of what just happened, not a fact about
 * the app (ADR 0005 §7).
 *
 * Without this a mistyped or stale shared link is silently swallowed: the
 * recipient lands on a random combo that looks exactly like a normal first
 * visit, and the link's author is never told their link is dead.
 */
const route = useRoute()
const router = useRouter()
const search = useHubSearch()

// History state is not reactive, but it only changes with a navigation, so the
// route is the signal to read it again. The router writes the state before it
// publishes the new route, so the read always sees the entry it landed on.
const rejected = computed(() => {
  void route.fullPath
  const value = router.options.history.state[NOT_FOUND_STATE_KEY]
  return typeof value === 'string' ? value : undefined
})

// The dismissed *value*, not a boolean: a second bad link arriving in the same
// document is a second thing to explain, and a boolean would swallow it.
const dismissed = ref<string>()

const echo = computed(() => {
  const value = rejected.value ?? ''
  return value.length > MAX_ECHO ? `${value.slice(0, MAX_ECHO)}…` : value
})
</script>

<template>
  <div v-if="rejected !== undefined && rejected !== dismissed" class="notice" role="status">
    <p>{{ `Combo ${echo} not found — showing ${search.c}.` }}</p>
    <button
      type="button"
      class="notice-dismiss"
      aria-label="Dismiss"
      @click="dismissed = rejected"
    >
      <span aria-hidden="true">✕</span>
    </button>
  </div>
</template>

<style scoped>
/* The "combo not found" notice (ADR 0004 §8). Framed in --border-strong rather
   than filled with --accent: the accent is spent on interactive state only
   (ADR 0006 §4), and a notice is something to read, not something to press. */
.notice {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-block-end: var(--space-lg);
  padding: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-md);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    background-color var(--dur-theme) var(--ease),
    border-color var(--dur-theme) var(--ease),
    color var(--dur-theme) var(--ease);
}

.notice p {
  flex: 1;
  min-inline-size: 0;
  margin: 0;
  font-size: var(--text-sm);
}

/* 2rem square: WCAG 2.2 §2.5.8 puts the floor at 24px, and the glyph alone is
   well under it. */
.notice-dismiss {
  flex: none;
  display: grid;
  place-items: center;
  inline-size: 2rem;
  block-size: 2rem;
  font: inherit;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  border: 0;
  border-radius: 0.35rem;
  background: none;
  color: var(--ink-muted);
}
</style>
