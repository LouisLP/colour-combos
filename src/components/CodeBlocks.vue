<script setup lang="ts">
import type { ColourFormat } from '../lib/format'
import type { ComboScale } from '../lib/scale'
import type { CodeTab } from '../ui/codeTabs'
import { computed, nextTick, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import { CODE_TABS } from '../ui/codeTabs'
import CopyButton from './CopyButton.vue'
import CopyIcon from './CopyIcon.vue'

/**
 * The combo's export formats as tabbed code blocks (T6). Every block is an
 * emitter's output, byte for byte — the same text the package ships, so what
 * is copied here is what `import` would load (ADR 0013 §1).
 *
 * Highlighting is Shiki, loaded on first use with a dynamic `import()`, so it
 * never weighs on the browse page. Until it lands the block is the same text,
 * unhighlighted: copying works from the first frame.
 */
const props = defineProps<{
  scale: ComboScale
  format: ColourFormat
}>()

const active = ref<CodeTab['id']>('css')
const tab = computed(() => CODE_TABS.find(t => t.id === active.value)!)
const code = computed(() => tab.value.code(props.scale, props.format))
const install = computed(() => tab.value.install(props.scale.id))

/** Highlighted HTML for the block on screen; empty until Shiki has done it. */
const html = shallowRef('')

watchEffect(async (onCleanup) => {
  const text = code.value
  const lang = tab.value.lang
  let stale = false
  onCleanup(() => {
    stale = true
  })
  html.value = ''
  const { highlight } = await import('../ui/highlight')
  const result = await highlight(text, lang)
  if (!stale)
    html.value = result
})

const tabs = useTemplateRef<HTMLButtonElement[]>('tabs')

/** The WAI-ARIA tabs pattern: arrows, Home and End move and select. */
async function onTabKeydown(event: KeyboardEvent, index: number) {
  const last = CODE_TABS.length - 1
  const next = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }[event.key]
  if (next === undefined)
    return
  // Claimed, so the page's own ←/→ (previous/next combo) stands down.
  event.preventDefault()
  active.value = CODE_TABS[next].id
  await nextTick()
  tabs.value?.[next]?.focus()
}
</script>

<template>
  <div class="code">
    <div class="code-tabs" role="tablist" aria-label="Export format">
      <button
        v-for="(t, i) in CODE_TABS"
        :id="`code-tab-${t.id}`"
        ref="tabs"
        :key="t.id"
        type="button"
        role="tab"
        class="code-tab"
        :aria-selected="t.id === active"
        :aria-controls="`code-panel-${t.id}`"
        :tabindex="t.id === active ? 0 : -1"
        @click="active = t.id"
        @keydown="onTabKeydown($event, i)"
      >
        {{ t.label }}
      </button>
    </div>

    <div
      :id="`code-panel-${tab.id}`"
      class="code-panel"
      role="tabpanel"
      :aria-labelledby="`code-tab-${tab.id}`"
    >
      <div class="code-install">
        <code>{{ install }}</code>
        <CopyButton v-slot="{ copied }" class="code-copy" :text="install" :label="`Copy ${install}`">
          <CopyIcon :copied="copied" />
        </CopyButton>
      </div>

      <!-- The import above loads hex; say so when the block below is not. -->
      <p v-if="format !== 'hex'" class="code-note">
        <template v-if="tab.formatted">
          The package ships hex. This block is <code>{{ `${tab.emitter}(scale, { format: '${format}' })` }}</code>.
        </template>
        <template v-else-if="tab.id === 'json'">
          Always hex: it is what token tools read.
        </template>
        <template v-else>
          Every colour in the scale carries hex, <code>oklch</code> and <code>rgb</code>.
        </template>
      </p>

      <div class="code-block">
        <CopyButton v-slot="{ copied }" class="code-copy code-copy-block" :text="code" :label="`Copy the ${tab.label} code`">
          <CopyIcon :copied="copied" />
          <span>{{ copied ? 'Copied' : 'Copy' }}</span>
        </CopyButton>
        <!-- Shiki's output: our own emitter text, escaped by Shiki, never
             user input. Its `<pre>` is focusable so the block scrolls by key. -->
        <div v-if="html" class="code-shiki" data-code v-html="html" />
        <pre v-else class="code-plain" tabindex="0" data-code><code>{{ code }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  border-block-end: 1px solid var(--border);
}

/* The selected tab wears the accent as an underline, as the active nav route
   does: an accent boundary on `--canvas`, 3:1 by contract (ADR 0009 §2). */
.code-tab {
  font: inherit;
  font-size: var(--text-sm);
  padding: 0.45rem 0.8rem;
  margin-block-end: -1px;
  border: 0;
  border-block-end: 2px solid transparent;
  background: none;
  color: var(--ink-muted);
  cursor: pointer;
}

.code-tab[aria-selected='true'] {
  color: var(--ink);
  border-block-end-color: var(--accent);
}

.code-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-sm);
  padding-block-start: var(--space-sm);
}

.code-install {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-inline-size: 0;
}

.code-install code {
  flex: 1;
  min-inline-size: 0;
  overflow-x: auto;
  white-space: pre;
  padding: 0.45rem 0.6rem;
  font-size: var(--text-sm);
}

.code-note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.code-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex: none;
  min-block-size: 2rem;
  min-inline-size: 2rem;
  justify-content: center;
  padding-inline: 0.45rem;
  font: inherit;
  font-size: var(--text-xs);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}

.code-block {
  position: relative;
}

.code-copy-block {
  position: absolute;
  inset-block-start: var(--space-xs);
  inset-inline-end: var(--space-xs);
  z-index: 1;
}

/* The two `<pre>`s share one box: before Shiki lands, and after. */
.code-plain,
.code-shiki :deep(pre) {
  margin: 0;
  max-block-size: 32rem;
  overflow: auto;
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--mono);
  font-size: var(--text-xs);
  line-height: 1.6;
  tab-size: 2;
}

/* The document's inline `code` chip (muted fill, padding) is for prose; inside
   a block it would stripe every line. */
.code-plain code,
.code-shiki :deep(code) {
  padding: 0;
  border-radius: 0;
  background: none;
  font-size: inherit;
}

/* Before highlighting: the page's own audited pairing. */
.code-plain {
  background: var(--surface-muted);
  color: var(--ink);
}

/* After: Shiki carries both themes as custom properties and the page's
   `color-scheme` picks one, so the block follows the combo's mode. Every token
   colour clears 4.5:1 on its theme's background (`highlight.test.ts`). */
.code-shiki :deep(pre) {
  background: light-dark(var(--shiki-light-bg), var(--shiki-dark-bg));
  color: light-dark(var(--shiki-light), var(--shiki-dark));
}

.code-shiki :deep(span) {
  color: light-dark(var(--shiki-light), var(--shiki-dark));
}
</style>
