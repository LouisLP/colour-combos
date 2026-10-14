<script setup lang="ts">
import type { Combo } from '../data/combos'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useComboDialog } from '../composables/useComboDialog'
import { comboHexes, comboLabel } from '../data/combos'
import { accentName } from '../lib/emit/shared'
import { buildScale } from '../lib/scale'
import { toHubQuery } from '../routing/search'
import { onColour } from '../theme/colour'
import { toKanji } from '../ui/japanese'
import CodeBlocks from './CodeBlocks.vue'
import CopyButton from './CopyButton.vue'
import CopyIcon from './CopyIcon.vue'
import ScaleRamp from './ScaleRamp.vue'

/**
 * "More details" for one combo (ADR 0015): its raw colours, the full scale and
 * the code, in a Reka dialog over the grid. `?c=` opens it; Escape, the overlay
 * and the close button shut it; `←` / `→` step through the catalogue.
 */
const router = useRouter()
const { combo, close, step } = useComboDialog()

/**
 * The combo on screen. Held past `?c=` going away so the closing animation
 * still has something to show.
 */
const shown = shallowRef<Combo>()
watch(combo, (next) => {
  if (next)
    shown.value = next
}, { immediate: true })

const scale = computed(() => shown.value && buildScale(shown.value))

const link = computed(() => shown.value
  ? new URL(router.resolve({ path: '/', query: toHubQuery({ c: shown.value.id }) }).href, location.origin).href
  : '')

/** `accent`, `accent-2`, … for a colour ramp, by its rank in the scale. */
function roleOf(index: number): string | undefined {
  const rank = scale.value?.accents.indexOf(index) ?? -1
  return rank === -1 ? undefined : accentName(rank)
}

/** `←` / `→`, except where something focused has its own use for an arrow. */
function onKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
    return
  const delta = ({ ArrowLeft: -1, ArrowRight: 1 } as const)[event.key as string]
  if (delta === undefined)
    return
  const target = event.target as HTMLElement
  if (target.closest('[role="tablist"], input, textarea, pre'))
    return
  event.preventDefault()
  step(delta)
}
</script>

<template>
  <DialogRoot :open="combo !== undefined" @update:open="open => !open && close()">
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent v-if="shown && scale" class="dialog" @keydown="onKeydown">
        <!-- Raw Wada hex, never adjusted. Each swatch copies its own. -->
        <div class="swatches">
          <CopyButton
            v-for="colour in shown.colours"
            :key="colour.index"
            v-slot="{ copied }"
            class="swatch"
            :style="{ background: colour.hex, color: onColour(colour.hex) }"
            :text="colour.hex"
            :label="`Copy ${colour.name} ${colour.hex}`"
          >
            <span class="swatch-name">{{ colour.name }}</span>
            <span class="swatch-hex">
              <CopyIcon :copied="copied" />
              {{ copied ? 'Copied!' : colour.hex }}
            </span>
          </CopyButton>
        </div>

        <div class="body">
          <header class="head">
            <div class="title">
              <p class="kanji" aria-hidden="true">
                第{{ toKanji(shown.id) }}番
              </p>
              <DialogTitle class="no">
                No. {{ shown.id }}
              </DialogTitle>
              <DialogDescription class="names">
                {{ comboLabel(shown) }}
              </DialogDescription>
            </div>

            <div class="actions">
              <CopyButton v-slot="{ copied }" class="pill" :text="comboHexes(shown)" :label="`Copy all hexes of combination ${shown.id}`">
                <CopyIcon :copied="copied" />
                {{ copied ? 'Copied!' : 'Copy hexes' }}
              </CopyButton>
              <CopyButton v-slot="{ copied }" class="pill" :text="link" :label="`Copy a link to combination ${shown.id}`">
                <CopyIcon :copied="copied" />
                {{ copied ? 'Copied!' : 'Copy link' }}
              </CopyButton>
              <span class="pager">
                <button type="button" class="pill pill-icon" aria-label="Previous combination" aria-keyshortcuts="ArrowLeft" @click="step(-1)">
                  ←
                </button>
                <button type="button" class="pill pill-icon" aria-label="Next combination" aria-keyshortcuts="ArrowRight" @click="step(1)">
                  →
                </button>
              </span>
            </div>
          </header>

          <section class="section" aria-labelledby="scale-heading">
            <h3 id="scale-heading">
              Scale <span class="jp" aria-hidden="true">階調</span>
            </h3>
            <p class="lede">
              Eleven steps per colour, placed by luminance: any two steps 500 apart clear 4.5:1.
              <span aria-hidden="true">◆</span> marks the exact Wada colour. Click any chip to copy.
            </p>
            <div class="ramps">
              <ScaleRamp
                v-for="(ramp, i) in scale.ramps"
                :key="ramp.slug"
                :name="ramp.name"
                :role="roleOf(i)"
                :anchor="ramp.anchor"
                :steps="ramp.steps"
              />
              <ScaleRamp name="Neutral" role="neutral" :steps="scale.neutral.steps" />
            </div>
          </section>

          <section class="section" aria-labelledby="code-heading">
            <h3 id="code-heading">
              Code <span class="jp" aria-hidden="true">コード</span>
            </h3>
            <CodeBlocks :scale="scale" />
          </section>
        </div>

        <DialogClose class="close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: oklch(8% 0.02 300 / 0.72);
  backdrop-filter: blur(6px);
}

