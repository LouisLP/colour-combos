<script setup lang="ts">
import { useAnnouncement } from '../composables/useAnnouncement'

/**
 * The visible half of a copy on the combo page: the announcer's message, shown
 * at the foot of the screen. The spoken half is the layout's live region
 * (ADR 0014 §5), so this is hidden from assistive tech rather than saying it
 * twice.
 *
 * Only the combo page mounts it. On browse every copy already lights its own
 * chip; here a value can be long and the chip small, so the toast says which
 * value landed.
 */
const announcement = useAnnouncement()
</script>

<template>
  <Transition name="toast">
    <p v-if="announcement" class="toast" aria-hidden="true">
      {{ announcement }}
    </p>
  </Transition>
</template>

<style scoped>
/* `--surface` on `--ink`, the inverse pairing the card's "Theming this page"
   pill uses: `--ink` clears 4.5:1 on every surface, both ways round. */
.toast {
  position: fixed;
  inset-block-end: var(--space-lg);
  inset-inline: 0;
  inline-size: fit-content;
  max-inline-size: calc(100% - 2 * var(--space-md));
  margin: 0 auto;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-pill);
  background: var(--ink);
  color: var(--surface);
  font-family: var(--mono);
  font-size: var(--text-xs);
  box-shadow: var(--shadow-md);
  overflow-wrap: anywhere;
  pointer-events: none;
  z-index: 10;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
