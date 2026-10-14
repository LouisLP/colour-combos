<script setup lang="ts">
import type { ColourFormat } from '../lib/format'
import type { ComboScale } from '../lib/scale'
import type { Mode } from '../theme/adapt'
import { computed } from 'vue'
import { semanticPairs } from '../lib/emit/shared'
import { formatColour } from '../lib/format'
import CopyButton from './CopyButton.vue'

/**
 * The semantic layer rendered as a small UI, light and dark side by side — the
 * old site-wide re-theme, now a preview of what the scale exports (ADR 0012 §9).
 *
 * Each pane redeclares the role tokens from the scale's values for its mode,
 * so the same markup renders both, and every pairing in it is one the AA sweep
 * proves for that mode (`adapt.sweep.test.ts`). Below each mock, every role's
 * value copies in the viewer's notation.
 */
const props = defineProps<{
  scale: ComboScale
  format: ColourFormat
}>()

const MODES: readonly Mode[] = ['light', 'dark']

const roles = computed(() => semanticPairs(props.scale))

/** The pane's tokens: the scale's exact values for one mode, under the page's own names. */
function paneStyle(mode: Mode): Record<string, string> {
  const style: Record<string, string> = { 'color-scheme': mode }
  for (const [role, value] of Object.entries(props.scale.semantic[mode]))
    style[`--${role}`] = value.hex
  return style
}
</script>

<template>
  <div class="preview">
    <section
      v-for="mode in MODES"
      :key="mode"
      class="preview-pane"
      :style="paneStyle(mode)"
      :aria-label="`${mode === 'light' ? 'Light' : 'Dark'} mode`"
    >
      <p class="preview-mode">
        {{ mode === 'light' ? 'Light' : 'Dark' }}
        <span v-if="mode === scale.canonicalMode" class="preview-canonical">canonical</span>
      </p>

      <!-- A mock, not a form: nothing here submits, and the controls are
           inert so they never join the page's Tab order. -->
      <div class="preview-card" inert>
        <p class="preview-title">
          Order summary
        </p>
        <p class="preview-body">
          Three items, shipping in two days. <a href="#preview">Change address</a>
        </p>
        <label class="preview-field">
          <span>Discount code</span>
          <input type="text" placeholder="WADA1933">
        </label>
        <div class="preview-actions">
          <button type="button" class="preview-primary">
            Pay now
          </button>
          <button type="button" class="preview-secondary">
            Cancel
          </button>
        </div>
      </div>

      <ul class="preview-roles">
        <li v-for="pair in roles" :key="pair.role">
          <i :style="{ background: pair[mode].hex }" />
          <span class="preview-role">{{ pair.role }}</span>
          <CopyButton
            v-slot="{ copied }"
            class="preview-value"
            :text="formatColour(pair[mode], format)"
            :label="`Copy ${mode} ${pair.role} ${formatColour(pair[mode], format)}`"
          >
            {{ copied ? 'Copied' : formatColour(pair[mode], format) }}
          </CopyButton>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: var(--space-md);
}

/* Everything in a pane reads the redeclared tokens, so its pairings are the
   scale's for that mode, not the page's. */
.preview-pane {
  display: grid;
  align-content: start;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--canvas);
  color: var(--ink);
}

.preview-mode {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* `--on-accent` on `--accent`, the pairing the sweep proves at 4.5:1. */
.preview-canonical {
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--on-accent);
  letter-spacing: 0.04em;
}

.preview-card {
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.preview-title {
  margin: 0;
  font-weight: 600;
}

.preview-body {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.preview-body a {
  color: var(--accent-text);
}

.preview-field {
  display: grid;
  gap: 0.25rem;
  font-size: var(--text-sm);
}

.preview-field input {
  font: inherit;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--canvas);
  color: var(--ink);
}

.preview-field input::placeholder {
  color: var(--ink-muted);
}

.preview-actions {
  display: flex;
  gap: var(--space-xs);
}

.preview-actions button {
  font: inherit;
  font-size: var(--text-sm);
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
}

.preview-primary {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

.preview-secondary {
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--ink);
}

.preview-roles {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-xs);
}

.preview-roles li {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  border-block-end: 1px solid var(--border);
}

.preview-roles i {
  flex: none;
  inline-size: 0.9rem;
  block-size: 0.9rem;
  border-radius: 0.2rem;
  box-shadow: inset 0 0 0 1px var(--border-strong);
}

.preview-role {
  flex: 1;
  font-family: var(--mono);
}

.preview-value {
  min-block-size: 1.75rem;
  padding-inline: 0.35rem;
  border: 0;
  background: none;
  font-family: var(--mono);
  font-size: inherit;
  color: var(--ink-muted);
  cursor: pointer;
}

@media (hover: hover) {
  .preview-value:hover {
    color: var(--ink);
    text-decoration: underline;
  }
}
</style>
