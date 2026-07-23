# 8. Combo-owned light/dark mode

- **Status**: Accepted
- **Date**: 2026-07-23
- **Ticket**: [T1: Retire the light/dark toggle — the combo drives mode](https://github.com/LouisLP/colour-combos/issues/33)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Supersedes**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md) §1
  and the two-rendering framing of §5; [ADR 0005](0005-app-state-architecture.md)
  §4 (mode as a module store) and §5 (mode as the flash risk)
- **Builds on**: [ADR 0002](0002-combo-adaptation-model.md) — the derivation math
  and the AA contract are unchanged

## Context

ADR 0001 §1 made mode site-owned: a manual light/dark toggle, defaulting to
`prefers-color-scheme`, that every one of the 348 combos had to render under in
both directions. Mode and combo were two independent axes.

But the site exists to show off the *selected combo*. A separate manual switch
is a second thing to reason about, and it lets a combo that is obviously a dark
palette be forced into a light room (and the reverse) — a rendering the combo's
own colours never asked for. If the combo is the subject, the combo should
decide whether it is lit light or dark. One combo → one definitive rendering.

## Decision

### 1. Mode is a pure function of the selected combo

The combo owns its mode. There is no user control, no stored override, no
`prefers-color-scheme` default, and no combo-less state that needs theming: a
bare `/` already resolves to a random combo before the first paint settles
(ADR 0001 §6), so mode follows from that combo like everything else.

### 2. The rule: mean OKLab lightness against mid-grey

```
mode = mean(OKLab L over the combo's raw colours) ≥ 0.60 ? light : dark
```

`0.60` is the OKLab lightness of neutral mid-grey (`#808080`). A combo whose
colours are, on average, lighter than mid-grey reads as a light palette and gets
the near-white canvas; darker reads as a dark palette and gets the near-black
one. Across the catalogue this splits **218 light / 130 dark**.

The measure is **equal-weight and lightness-only** on purpose:

- *Equal weight* — there is no area information to weight by; each colour in the
  combo counts once.
- *Lightness only* — lightness is the single axis the near-neutral canvas swings
  along, so it is the only axis that should decide which end of that swing the
  page sits at. Chroma and hue already have a job: they decide *which* colour
  tints the canvas (`assignRoles`, ADR 0002 §2), never how bright the room is.

Two rules were prototyped against all 348 combos and rejected (see below); mean
OKLab L was the one that put the obviously-dark palettes in dark without special
cases. Worked example: combo #117 is `#cc1236` (crimson) + `#111314`
(near-black). A rule keyed on the *hue source* picks the crimson — the only
colour with usable chroma — and calls the combo light, which is plainly wrong
for a palette dominated by near-black. Mean OKLab L reads it at 0.36 and lands
it in dark.

### 3. One rendering per combo; the AA sweep is 348 × 1

With mode combo-derived, each combo has a single canonical look, so the AA
guarantee is restated from **348 × 2** to **348 × 1** — the renderings the site
can actually produce. The sweep (`adapt.sweep.test.ts`) runs each combo in its
one chosen mode and must stay at **0 failures**. It does: the ×1 set is a subset
of the ×2 set ADR 0002 already proved clean, so the contract cannot have
regressed.

### 4. `color-scheme` is rendered, not primed

Mode reaches `light-dark()` through `color-scheme`, and that is now emitted by
`ThemeStyle` in the same `:root` block as the rest of the palette:

```
:root{color-scheme:dark; --hue-source:…; --accent:… }
```

It wins over the `color-scheme: light dark` baseline in `index.css` by source
order and lands in the same commit as the tree that reads it. The head script
that used to prime `color-scheme` from the stored mode is gone: the bare `/`
picks its combo with `Math.random()` *in JS*, so no combo — and therefore no
mode — is knowable before hydration. Nothing is left to prime from. Before the
first commit the page shows the achromatic token baseline (ADR 0001 §6) under
the mode-agnostic `light dark` fallback, which reads fine as greys either way.

### 5. Assignment stays mode-invariant; derivation stays mode-dependent

ADR 0001 §5 still holds, minus its toggle framing. Which colour is the hue
source and which are accents is computed once per combo and does not depend on
mode. The *derivation* is still mode-dependent — canvas lightness, ink polarity,
accent clamp direction — but a combo now only ever exercises one side of that
fork, the side its own lightness chose. The near-neutral canvas and the AA hard
gate (ADR 0001 §2–3) are untouched: this ticket changes *who chooses the mode*,
nothing about the derivation or the contract.

## Consequences

- **Accent drift runs higher, and that is the honest cost.** Rendering each
  combo in its native-lightness mode means a light palette's light accents sit
  on a light canvas and must drag darker to clear AA (and dark on dark, lighter)
  — the very direction the old ×2 average diluted by also rendering every combo
  in the *opposite*, easier mode. Mean accent drift moves from ΔL 0.052 to
  0.077; the share left untouched from 62% to 48%. Still bounded, still AA-safe,
  and the drift budget in the sweep is retuned to match. The alternative —
  inverting the rule to minimise drift — is rejected below.
- **The app sheds a module store.** Favourites is now the only one; there is no
  `useMode`, no `state/mode.ts`, no `MODE_KEY`, no cross-tab `storage` sync for
  mode, and no `matchMedia` listener. The "two stores, one pattern" note in
  ADR 0005 §4 collapses to one.
- **A shared link now carries its mode implicitly.** ADR 0004 §6 rejected mode
  in the URL so a link would adopt the recipient's mode. That concern is moot:
  the link carries `c`, `c` fixes the combo, and the combo fixes the mode, so
  sender and recipient see the same rendering by construction — which for a site
  about *this specific combo* is the correct outcome, not an imposition.
- **No "force the other mode".** A visitor who prefers dark cannot force a light
  palette dark. Accepted: the product's claim is one definitive rendering per
  combo, and a manual override is exactly the second axis this ADR removes.

## Alternatives rejected

- **Mean WCAG relative luminance** instead of OKLab L — luminance is
  perceptually non-uniform and dominated by the green channel, so it buries
  most combos below the line (310 dark / 38 light) and calls palettes dark that
  plainly read light. OKLab L is perceptually even, which is the whole point of
  a lightness threshold.
- **Hue-source lightness** — elegant, because the hue source already tints the
  canvas, but it keys the decision on the one colour chosen for its *hue*, not
  its dominance. It mis-calls high-contrast pairs like #117 (crimson +
  near-black), where the chromatic colour is the hue source but the near-black
  is what makes the palette dark.
- **Invert the rule to minimise accent drift** (light palettes → dark mode) —
  gives the lowest possible drift, since a light accent pops on a dark canvas
  untouched. Rejected: it fights the combo's own character. A bright, airy
  palette shown in a dark room does not read as *that palette lit well*; it
  reads as the wrong room. Fidelity of the accents is secondary to the room
  matching the palette, and AA holds either way.
- **Keep the toggle as an optional override on top of combo-derived mode** —
  reintroduces the second axis and the two-rendering obligation this ADR exists
  to retire, for a control the product deliberately does without.
- **Prime mode in the head script from the URL's combo** — would keep a
  zero-flash guarantee, but the bare `/` has no combo in the URL (it is picked
  in JS), so the guarantee cannot hold for the most common entry anyway, and
  buying it for the rest means inlining the catalogue and duplicating this rule
  in a blocking script. The achromatic baseline is a better pre-hydration frame
  than that machinery.
