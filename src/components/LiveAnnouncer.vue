<script setup lang="ts">
import { useAnnouncement } from '../composables/useAnnouncement'

/**
 * The app's single polite live region (ADR 0014 §5). Mounted once in the layout,
 * so it outlives any card that asked it to speak.
 */
const announcement = useAnnouncement()
</script>

<template>
  <p class="sr-only" role="status" aria-live="polite">
    {{ announcement }}
  </p>
</template>
