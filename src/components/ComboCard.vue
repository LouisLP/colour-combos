<script setup lang="ts">
import type { Combo } from '../data/combos'
import { useTemplateRef } from 'vue'
import { useIsFavorite } from '../composables/useFavorites'
import { useHubSearch } from '../composables/useHubSearch'
import { comboLabel } from '../data/combos'
import { toHubQuery } from '../routing/search'
import { toggle } from '../state/favorites'
import { handleComboShortcut } from '../ui/comboShortcuts'
import { ROVING_ATTR } from '../ui/keyboard'
import CopyButton from './CopyButton.vue'
import CopyIcon from './CopyIcon.vue'
import { MatchNames } from './MatchText'
import StarButton from './StarButton.vue'

/**
 * One combo as a framed card (ADR 0006 §1): a hairline frame on `--surface`, an
 * equal-split swatch block, and a caption that is always present.
 *
 * The frame is not decoration — it is what makes a combo read as a combination
 * rather than as loose colours, which is the whole reason variant A won.
 *
 * Two controls sit *over* the swatch block rather than inside its selection link
 * (ADR 0007): the always-present star, top-right in a fixed spot on every card,
 * and a per-swatch copy chip. They cannot nest inside the `<a>` that selects the
 * combo, so they are sibling overlays with a `--surface` backdrop that keeps them
 * legible over any raw Wada colour.
 *
 * The selection link is the card's roving-focus target, and `f` / `c` act on the
 * card from anywhere inside it (ADR 0014 §4).
 */
const props = defineProps<{
  combo: Combo
  /** Whether this combo is the one currently theming the site. */
  selected: boolean
}>()

const search = useHubSearch()

// A computed over the store, so starring re-renders this card and not the
// other 347 (ADR 0005 §8).
const favorited = useIsFavorite(() => props.combo.id)

const chips = useTemplateRef<InstanceType<typeof CopyButton>[]>('chips')

/** `c` copied the whole combo: light every swatch's chip, not just one. */
function confirmAll() {
  for (const chip of chips.value ?? [])
    chip.confirm()
}
</script>

<template>
  <article class="combo-card" :class="{ 'is-selected': selected }" @keydown="handleComboShortcut($event, combo, confirmAll)">
    <div class="combo-media">
      <!--
        A link, not a button: selecting a combo *is* a navigation (ADR 0004 §1),
        so it is shareable, middle-clickable, and pushes exactly one history
        entry (ADR 0004 §5). A query-only target keeps the current route, which
        is what lets `/favorites` reuse this card unchanged. `aria-current` is
        set explicitly because the router would otherwise mark every card on
        the page as current — it ignores the query when matching.
      -->
      <RouterLink
        :to="{ query: toHubQuery({ ...search, c: combo.id }) }"
        class="combo-hit"
        :aria-current="selected ? 'true' : undefined"
        v-bind="{ [ROVING_ATTR]: '' }"
      >
        <span class="sr-only">{{ `Theme this page with combination ${combo.id}` }}</span>
        <!--
          Raw Wada hex, never a role (ADR 0001 §4). Equal split and full bleed —
          proportional bands reduce a 4-colour combo's minor colours to
          unreadable slivers (ADR 0006 §2). The card's `overflow: hidden` cuts
          the corners so no `--canvas` shows between the colours.
        -->
        <span class="combo-swatches" aria-hidden="true">
          <i v-for="colour in combo.colours" :key="colour.index" :style="{ background: colour.hex }" />
        </span>
      </RouterLink>

      <!--
        The copy layer is a sibling of the link, not a child: it must hold real
        buttons (ADR 0007). Chips are small so the rest of each swatch still
        selects the combo on a tap; the layer passes clicks through and only the
        chips catch them. Hover-revealed on fine pointers, always shown on
        coarse ones and on keyboard focus. Each chip's accessible name carries
        the colour name and the hex so a screen-reader user knows what a press
        will copy.
      -->
      <div class="combo-copy-layer">
        <span v-for="colour in combo.colours" :key="colour.index" class="combo-copy-cell">
          <CopyButton
            ref="chips"
            v-slot="{ copied }"
            class="combo-copy"
            :text="colour.hex"
            :label="`Copy ${colour.name} ${colour.hex}`"
          >
            <CopyIcon :copied="copied" />
          </CopyButton>
        </span>
      </div>

      <!-- Absolute, so it lands in the same spot on every card regardless of
           caption length (ADR 0007). Backdrop keeps it legible over any colour. -->
      <StarButton :combo-id="combo.id" :pressed="favorited" @toggle="toggle" />
    </div>

    <div class="combo-caption">
      <!-- A Wada combo carries no name of its own — only its colours do. -->
      <b>{{ `No. ${combo.id}` }}</b>
      <span :title="comboLabel(combo)"><MatchNames :combo="combo" :q="search.q" /></span>
    </div>

    <!--
      Marked in `--ink`, not `--accent`: the accent is already on the chips,
      the focus rings and the buttons, so a fourth accented thing reads as more
      chrome rather than as *this one*. `--ink` clears 4.5:1 on every surface in
      the system (ADR 0002 §5), which makes the marker theme-proof by
      construction (ADR 0006 §4).
    -->
    <p v-if="selected" class="combo-pill">
      Theming this page
    </p>
  </article>
