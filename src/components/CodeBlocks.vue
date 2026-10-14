<script setup lang="ts">
import type { ComboScale } from '../lib/scale'
import type { CodeTab } from '../ui/codeTabs'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, ref, shallowRef, watchEffect } from 'vue'
import { CODE_TABS } from '../ui/codeTabs'
import CopyButton from './CopyButton.vue'
import CopyIcon from './CopyIcon.vue'

/**
 * Tabbed code blocks, each an emitter's output byte for byte (ADR 0013 §1).
 * Shiki loads lazily; until then the text shows plain.
 */
const props = defineProps<{ scale: ComboScale }>()

const active = ref<CodeTab['id']>('css')
const tab = computed(() => CODE_TABS.find(t => t.id === active.value)!)
const code = computed(() => tab.value.code(props.scale))
const install = computed(() => tab.value.install(props.scale.id))

/** Highlighted HTML for the current block, empty until Shiki is done. */
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
</script>

<template>
  <TabsRoot v-model="active" class="code" activation-mode="automatic">
    <TabsList class="code-tabs" aria-label="Export format">
      <TabsIndicator class="code-indicator" />
      <TabsTrigger v-for="t in CODE_TABS" :key="t.id" :value="t.id" class="code-tab">
        {{ t.label }}
      </TabsTrigger>
    </TabsList>

    <TabsContent :value="active" class="code-panel">
      <div class="code-install">
        <code>{{ install }}</code>
        <CopyButton v-slot="{ copied }" class="code-copy" :text="install" :label="`Copy ${install}`">
          <CopyIcon :copied="copied" />
        </CopyButton>
      </div>

      <div class="code-block">
        <CopyButton v-slot="{ copied }" class="code-copy code-copy-block" :text="code" :label="`Copy the ${tab.label} code`">
          <CopyIcon :copied="copied" />
          <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
        </CopyButton>
        <!-- Shiki's output: our own emitter text, escaped by Shiki, never
             user input. Its `<pre>` is focusable so the block scrolls by key. -->
        <div v-if="html" class="code-shiki" data-code v-html="html" />
        <pre v-else class="code-plain" tabindex="0" data-code><code>{{ code }}</code></pre>
      </div>
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
.code {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-sm);
}

/* A pill track with a sliding vermilion blob under the selected tab. */
.code-tabs {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  inline-size: fit-content;
  max-inline-size: 100%;
  padding: 0.25rem;
  border-radius: var(--radius-pill);
  background: var(--bg-sunk);
}

.code-indicator {
  position: absolute;
  inset-block: 0.25rem;
  inset-inline-start: 0;
  inline-size: var(--reka-tabs-indicator-size);
  translate: var(--reka-tabs-indicator-position) 0;
  border-radius: var(--radius-pill);
  background: var(--shu);
  transition:
    translate var(--dur) var(--ease-bounce),
    inline-size var(--dur) var(--ease-bounce);
}

.code-tab {
  position: relative;
  padding: 0.35rem 0.9rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--ink-muted);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease);
}

.code-tab[data-state='active'] {
  color: var(--on-shu);
}

.code-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-sm);
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
  padding: 0.5rem 0.8rem;
  border-radius: var(--radius-sm);
  background: var(--bg-sunk);
  font-family: var(--mono);
  font-size: var(--text-xs);
}

.code-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex: none;
  min-block-size: 2rem;
  min-inline-size: 2rem;
  padding-inline: 0.5rem;
  border: 2px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--bg-raised);
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
}

.code-copy.is-copied {
  border-color: var(--kin);
  color: var(--kin);
}

.code-block {
  position: relative;
}

.code-copy-block {
  position: absolute;
  inset-block-start: var(--space-xs);
  inset-inline-end: var(--space-xs);
  z-index: 1;
  padding-inline: 0.75rem;
}

/* The two `<pre>`s share one box: before Shiki lands, and after. */
.code-plain,
.code-shiki :deep(pre) {
  margin: 0;
  max-block-size: 24rem;
  overflow: auto;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-family: var(--mono);
  font-size: var(--text-xs);
  line-height: 1.65;
  tab-size: 2;
}

.code-plain {
  background: var(--bg-sunk);
  color: var(--ink);
}
</style>
