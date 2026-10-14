<script setup lang="ts">
/**
 * The copy glyph, swapping to a check while a copy is confirmed. Shared by every
 * copy control so they all confirm the same way (ADR 0007 §4).
 */
defineProps<{ copied: boolean }>()
</script>

<template>
  <!-- The check only ever mounts after a copy, so animating it on mount *is* the
       confirmation — a small spring as the tick lands, replayed on every copy. -->
  <svg v-if="copied" class="copy-check" viewBox="0 0 24 24" aria-hidden="true" width="14" height="14">
    <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
  <svg v-else viewBox="0 0 24 24" aria-hidden="true" width="14" height="14">
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.7" />
    <path d="M15.5 5.5H6.5a2 2 0 0 0-2 2v9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
.copy-check {
  animation: copy-pop var(--dur) var(--ease);
}

@keyframes copy-pop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
</style>
