<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CodeBlocks from '../components/CodeBlocks.vue'
import CopyButton from '../components/CopyButton.vue'
import CopyIcon from '../components/CopyIcon.vue'
import CopyToast from '../components/CopyToast.vue'
import FormatToggle from '../components/FormatToggle.vue'
import ScaleRamp from '../components/ScaleRamp.vue'
import SemanticPreview from '../components/SemanticPreview.vue'
import StarButton from '../components/StarButton.vue'
import { useColourFormat } from '../composables/useColourFormat'
import { useIsFavorite } from '../composables/useFavorites'
import { useHubSearch } from '../composables/useHubSearch'
import { useSelectedCombo } from '../composables/useSelectedCombo'
import { COMBO_COUNT, comboHexes, comboLabel } from '../data/combos'
import { accentName } from '../lib/emit/shared'
import { buildScale } from '../lib/scale'
import { comboPage } from '../routing/search'
import { announce } from '../state/announcer'
import { toggle } from '../state/favorites'
import { isBareShortcut } from '../ui/keyboard'

/**
 * One combo's page (T6, ADR 0004 §10): how to *use* it. The raw swatches, the
 * full scale, the semantic layer previewed in both modes, and the code — every
 * value one click or keypress from the clipboard.
 *
 * The path names the combo and the theme follows it, so the page is always
 * dressed in the combo it describes. The layout's identity band stands down
 * here: this header is a bigger one.
 */
const search = useHubSearch()
const combo = useSelectedCombo()
const format = useColourFormat()
const router = useRouter()

const scale = computed(() => buildScale(combo.value))
const favorited = useIsFavorite(() => combo.value.id)

/** Wraps at both ends, so `←` on No. 1 is No. 348. */
const prevId = computed(() => combo.value.id === 1 ? COMBO_COUNT : combo.value.id - 1)
const nextId = computed(() => combo.value.id === COMBO_COUNT ? 1 : combo.value.id + 1)

/** `accent`, `accent-2`, … for a colour ramp, by its rank in the scale. */
function roleOf(index: number): string | undefined {
  const rank = scale.value.accents.indexOf(index)
  return rank === -1 ? undefined : accentName(rank)
}

function onToggleFavorite(id: number) {
  const adding = !favorited.value
  toggle(id)
  announce(adding ? `Added No. ${id} to favourites` : `Removed No. ${id} from favourites`)
}

/**
 * `←` / `→` step through the catalogue. A bare-key shortcut, so it never fires
 * in a field or with a modifier, and stands down when something focused has
 * already claimed the arrow (the code tabs) (ADR 0014 §4).
 */
