<script setup lang="ts">
import type { Combo } from '../data/combos'
import { useTemplateRef } from 'vue'
import { useIsFavorite } from '../composables/useFavorites'
import { useHubSearch } from '../composables/useHubSearch'
import { comboHexes, comboLabel } from '../data/combos'
import { toHubQuery } from '../routing/search'
import { toggle } from '../state/favorites'
import { onColour } from '../theme/colour'
import { handleComboShortcut } from '../ui/comboShortcuts'
import { ROVING_ATTR } from '../ui/keyboard'
import CopyButton from './CopyButton.vue'
import CopyIcon from './CopyIcon.vue'
import { MatchHex, MatchNames } from './MatchText'
import StarButton from './StarButton.vue'

/**
 * One combo as a compact row (ADR 0014 §1): number and colour names as the
 * selection link, then a strip of the raw colours each labelled with its hex,
 * then "copy all" and the star.
 *
 * The row is the reference index ADR 0006 rejected as *the* browse surface,
 * brought back as the second density: it is the view for finding a combo you
 * can already describe, where the grid is the view for seeing them. So it puts
 * the hex on the face — the datum the grid card has no room for (ADR 0006 §3).
 *
 * Every hex is its own copy button, so the label *is* the per-swatch copy
 * affordance (ADR 0007) rather than a chip laid over it. Text sits directly on
 * the raw colour in whichever of black or white contrasts more, which clears
 * 4.5:1 against any sRGB colour.
 */
const props = defineProps<{
  combo: Combo
  /** Whether this combo is the one currently theming the site. */
  selected: boolean
}>()

const search = useHubSearch()
const favorited = useIsFavorite(() => props.combo.id)

const chips = useTemplateRef<InstanceType<typeof CopyButton>[]>('chips')
const all = useTemplateRef<InstanceType<typeof CopyButton>>('all')

/** `c` copied the whole combo: confirm on every hex and on "copy all". */
function confirmAll() {
  for (const chip of chips.value ?? [])
    chip.confirm()
  all.value?.confirm()
}
</script>

<template>
  <article class="combo-row" :class="{ 'is-selected': selected }" @keydown="handleComboShortcut($event, combo, confirmAll)">
    <!-- The selection link and the roving-focus target, as on the card. Its
         accessible name is the whole label; the visible number drops the
         `No.` to save the width for names. -->
    <RouterLink
      :to="{ query: toHubQuery({ ...search, c: combo.id }) }"
      class="combo-row-hit"
      :title="`No. ${combo.id} · ${comboLabel(combo)}`"
      :aria-current="selected ? 'true' : undefined"
      v-bind="{ [ROVING_ATTR]: '' }"
    >
      <b class="combo-row-id"><span class="sr-only">No. </span>{{ combo.id }}</b>
      <span class="combo-row-names"><MatchNames :combo="combo" :q="search.q" /></span>
    </RouterLink>

    <!-- Raw Wada hex, never a role (ADR 0001 §4), equal split (ADR 0006 §2). -->
    <span class="combo-row-strip">
      <CopyButton
        v-for="colour in combo.colours"
        ref="chips"
        :key="colour.index"
        v-slot="{ copied }"
        class="combo-row-hex"
        :style="{ background: colour.hex, color: onColour(colour.hex) }"
        :text="colour.hex"
        :label="`Copy ${colour.name} ${colour.hex}`"
      >
        <CopyIcon v-if="copied" :copied="true" />
        <MatchHex v-else :hex="colour.hex" :q="search.q" />
      </CopyButton>
    </span>

    <CopyButton
      ref="all"
      v-slot="{ copied }"
      class="combo-row-action"
      :text="comboHexes(combo)"
      :label="`Copy all hexes of combination ${combo.id}`"
    >
      <CopyIcon :copied="copied" />
    </CopyButton>

    <StarButton :combo-id="combo.id" :pressed="favorited" @toggle="toggle" />
  </article>
</template>

<style scoped>
/* A ruled ledger line. The height is the density: 1.375rem plus a hairline is
   what puts three times the grid's combos on a 1440×900 screen (ADR 0014 §1),
   and it still clears WCAG 2.2 §2.5.8 — every target is at least 24px apart
   centre to centre. */
.combo-row {
  --row: 1.375rem;

  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-inline-size: 0;
  block-size: calc(var(--row) + 1px);
  padding-inline: var(--space-2xs);
  border-block-end: 1px solid var(--border);
  font-size: var(--text-xs);
  line-height: 1;
}

/* --ink, not --accent, exactly as the card marks it (ADR 0006 §4). An inset
   ring rather than a fill so the raw strip is untouched. */
.combo-row.is-selected {
  outline: 2px solid var(--ink);
  outline-offset: -2px;
  border-radius: var(--radius-sm);
}

.combo-row-hit {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  align-self: stretch;
  gap: var(--space-xs);
  min-inline-size: 0;
  color: var(--ink);
  text-decoration: none;
  border-radius: var(--radius-sm);
}

.combo-row-id {
  flex: none;
  min-inline-size: 3ch;
  text-align: end;
  font-weight: 600;
  font-variant-numeric: lining-nums tabular-nums;
}

.combo-row-names {
  min-inline-size: 0;
  color: var(--ink-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: hover) {
  .combo-row-hit:hover .combo-row-names {
    color: var(--ink);
  }
}

/* A fixed width whatever the size, so the strips stack into one aligned column
   down the list, and equal split within it (ADR 0006 §2). Six hex digits — the
   `#` is dropped to buy the names their width — at a mono size that fits four
   abreast. */
.combo-row-strip {
  flex: none;
  display: flex;
  inline-size: 11.5rem;
  block-size: var(--row);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.combo-row-hex {
  flex: 1;
  min-inline-size: 0;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  font: inherit;
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.02em;
  cursor: pointer;
}

/* Inside the strip so `overflow: hidden` cannot clip it, and `--accent` on a
   `--surface` band so it shows on any raw colour, as on the card. */
.combo-row-hex:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  box-shadow: inset 0 0 0 4px var(--surface);
}

.combo-row-action {
  flex: none;
  inline-size: var(--row);
  block-size: var(--row);
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink-muted);
  line-height: 0;
  cursor: pointer;
}

/* The star is laid out for the card, absolute over a swatch (ADR 0007). In a
   row it is just the last cell. Its root carries this scope, so this reaches it. */
.combo-row .combo-star {
  position: static;
  flex: none;
  inline-size: var(--row);
  block-size: var(--row);
}

/* No hover on touch, and a 23px row is a fine-pointer density. Coarse pointers
   get rows tall enough to hit. */
@media (pointer: coarse) {
  .combo-row {
    --row: 2.5rem;
  }
}

/* A phone-width row has no room for names beside the strip, so the strip drops
   to a line of its own, full width, under the number, names and actions. */
@container combo-result (width < 23rem) {
  .combo-row {
    flex-wrap: wrap;
    block-size: auto;
    row-gap: var(--space-2xs);
    padding-block: var(--space-2xs);
  }

  .combo-row-strip {
    order: 1;
    inline-size: 100%;
  }
}
</style>
