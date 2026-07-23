# 9. Visual language: type, spacing, the identity band, and motion

- **Status**: Accepted
- **Date**: 2026-07-23
- **Ticket**: [T4: Beauty pass with a frontend design skill](https://github.com/LouisLP/colour-combos/issues/36)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Builds on**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md) §2–4
  (the theming contract), [ADR 0002](0002-combo-adaptation-model.md) §5–6 (the
  role tokens), [ADR 0006](0006-browse-surface-and-grid.md) §3–4 (the `No. N`
  label and the accent rule), [ADR 0008](0008-combo-owned-mode.md) (combo-owned
  mode)

## Context

By T4 the mechanics were done: the adaptation model, the combo-owned mode, the
framed grid, the tightened card. What was missing was a *voice*. The site was a
correct design system with no visual language on top of it — no type scale, no
spacing rhythm, no place for the selected combo to announce itself, and no
motion. A stranger landing on it could not tell at a glance what it was.

The hard constraints do not move: a near-neutral legible canvas, AA as a hard
gate, swatches shown as themselves and never altered, and `--accent` reserved
for interactive state (ADR 0001 §2–4, ADR 0006 §4). The task was to be
beautiful *within* that contract, not to renegotiate it.

## Decision

### 1. A documented token layer, in `index.css`

The visual language is a set of custom properties declared once on `:root`,
alongside the existing role ramp. They are design *decisions*, not computed
values, so they live declaratively in the stylesheet rather than being emitted
by the adapter (contrast the runtime-written role tokens of ADR 0002 §6).

- **Type** — `--text-xs … --text-2xl` on a ~1.2 modular scale off the 17px root,
  plus `--text-display: clamp(2.6rem, 1.6rem + 4.4vw, 4.4rem)` for the hero
  number, which is the one element that should fill a wide band without swamping
  a phone.
- **Spacing** — `--space-2xs … --space-2xl`. One rhythm for every gap and pad so
  the layout reads as measured, not nudged.
- **Radius** — `--radius-sm/md/lg/pill`.
- **Motion** — `--ease`, `--dur-fast`, `--dur`, and `--dur-theme` (the re-theme
  cross-fade, deliberately the slowest).
- **Elevation** — `--shadow-sm/md`, built from transparent black so they read on
  the light canvas and fade to nothing on the dark one, where the hairline
  border carries the edge instead.

### 2. An editorial serif is the one voice on a neutral canvas

The body face stays the system sans. A single system **serif**
(`--serif`, Iowan/Palatino/Georgia stack) is introduced for the display `No. N`,
the wordmark, and empty-state headings. It costs no network round-trip and its
printed-page character is a deliberate nod to the 1933 dictionary the data comes
from. It is used sparingly — identity and headings only — so it reads as a voice
rather than as decoration.

### 3. The identity band

A band under the header showing the **active combo**: an editorial `No. N` in
serif tabular figures, the colour names, and the raw swatches at a size the grid
card cannot spare — captioned with their **hex**, which is the one datum the
grid deliberately drops (ADR 0006 §3). It gives the mechanics a face: the page
is already themed *by* this combo, and the band is where that fact lands.

It obeys the theming contract exactly:

- The band itself is neutral `--canvas`. Every scrap of colour in it is a
  swatch, shown *as itself* and never as a role (ADR 0001 §2, §4). The band is
  never a field of raw combo colour.
- Nothing in it is `--accent`. The whole band is **identity**, so it is drawn in
  `--ink` / `--ink-muted`, which clear AA on every surface by contract (ADR 0002
  §5). The accent stays reserved for interactive state (ADR 0006 §4).
- Hex is `--ink-muted` text on the neutral canvas, never text laid over a raw
  swatch — so its 4.5:1 is guaranteed, not hoped for.

It renders on both `/` and `/favorites` because both wear the same combo.

### 4. `--accent` is still spent only on interactive state

The beauty pass adds identity chrome — the wordmark, the nav's current-section
marker, the hero — and every piece of it is `--ink`, never the accent. This is
the same rule ADR 0006 §4 set for the selected-card marker, held site-wide: on a
page saturated with combo colour, the accent means exactly one thing, and adding
a second accented "identity" thing would dissolve that. The engaged filter chip,
the starred star, and the focus ring remain its only homes.

### 5. Motion is feedback, and it is gated

Four moments move, each layered over a UI that already works without it:

- **The re-theme cross-fade** (`--dur-theme`) — selecting a combo rewrites the
  whole neutral ramp; without a fade the page snaps, including the light↔dark
  flip. The transition is scoped to the theme-bearing **chrome** (body, header,
  hero, filter bar, footer, notice), *not* the 348 grid cards, whose
  simultaneous colour repaint would cost far more than the effect is worth.
- **The identity band rises in** on each pick, keyed on combo id so it replays
  rather than animating only once.
- **The star and copy chips** dip on press; the copy check springs in on mount,
  which — since it only ever mounts after a click — *is* the confirmation.
- **Cards lift** a hair on hover (fine pointers only), transform and shadow only
  so they never join the colour cross-fade.

All of it is switched off wholesale by a single `prefers-reduced-motion: reduce`
guard. The site works identically without the movement.

## Consequences

- New surfaces reach for the scale tokens rather than inventing one-off `rem`
  values; a change to the rhythm is a change to one declaration.
- The AA sweep is untouched: the band and chrome use only the contract-guaranteed
  `--ink` / `--ink-muted` / `--accent-text` roles the adapter already audits
  (ADR 0002), and no new text is laid over a raw swatch. The hard gate holds by
  construction.
- The re-theme fade is deliberately *not* on the grid. If a future card-level
  transition is wanted, it has to be measured against the ADR 0006 §6 budget
  first — 348 simultaneous colour repaints is exactly the cost that section
  exists to police.
- The serif is a system-font stack. On a platform lacking every named face it
  falls back to the platform serif, which is the intended character anyway; no
  web font is loaded and there is no FOUT to manage.
