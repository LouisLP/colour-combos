# 7. Combo card refinements — density, absolute star, per-colour copy

- **Status**: Accepted
- **Date**: 2026-07-23
- **Ticket**: [T3: Combo card refinements](https://github.com/LouisLP/colour-combos/issues/35)
- **Parent**: [Card & detail polish](https://github.com/LouisLP/colour-combos/issues/32)
- **Builds on**: [ADR 0006](0006-browse-surface-and-grid.md) (the card is that
  ADR's variant A; this refines it), [ADR 0001](0001-light-dark-and-combo-theming-semantics.md) §4,
  [ADR 0002](0002-combo-adaptation-model.md) §5, [ADR 0004](0004-routing-and-url-state.md) §1

## Context

ADR 0006 settled the card in the abstract — framed, equal-split swatches,
always-present caption — but three things only showed up once the real grid was
in front of people:

- The cards were **larger than the content needs**. A 6.5rem swatch block and
  13rem columns fit fewer cards per row than the catalogue can comfortably show.
- The **star shifted with caption length**. It lived in the caption row next to
  a one-line label that ellipsises, so its exact position drifted a few pixels
  from card to card and never sat still while scanning a column.
- There was **no way to grab a single colour's hex**. ADR 0006 §3 cut hex from
  the card face for good reasons (three or four monospace strings do not fit at
  grid scale) and parked them on each swatch's `title`, which is invisible to
  touch and to keyboard.

## Decision

### 1. Smaller cards

Swatch block from 6.5rem to **5rem**, caption padding tightened, and columns
from `minmax(13rem, 1fr)` to **`minmax(11.5rem, 1fr)`** (13rem above 100rem).
That is one more column at common widths without taking the card so narrow the
caption ellipsises on its *first word*, which is the floor ADR 0006 §5 set and
this keeps. `contain-intrinsic-size` drops from `auto 11rem` to `auto 7.5rem` to
track the shorter card — it is a paint estimate (ADR 0006 §6), so it should
follow the real height or the scrollbar drifts further than the accepted ~8%.

### 2. The star and the copy chips live *over* the swatch block, not in the link

This is the load-bearing structural decision and the rest follows from it.

The swatch block is a single selection `<a>` (selecting a combo *is* a
navigation, ADR 0004 §1). A per-colour copy control has to be a real `<button>`
— it has an action, a pressed confirmation, and a keyboard story — and **a
button cannot nest inside an anchor**. The same is true of the star.

So both are **sibling overlays** of the link inside a shared
`position: relative` media box, not children of it:

- The **star** is `position: absolute`, top-right, the same 2rem box on every
  card regardless of caption (the ticket's headline ask). Always visible, never
  hover-revealed — hover-only dies on touch (ADR 0006 §8) — carrying
  `aria-pressed` as before.
- The **copy chips** are one small button per swatch in an overlay row that
  mirrors the swatch flex. The row is `pointer-events: none` and only the chips
  are `pointer-events: auto`, so a tap that misses a chip **falls through to the
  selection link beneath** — tapping a colour still selects the combo, tapping
  its chip copies its hex.

### 3. Both overlays get a `--surface` backdrop

Moving the star off the caption puts it over raw Wada colour, which can be any
hue at any lightness — a bare glyph is not guaranteed legible there. The caption
gave it a `--surface` background for free; the overlay has to ask for it. So the
star and every copy chip sit on a `--surface` chip with a `--border` hairline.
`--surface` is theme-owned and contrast-checked (ADR 0002 §5), so the control is
legible over any colour **by construction**, exactly the property the caption
placement gave away.

### 4. Copy is a hover chip on fine pointers, always shown on coarse ones,
### revealed by focus for the keyboard

The ticket left the touch story to decide here.

- **Fine pointer (mouse):** chips are hidden until the card is hovered, so the
  grid still reads as colour rather than as chrome (ADR 0006 §8's concern).
- **Coarse pointer (touch):** there is no hover to reveal them, so they stay
  visible. `@media (hover: none)`.
- **Keyboard:** `:focus-visible` reveals the chip you are on regardless of
  pointer, so tabbing through a card surfaces each copy target in turn.

Each chip's accessible name is `Copy {name} {hex}`, flipping to `Copied {hex}`
on success, and a per-card `role="status"` region announces the copy for screen
readers since the visual confirmation is otherwise a silent icon swap. The
confirmation clears after 1.4s; the timer is cancelled on re-copy so a fast
series never leaves a stale check behind. `navigator.clipboard.writeText` can
reject (denied permission, insecure context) — a failed copy shows no
confirmation rather than throwing.

A native right-click context menu was considered (the ticket allowed it) and
dropped: it duplicates the chip on mouse, has no keyboard equivalent, and needs
a bespoke long-press implementation to exist on touch at all. One affordance
that works the same in all three input modes beats two that each cover a slice.

## Consequences

- **The 2rem chips add up to four tab stops per card.** That is the honest cost
  of every colour being keyboard-copyable across a 348-card grid, and it is the
  same order the always-present star already established. Not free, but the
  feature is per-colour by definition.
- **Hex now has a partial home on the card again** — copyable but never
  displayed, so ADR 0006 §3's reasoning (no monospace strings on the face)
  stands. The detail surface still owns the full readout.
- **`--surface` is now the legibility contract for anything placed over raw
  swatches.** Any future overlay on the swatch block inherits this requirement
  rather than trusting a glyph to contrast against an arbitrary colour.
- **Selecting a combo by tapping its swatch survives** because the copy layer
  passes clicks through. If a future control over the swatch stops doing that, it
  silently steals the primary action.

## Alternatives rejected

- **Copy the whole combo's colours from one control.** Simpler, one button, but
  it answers a different question — the ticket is a *single* colour to the
  clipboard, which a per-swatch chip is the direct shape of.
- **Move selection off the swatch block onto the caption so the swatches can be
  copy buttons.** Removes the overlay entirely and the nesting problem with it,
  but it relocates the product's primary action to its smallest target and
  contradicts ADR 0006's card. The overlay keeps the big colourful area doing the
  main job.
- **Right-click / long-press context menu only.** Invisible until invoked, no
  keyboard path, and needs a custom long-press to reach touch. Rejected in §4.
- **Leave the star in the caption.** Keeps its `--surface` backdrop for free but
  keeps the drift the ticket is fixing. The absolute placement is the point.
