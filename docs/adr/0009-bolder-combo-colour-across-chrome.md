# 9. Bolder combo colour across the chrome

- **Status**: Accepted
- **Date**: 2026-07-23
- **Ticket**: [T2: Bolder combo colour across the chrome](https://github.com/LouisLP/colour-combos/issues/34)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Supersedes**: [ADR 0006](0006-browse-surface-and-grid.md) §4's reservation
  of `--accent` for interactive state only
- **Builds on**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md) §2–4
  (the raw-vs-role split and the AA gate), [ADR 0002](0002-combo-adaptation-model.md)
  §5 (the token contract), [ADR 0008](0008-combo-owned-mode.md) (the combo owns
  its mode, so "the active rendering" is a single thing to theme against)

## Context

The theming works, but it whispers. Raw combo colour reached the page in only
two places — the swatch blocks and thin accent positions (ADR 0001 §2) — and the
chrome that surrounds them is *derived* near-neutral: hue-tinted, but at a chroma
capped near 0.02 (ADR 0002 §5). A visitor landing on the site cannot tell which
of the 348 schemes is selected without reading a card's "Theming this page" pill,
which may be scrolled out of view. The scheme is doing its job everywhere and
announcing it nowhere.

T2's brief: push the combo further into the chrome so re-theming reads across the
whole page, using **the accent family and the hue-tinted surfaces already in the
token system** — no new palette — while the canvas stays near-neutral and legible
and WCAG 2.2 AA stays a hard gate.

## Decision

### 1. An identity band, showing the combo as itself

The headline move is a band at the top of the page that shows the active combo's
**raw colours** in a large-format equal-split strip, with its number and colour
names below. It is the same gesture as a combo card's swatch block, scaled up to
dominate the fold.

Raw is deliberate and legal: colours in the strip are shown *as themselves*, so
the "swatches are sacred" contract (ADR 0001 §4) governs them and no role is
applied. The band's text sits *below* the strip on `--surface`, never over the
raw colours, so nothing in it has to hold a contrast promise against an arbitrary
Wada value.

It is shared chrome — it lives in `HubLayout` above both `/` and `/favorites`,
and reads the combo from the URL like everything else. It is identity, not
document structure: the number is a `<p>`, not a heading, so it never competes
with a page's own `<h1>`.

### 2. The accent family enters the chrome

Three chrome surfaces now carry the accent, where before ADR 0006 §4 forbade it:

- a **4px `--accent` rule** across the top edge of the header;
- the **active nav route** underlined in `--accent`;
- the identity band's **eyebrow**, an `--on-accent`-on-`--accent` pill.

This is a straight widening back toward ADR 0001 §2, which always listed borders
and chips among the accent positions. ADR 0006 §4 had narrowed accent to
interactive state only; §2 of this ADR reverses that narrowing on purpose — see
§4 below for what replaces the signal it protected. What stays out of bounds is
unchanged from ADR 0001 §2: **no new raw full-bleed body.** The chrome takes the
*derived* accent and the hue-tinted surfaces; only the identity strip and the
swatch grid show raw colour, and only ever as itself.

### 3. AA by reuse, not by new proof

Every new coloured surface is built from a token pairing the AA sweep already
proves across the whole catalogue:

| Surface | Pairing | Contract already swept |
|---|---|---|
| Eyebrow pill | `--on-accent` on `--accent` | ≥ 4.5:1 |
| Header rule / nav underline | `--accent` boundary on `--surface` | ≥ 3:1 (via worst-surface) |
| Active nav text | `--accent-text` on `--surface` | ≥ 4.5:1 (via worst-surface) |
| Band number / names | `--ink` / `--ink-muted` on `--surface` | ≥ 4.5:1 |

No pairing here is new, so `adapt.sweep.test.ts` — 348 combos × 1 canonical mode
(ADR 0008) — already covers every one of them, and the canvas ramp and the
adapter are untouched. Spread and emphasis, not a new contract.

### 4. The selected-combo marker stays `--ink` — and its reasoning inverts

ADR 0006 §4 marked the selected card in `--ink` rather than `--accent` because
the accent was *scarce and reserved for interactive state*, so an accent ring
would read as "more chrome" rather than "this one." This ADR spends that
scarcity. The conclusion survives the premise flipping — it gets *stronger*: now
that the accent is deliberately everywhere, the neutral `--ink` is the only mark
left that reads as identity rather than as one more accented thing.

So the compensating rule for retiring "accent means interactive" is: **the
selected-combo identity is carried by the neutral, not the accent.** `--ink` is
guaranteed 4.5:1 on every surface (ADR 0002 §5), which keeps that one
load-bearing signal theme-proof by construction while the accent goes loud
around it.

### 5. No new tokens

Everything above is drawn from the existing token set. The palette is T4's remit
(the beauty pass); T2 is spread and emphasis over what T1 and ADR 0002 already
ship.

## Consequences

- **`--accent` no longer means "interactive only."** ADR 0006 §4's single-meaning
  reservation is retired site-wide; accent is now the combo's colour across the
  chrome, and identity is disambiguated by the neutral marker (§4) instead of by
  accent scarcity. Components built after this may reach for the accent family as
  chrome, not only as interactive state.
- **The AA sweep is unchanged and still green.** New surfaces reuse proven
  pairings, so there was nothing new to prove and nothing that could regress; the
  sweep stays 348 × 1 at 0 failures.
- **The identity band is shared chrome in `HubLayout`.** Like the theme style and
  the not-found notice, it sits above the outlet and survives the move between
  `/` and `/favorites`.
- **The header now has a permanent coloured top edge**, so the chrome reads the
  combo even before the band scrolls into view.

## Alternatives rejected

- **Keep accent interactive-only; spread the combo through hue-tinted surfaces
  alone.** The honest minimal reading of "use the surfaces already in the token
  system" — and too timid to meet the brief. Those surfaces cap at ~0.02 chroma
  by contract (ADR 0002 §5); leaning on them harder either stays a whisper or
  breaks the near-neutral-canvas promise (ADR 0001 §2). The combo would still not
  be obvious from the chrome.
- **A raw full-bleed header or hero background.** The boldest rendering and the
  one ADR 0001 §2 exists to forbid: too many Wada colours sit at mid-luminance,
  where AA is unreachable without overriding the colour and light/dark stops
  meaning anything. The raw *strip* gets the boldness without ever putting text
  on a raw value.
- **Make the band a real `<h1>`.** It is the most prominent thing on the page, so
  a heading is tempting — but both routes already own an `<h1>` for structure,
  and two would break the document outline. The band is identity chrome, not the
  page's structural title.
- **Tint every card frame toward the accent.** "Card frames" is in the brief, but
  accenting all 348 frames re-fights ADR 0006 §1: the hairline frame exists to
  make a combo read as a *unit*, and a loud accent frame reads as chrome and
  turns the grid noisy. Card frames keep the hue-tinted `--border`; the chrome
  spread lands on the header, the nav and the band instead.