function onKeydown(event: KeyboardEvent) {
  if (!isBareShortcut(event) || event.shiftKey)
    return
  const to = { ArrowLeft: prevId.value, ArrowRight: nextId.value }[event.key]
  if (to === undefined)
    return
  event.preventDefault()
  void router.push(comboPage(to, search.value))
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <article class="combo-page">
    <header class="combo-head">
      <!-- Raw Wada hex, never a role (ADR 0001 §4). Each swatch copies its own
           exact hex, whatever the format toggle says. -->
      <div class="combo-head-swatches">
        <CopyButton
          v-for="colour in combo.colours"
          :key="colour.index"
          v-slot="{ copied }"
          class="combo-head-swatch"
          :style="{ background: colour.hex }"
          :text="colour.hex"
          :label="`Copy ${colour.name} ${colour.hex}`"
        >
          <span class="combo-head-chip">
            <CopyIcon :copied="copied" />
            {{ colour.hex }}
          </span>
        </CopyButton>
      </div>

      <div class="combo-head-meta">
        <div class="combo-head-title">
          <h1 class="combo-head-id">
            {{ `Combination No. ${combo.id}` }}
          </h1>
          <p class="combo-head-names">
            {{ comboLabel(combo) }}
          </p>
          <p class="combo-head-facts">
            <span>{{ `${combo.colours.length} colours` }}</span>
            <span>{{ `Canonical mode: ${scale.canonicalMode}` }}</span>
          </p>
        </div>

        <div class="combo-head-actions">
          <CopyButton
            v-slot="{ copied }"
            class="combo-head-copy"
            :text="comboHexes(combo)"
            :label="`Copy all hexes of combination ${combo.id}`"
          >
            <CopyIcon :copied="copied" />
            <span>Copy hexes</span>
          </CopyButton>
          <StarButton :combo-id="combo.id" :pressed="favorited" @toggle="onToggleFavorite" />
        </div>
      </div>

      <nav class="combo-pager" aria-label="Combinations">
        <RouterLink :to="comboPage(prevId, search)" rel="prev" aria-keyshortcuts="ArrowLeft">
          <kbd aria-hidden="true">←</kbd>
          {{ `No. ${prevId}` }}
        </RouterLink>
        <RouterLink :to="comboPage(nextId, search)" rel="next" aria-keyshortcuts="ArrowRight">
          {{ `No. ${nextId}` }}
          <kbd aria-hidden="true">→</kbd>
        </RouterLink>
      </nav>
    </header>

    <section class="combo-section" aria-labelledby="scale-heading">
      <div class="combo-section-head">
        <h2 id="scale-heading">
          Scale
        </h2>
        <FormatToggle />
      </div>
      <p class="combo-section-lede">
        Eleven steps per colour, placed by luminance: any two steps 500 apart clear 4.5:1.
        <span aria-hidden="true">◆</span> marks the exact Wada colour.
      </p>
      <div class="combo-ramps">
        <ScaleRamp
          v-for="(ramp, i) in scale.ramps"
          :key="ramp.slug"
          :name="ramp.name"
          :role="roleOf(i)"
          :anchor="ramp.anchor"
          :steps="ramp.steps"
          :format="format"
        />
        <ScaleRamp name="Neutral" role="neutral" :steps="scale.neutral.steps" :format="format" />
      </div>
    </section>

    <section class="combo-section" aria-labelledby="semantic-heading">
      <h2 id="semantic-heading">
        Semantic roles
      </h2>
      <SemanticPreview :scale="scale" :format="format" />
    </section>

    <section class="combo-section" aria-labelledby="code-heading">
      <h2 id="code-heading">
        Code
      </h2>
      <CodeBlocks :scale="scale" :format="format" />
    </section>

    <CopyToast />
  </article>
</template>

<style scoped>
.combo-page {
  display: grid;

  /* `minmax(0, …)`, not `auto`: a code block's unbroken lines would otherwise
     widen the track past a phone's viewport instead of scrolling inside it. */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-xl);
}

/* Butts flush under the header rule, as the identity band it replaces does
   (ADR 0010): the negative margins cancel `main`'s padding. */
.combo-head {
  margin-block-start: calc(-1 * var(--space-xl));
  margin-inline: calc(-1 * var(--space-lg));
  background: var(--surface);
  border-block-end: 1px solid var(--border);
}

.combo-head-swatches {
  display: flex;
  block-size: 8rem;
}

/* The whole swatch is the copy target; the hex rides on a `--surface` chip so
   it stays legible over any raw colour (ADR 0007). */
.combo-head-swatch {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 0 var(--space-xs);
  border: 0;
  font: inherit;
  cursor: pointer;
}

.combo-head-swatch:focus-visible {
  outline: none;
  box-shadow:
    inset 0 0 0 3px var(--accent),
    inset 0 0 0 5px var(--surface);
}

.combo-head-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
}

.combo-head-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg) var(--space-sm);
}

.combo-head-id {
  margin: 0;
  font-family: var(--serif);
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: lining-nums tabular-nums;
}

.combo-head-names {
  margin: 0.2rem 0 0;
  color: var(--ink-muted);
}

.combo-head-facts {
  display: flex;
  gap: var(--space-md);
  margin: 0.2rem 0 0;
  font-size: var(--text-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.combo-head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* The star, out of its card overlay and into the row. */
.combo-head-actions .combo-star {
  position: static;
}

.combo-head-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-block-size: 2rem;
  padding-inline: 0.6rem;
  font: inherit;
  font-size: var(--text-sm);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}

.combo-pager {
  display: flex;
  justify-content: space-between;
  padding: 0 var(--space-lg) var(--space-sm);
  font-size: var(--text-sm);
}

.combo-pager a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-block-size: 1.5rem;
}

.combo-pager kbd {
  font-family: var(--mono);
  font-size: var(--text-xs);
  padding: 0 0.3rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.25rem;
  color: var(--ink-muted);
}

.combo-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-sm);
}

.combo-section h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.combo-section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.combo-section-lede {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.combo-ramps {
  display: grid;
  gap: var(--space-md);
}
</style>
