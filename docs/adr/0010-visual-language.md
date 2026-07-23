# 10. Visual language: type, spacing, motion, and finishing the identity band

- **Status**: Accepted
- **Date**: 2026-07-23
- **Ticket**: [T4: Beauty pass with a frontend design skill](https://github.com/LouisLP/colour-combos/issues/36)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Builds on**: [ADR 0009](0009-bolder-combo-colour-across-chrome.md) (T2's
  identity band and accent-in-chrome — T4 finishes that band rather than adding a
  second one), [ADR 0001](0001-light-dark-and-combo-theming-semantics.md) §2–4
  (the theming contract), [ADR 0002](0002-combo-adaptation-model.md) §5–6 (the
  role tokens), [ADR 0006](0006-browse-surface-and-grid.md) §3 (the hex the grid
  card drops), [ADR 0008](0008-combo-owned-mode.md) (combo-owned mode)

## Context

By T4 the mechanics were done and T2 had already pushed the combo into the
chrome: an identity band showing the active combo's raw colours, a 4px accent
rule on the header, an accent nav underline (ADR 0009). What was still missing
was a *voice*. The site was a correct design system with no visual language on
top of it — no type scale, no spacing rhythm, no editorial treatment for the
`No. N`, and no motion.

The hard constraints do not move: a near-neutral legible canvas, AA as a hard
gate, and swatches shown as themselves and never altered (ADR 0001 §2–4). The
task was to be beautiful *within* that contract. Note that ADR 0009 already
reversed ADR 0006 §4's "accent reserved for interactive state" — accent now
means **the active combo** across the chrome — so T4 works with that meaning
rather than re-litigating it.

## Decision

### 1. A documented token layer, in `index.css`

The visual language is a set of custom properties declared once on `:root`,
alongside the existing role ramp. They are design *decisions*, not computed
values, so they live declaratively in the stylesheet rather than being emitted
by the adapter (contrast the runtime-written role tokens of ADR 0002 §6).

- **Type** — `--text-xs … --text-2xl` on a ~1.2 modular scale off the 17px root,
  plus `--text-display: clamp(2.6rem, 1.6rem + 4.4vw, 4.4rem)` held in reserve
  for any future full-height display use.
- **Spacing** — `--space-2xs … --space-2xl`. One rhythm for every gap and pad so
  the layout reads as measured, not nudged. The chrome, `main`, and the band's
  negative-margin bleed all resolve off this scale.
- **Radius** — `--radius-sm/md/lg/pill`.
- **Motion** — `--ease`, `--dur-fast`, `--dur`, and `--dur-theme` (the re-theme
  cross-fade, deliberately the slowest).
- **Elevation** — `--shadow-sm/md`, built from transparent black so they read on
  the light canvas and fade to nothing on the dark one, where the hairline
  border carries the edge instead.

### 2. An editorial serif is the one voice on a neutral canvas

The body face stays the system sans. A single system **serif** (`--serif`,
Iowan/Palatino/Georgia stack) is introduced for the wordmark, the band's
`No. N`, and empty-state headings. It costs no network round-trip and its
printed-page character is a deliberate nod to the 1933 dictionary the data comes
from. It is used sparingly — identity and headings only — so it reads as a voice
rather than as decoration.

### 3. Finishing T2's identity band

T4 does **not** add a second band; it completes the one ADR 0009 built. Two
additions, both inside the existing contract:

- **The `No. N` treatment** — the band's number is set in the editorial serif,
  in tabular figures so a 3-digit id sits on the same rail as a 1-digit one.
  Still `--ink` on `--surface`, the pairing the sweep already proves at 4.5:1.
- **Hex readouts** — a row of the combo's per-colour hex, aligned one-per-cell
  under the raw strip. Hex is the one datum the grid card has no room for (ADR
  0006 §3); the band is where it finally fits. It is `--ink-muted` mono on
  `--surface` — text below the strip, never over a raw colour — so it inherits
  the same guarantee as the rest of the meta, not a new one.

The strip stays T2's raw, equal-split, full-bleed gesture (ADR 0009 §1); T4 only
adds finish beneath it.

### 4. The wordmark is `--ink`, so the accent keeps meaning the combo

T4 adds one piece of identity chrome T2 did not have: a **wordmark** in the
header. It is drawn in `--ink`, not the accent — deliberately. ADR 0009 §2 spent
the accent on *the active combo* (the header rule, the band eyebrow, the current
route). If the wordmark were also accent, "accent" would blur between "the
combo" and "the brand". Keeping the wordmark in `--ink` — identity that is the
same in every combo — leaves the accent meaning exactly one thing across the
chrome. The same discipline ADR 0006 §4 and ADR 0009 practised, applied to the
new element.

### 5. Motion is feedback, and it is gated

Four moments move, each layered over a UI that already works without it:

- **The re-theme cross-fade** (`--dur-theme`) — selecting a combo rewrites the
  whole neutral ramp; without a fade the page snaps, including the light↔dark
  flip. The transition is scoped to the theme-bearing **chrome** (body, header,
  band, filter bar, footer, notice), *not* the 348 grid cards, whose
  simultaneous colour repaint would cost far more than the effect is worth. The
  band's raw strip is left to cut — it is raw colour, and snapping matches the
  cards.
- **The band's meta rises in** on each pick, keyed on combo id so it replays
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
- The AA sweep is untouched: everything T4 adds uses only the contract-guaranteed
  `--ink` / `--ink-muted` / `--accent` / `--on-accent` pairings the adapter
  already audits (ADR 0002, ADR 0009 §3), and no new text is laid over a raw
  swatch. The hard gate holds by construction.
- The re-theme fade is deliberately *not* on the grid. If a future card-level
  transition is wanted, it has to be measured against the ADR 0006 §6 budget
  first — 348 simultaneous colour repaints is exactly the cost that section
  exists to police.
- The serif is a system-font stack. On a platform lacking every named face it
  falls back to the platform serif, which is the intended character anyway; no
  web font is loaded and there is no FOUT to manage.