.dialog {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  z-index: 21;
  translate: -50% -50%;
  inline-size: min(60rem, calc(100vw - 2rem));
  max-block-size: calc(100svh - 2rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 2px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--bg-raised);
  box-shadow: 0 30px 80px oklch(0% 0 0 / 0.55);
}

.dialog:focus {
  outline: none;
}

.overlay[data-state='open'] {
  animation: fade-in var(--dur) var(--ease);
}

.overlay[data-state='closed'] {
  animation: fade-out var(--dur-fast) var(--ease);
}

.dialog[data-state='open'] {
  animation: pop-in 320ms var(--ease-bounce);
}

.dialog[data-state='closed'] {
  animation: pop-out var(--dur-fast) var(--ease);
}

@keyframes fade-in {
  from { opacity: 0; }
}

@keyframes fade-out {
  to { opacity: 0; }
}

@keyframes pop-in {
  from { opacity: 0; scale: 0.9; rotate: -1.5deg; }
}

@keyframes pop-out {
  to { opacity: 0; scale: 0.96; }
}

.swatches {
  display: flex;
  block-size: clamp(9rem, 22vw, 13rem);
}

.swatch {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 0.15rem;
  min-inline-size: 0;
  padding: var(--space-sm);
  border: 0;
  text-align: start;
  cursor: pointer;
  transition: flex-grow var(--dur) var(--ease-bounce);
}

@media (hover: hover) {
  .swatch:hover {
    flex-grow: 1.35;
  }
}

.swatch:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 4px currentColor;
}

.swatch-name {
  font-size: var(--text-sm);
  font-weight: 700;
  line-height: 1.2;
}

.swatch-hex {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--mono);
  font-size: var(--text-xs);
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-xl);
  padding: var(--space-lg);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
}

.kanji {
  margin: 0;
  color: var(--shu);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.15em;
}

.no {
  margin: 0;
  font-family: var(--display);
  font-size: var(--text-display);
  font-weight: 400;
  line-height: 1;
}

.names {
  margin: 0.4rem 0 0;
  color: var(--ink-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.actions .is-copied {
  border-color: var(--kin);
  color: var(--kin);
}

.pager {
  display: flex;
  gap: var(--space-2xs);
}

.pill-icon {
  inline-size: 2.25rem;
  padding: 0;
  font-size: var(--text-base);
}

.section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-sm);
}

.section h3 {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  margin: 0;
  font-family: var(--display);
  font-size: var(--text-lg);
  font-weight: 400;
}

.jp {
  color: var(--shu);
  font-family: var(--sans);
  font-size: var(--text-sm);
  font-weight: 700;
}

.lede {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.ramps {
  display: grid;
  gap: var(--space-md);
}

.close {
  position: absolute;
  inset-block-start: var(--space-sm);
  inset-inline-end: var(--space-sm);
  display: grid;
  place-items: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border: 2px solid var(--line-strong);
  border-radius: 50%;
  background: var(--bg-raised);
  cursor: pointer;
  transition: transform var(--dur) var(--ease-bounce);
}

@media (hover: hover) {
  .close:hover {
    transform: rotate(90deg);
  }
}

@media (max-width: 40rem) {
  .dialog {
    inset-block: auto 0;
    translate: -50% 0;
    inline-size: 100vw;
    max-block-size: 92svh;
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  .body {
    padding: var(--space-md);
  }
}
</style>
