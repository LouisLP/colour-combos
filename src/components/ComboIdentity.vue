<script setup lang="ts">
import { useSelectedCombo } from '../composables/useSelectedCombo'
import { comboLabel } from '../data/combos'

/**
 * The active combo, shown as itself at the top of the page (T2, ADR 0009).
 *
 * The chrome tints toward the selected combo, but a tinted header is a whisper —
 * this band is the shout. It puts the combo's *raw* colours on the page at full
 * strength, in a large-format strip, so which combo is theming the site is
 * unmistakable before a single card is read. That the strip is raw is on
 * purpose: colours here are shown *as themselves*, so the "swatches are sacred"
 * contract (ADR 0001 §4) applies and no role touches them.
 *
 * The meta sits *below* the strip on `--surface`, never over the raw colours, so
 * nothing here has to hold a contrast promise against an arbitrary Wada value.
 * The one vivid role — the accent eyebrow — is an `--on-accent` on `--accent`
 * pill, a pairing the AA sweep proves at 4.5:1 across the whole catalogue.
 *
 * T4 finishes the band (ADR 0010): a row of per-colour **hex** aligned under the
 * strip — the datum the grid card has no room for (ADR 0006 §3) — and the number
 * set in the editorial serif. The `--ink`-muted hex sits on `--surface`, so it
 * keeps the same contrast guarantee as the rest of the meta. The strip and hex
 * are `aria-hidden`; the combo's spoken identity is the number and names.
 *
 * Shared chrome, so it lives in `HubLayout` above both routes and reads the
 * combo from the URL like everything else. It is identity, not document
 * structure: the number is a `<p>`, not a heading, so it never competes with a
 * page's own `<h1>`. The meta is keyed by combo id so its entry animation
 * replays on each pick (and no-ops under reduced motion).
 */
const combo = useSelectedCombo()
</script>

<template>
  <section class="combo-hero" aria-label="Active combination">
    <span class="combo-hero-swatches" aria-hidden="true">
      <i v-for="colour in combo.colours" :key="colour.index" :style="{ background: colour.hex }" />
    </span>

    <!-- Aligned one-per-cell under the strip. Decorative detail for sighted
         users; the spoken identity is the number and names below. -->
    <ul class="combo-hero-hexes" aria-hidden="true">
      <li v-for="colour in combo.colours" :key="colour.index">
        {{ colour.hex }}
      </li>
    </ul>

    <div :key="combo.id" class="combo-hero-meta">
      <p class="combo-hero-eyebrow">
        Now theming
      </p>
      <p class="combo-hero-id">
        {{ `Combination No. ${combo.id}` }}
      </p>
      <p class="combo-hero-names">
        {{ comboLabel(combo) }}
      </p>
    </div>
  </section>
</template>

<style scoped>
/* The active-combo identity band — T2's gesture, refined in T4 (ADR 0009, ADR
   0010). It bleeds to main's padding edges and butts flush under the header (the
   negative block-start cancels main's top padding), so the header's accent rule
   and this strip read as one continuous piece of combo-coloured chrome.

   T2 put the combo's raw colours on the page at full strength here; T4 adds the
   editorial `No. N` and the per-colour hex the grid card has no room for (ADR
   0006 §3). Colour is only ever the raw strip, shown *as itself* (ADR 0001 §4);
   every scrap of text sits below it on `--surface`, never over a raw value, so
   nothing has to hold a contrast promise against an arbitrary Wada colour. */
.combo-hero {
  margin-block-start: calc(-1 * var(--space-xl));
  margin-inline: calc(-1 * var(--space-lg));
  margin-block-end: var(--space-lg);
  overflow: hidden;
  background: var(--surface);
  border-block-end: 1px solid var(--border);
  transition:
    background-color var(--dur-theme) var(--ease),
    border-color var(--dur-theme) var(--ease),
    color var(--dur-theme) var(--ease);
}

/* Raw Wada colours, equal split and full bleed — the large-format echo of a
   combo card's swatch block, tall enough to dominate the fold. */
.combo-hero-swatches {
  display: flex;
  block-size: 5.5rem;
}

.combo-hero-swatches i {
  flex: 1;
}

/* One hex per colour, aligned under the strip's equal-split cells. Mono tabular
   `--ink-muted` on `--surface`: the datum the grid deliberately drops, given a
   home where there is finally room for it. */
.combo-hero-hexes {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  border-block-end: 1px solid var(--border);
}

.combo-hero-hexes li {
  flex: 1;
  min-inline-size: 0;
  padding: 0.3rem 0.25rem;
  font-family: var(--mono);
  font-size: var(--text-xs);
  text-align: center;
  text-transform: uppercase;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The meta rises in as the combo lands. Keyed on combo id in the template, so it
   replays on every pick rather than only on first paint; the raw strip beside
   it cross-fades through the chrome transition. */
.combo-hero-meta {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem var(--space-md);
  padding: var(--space-sm) var(--space-lg) var(--space-md);
  animation: hero-rise var(--dur) var(--ease);
}

/* The one vivid role in the band: `--on-accent` on `--accent`, the pairing the
   AA sweep proves at 4.5:1 for every combo (T2, ADR 0009 §3). */
.combo-hero-eyebrow {
  margin: 0;
  align-self: center;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--on-accent);
}

/* The `No. N` treatment (T4): the editorial serif, tabular figures so a 3-digit
   id sits on the same rail as a 1-digit one. `--ink`, which clears 4.5:1 on
   `--surface` by contract. */
.combo-hero-id {
  margin: 0;
  font-family: var(--serif);
  font-size: var(--text-2xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: lining-nums tabular-nums;
}

.combo-hero-names {
  margin: 0;
  min-inline-size: 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(0.4rem);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
</style>