</template>

<style scoped>
/* Variant A: framed cards, equal-split bands, always-present caption, selection
   marked in --ink (ADR 0006).

   A hover lifts the card a hair on fine pointers — enough to say "pressable"
   without the grid twitching as the pointer crosses it. Transform and shadow
   only: colour is left to cut, so this never joins the re-theme cross-fade
   (ADR 0010). */
.combo-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.7rem;

  /* Supplies the swatch block's corner radius, so no --canvas shows through
     between the colours (ADR 0006 §2). */
  overflow: hidden;
  transition:
    transform var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

@media (hover: hover) {
  .combo-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

/* --ink, not --accent: the accent is already spread across the page chrome, so
   an accent ring reads as "more chrome" rather than as *this one* (§4). */
.combo-card.is-selected {
  outline: 2px solid var(--ink);
  outline-offset: -1px;
}

/* The swatch block and its two overlays (star, copy chips) share one relative
   box so both overlays can be positioned against it (ADR 0007). */
.combo-media {
  position: relative;
}

.combo-hit {
  position: relative;
  display: block;
  inline-size: 100%;
  color: inherit;
  text-decoration: none;
}

/* Roving focus lands here (ADR 0014 §4), and the plain ring fails twice: the
   card's `overflow: hidden` clips it, and drawn inside it is `--accent` over raw
   Wada colour — invisible on any swatch near the accent's hue. So the ring is
   an overlay inside the swatches, `--accent` on a `--surface` band, which holds
   3:1 against the band by contract whatever colour lies beneath (ADR 0007 §3). */
.combo-hit:focus-visible {
  outline: none;
}

.combo-hit:focus-visible::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow:
    inset 0 0 0 3px var(--accent),
    inset 0 0 0 5px var(--surface);
}

/* Shorter than the original 6.5rem so the card is visibly tighter (ADR 0007). */
.combo-swatches {
  display: flex;
  block-size: 5rem;
}

/* Equal split, full bleed. Proportional weighting reduces a 4-colour combo's
   minor colours to unreadable slivers (§2). */
.combo-swatches i {
  flex: 1;
}

/* The copy overlay mirrors the swatch flex so each cell lines up with its
   colour. The layer itself passes clicks through to the selection link beneath;
   only the chips catch them, so tapping the colour still selects the combo. */
.combo-copy-layer {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}

.combo-copy-cell {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-block-end: 0.3rem;
}

/* A --surface backdrop keeps the glyph legible over any raw Wada colour, the
   same guarantee the caption gave the star before it moved (ADR 0002 §5). The
   32px box clears the WCAG 2.2 §2.5.8 target minimum. */
.combo-copy {
  pointer-events: auto;
  inline-size: 2rem;
  block-size: 2rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 0.35rem;
  background: var(--surface);
  color: var(--ink-muted);
  line-height: 0;
  cursor: pointer;
  user-select: none;

  /* Hover-revealed on fine pointers; focus overrides below so keyboard users
     always see the chip they are on. */
  opacity: 0;
  transition:
    opacity var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.combo-copy:active {
  transform: scale(0.9);
}

@media (hover: hover) {
  .combo-media:hover .combo-copy {
    opacity: 1;
  }
}

/* No hover to reveal them on touch, so the chips stay visible (ADR 0007). */
@media (hover: none) {
  .combo-copy {
    opacity: 1;
  }
}

/* A confirmed chip stays visible for its moment, so `c` — which lights every
   chip at once — is seen even with the pointer elsewhere (ADR 0014 §5). */
.combo-copy:focus-visible,
.combo-copy.is-copied {
  opacity: 1;
}

.combo-caption {
  padding: 0.5rem 0.6rem 0.55rem;
  min-inline-size: 0;
  font-size: var(--text-sm);
  line-height: 1.35;
  border-block-start: 1px solid var(--border);
}

/* The card's `No. N` echoes the hero's treatment in miniature: the number set in
   tabular figures with a hair of tracking so ids read as catalogue numbers, not
   loose digits. */
.combo-caption b {
  display: block;
  font-weight: 600;
  letter-spacing: 0.01em;
  font-variant-numeric: lining-nums tabular-nums;
}

/* One line, ellipsised. Hex values are the one piece of metadata the grid
   cannot afford (§3) — they now copy from each swatch's chip instead. */
.combo-caption span {
  display: block;
  color: var(--ink-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.combo-pill {
  margin: 0;
  padding: 0.25rem 0.7rem;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--ink);
  color: var(--surface);
}
</style>
