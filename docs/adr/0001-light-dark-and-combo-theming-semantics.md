# 1. Light/dark and combo theming semantics

- **Status**: Accepted; §1 and the two-rendering framing of §5 superseded by
  [ADR 0008](0008-combo-owned-mode.md)
- **Date**: 2026-07-22
- **Ticket**: [Light/dark & combo theming semantics](https://github.com/LouisLP/colour-combos/issues/3)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)

## Context

Selecting one of the 348 Wada combos re-themes the entire site. Before an
adaptation algorithm can be designed, the *semantics* everything else themes
against have to be fixed: what light/dark means, how much of the page the raw
combo colours touch, what contrast we promise, and what gives when a combo's own
colours can't keep that promise.

## Decision

### 1. Mode is site-owned, not combo-derived

> **Superseded by [ADR 0008](0008-combo-owned-mode.md).** Mode is now a pure
> function of the selected combo: no toggle, no `prefers-color-scheme` default,
> and one rendering per combo rather than two. The rest of this ADR — the
> derived canvas, the AA contract, the raw-vs-role split — stands.

The site has its own light/dark toggle, defaulting to `prefers-color-scheme`.
It is the sole source of truth for mode.

A combo is a **colour source**, never a mode. Every one of the 348 combos must
render in both light and dark. There is no combo-native mode and no way for a
combo to override the user's choice.

### 2. Derived near-neutral canvas, raw combo colours as accents

The page canvas and surfaces are **derived**, not raw: the combo's hue is kept,
chroma is dropped hard, and lightness is pushed to the extreme of the active
mode.

```css
--canvas: light-dark(
  oklch(from var(--combo-hue-source) 97% calc(c * 0.1) h),
  oklch(from var(--combo-hue-source) 15% calc(c * 0.1) h)
);
```

Raw combo colours appear at full strength only in **accent** positions —
buttons, links, borders, chips, focus rings, and the swatches themselves.
Re-theming therefore reads as a hue shift across the whole page rather than a
block of paint, and body text legibility is guaranteed by construction.

The site is never full-bleed in a raw combo colour. Too many Wada colours sit at
mid-luminance, where light and dark stop meaning anything and AA is unreachable
without overriding the colour anyway.

### 3. Contrast contract: WCAG 2.2 AA

- **4.5:1** for body text against its surface.
- **3:1** for large text (≥24px, or ≥19px bold) and for UI boundaries — button
  fills, borders, icons, focus rings.

AA is a hard gate, not a target. Nothing ships failing it.

### 4. Swatches are sacred; role colours are adjustable

The same colour has two distinct uses, and only one of them is negotiable.

- **Displayed as itself** — grid card, detail swatch, hex/RGB/LAB readout: the
  exact Wada value, never altered. This is the product's whole reason to exist.
- **Playing a role** — accent, link, button fill, border: may be
  lightness-shifted in `oklch` with **hue and chroma preserved** until it clears
  the AA floor against the current canvas.

The combo stays recognisable, the UI always passes, and the two contracts never
collide because they never apply to the same pixel.

### 5. Role assignment is mode-invariant

> **Partly superseded by [ADR 0008](0008-combo-owned-mode.md).** The invariant
> below still holds — assignment is computed once per combo and derivation is
> mode-dependent — but a combo now only ever renders in *one* mode, so there is
> no toggle to flip and no two-ways-lit reading to preserve.

Which colour is the hue source and which is the accent is computed **once per
combo** and holds in both modes. Only the *derivation* is mode-dependent:
canvas lightness swings between the extremes, ink inverts, and accent lightness
is clamped toward whichever end clears AA against the current canvas.

Flipping the toggle must read as one palette lit two ways — never as the combo
itself changing.

### 6. Default state: random combo, pinned to the URL

A bare `/` picks a random combo and immediately `replaceState`s it into the URL,
so the visit is reproducible and shareable from the first frame.

Achromatic neutrals (zero chroma, `light-dark()` greys) survive as the **token
baseline** — the static fallback before hydration, and the resolution when a URL
names a combo that doesn't exist. They are never a resting state a user sits in.

## Consequences

- Every combo needs validation in **two** renderings (light, dark) — not four,
  because role assignment doesn't fork by mode.
- The adaptation model ([Combo → design-system adaptation model](https://github.com/LouisLP/colour-combos/issues/4))
  inherits a fixed target: pick a hue source and an accent per combo, derive the
  neutrals, clamp the accent to AA. It does **not** get to redefine what light
  and dark mean.
- `contrast-color()` is the natural fit for on-accent text but is not yet
  broadly baseline; the adaptation prototype must confirm support and specify a
  computed fallback.
- Random-on-load constrains the still-open URL/routing decision: the URL must be
  writable before first paint settles, so combo identity has to resolve
  synchronously.
- Accessibility validation across all 348 combos is now a checkable claim
  rather than an aspiration, since the floor and the adjustment rule are both
  fixed.

## Alternatives rejected

- **Combo-derived mode with no toggle** — maximum fidelity, but ignores system
  preference and leaves users unable to force a mode.
- **Full-bleed raw combo backgrounds** — the boldest rendering, rejected because
  mid-luminance combos make AA unreachable and collapse the light/dark
  distinction.
- **AAA for body text** — nearly free given derived neutrals, but it constrains
  how tinted the canvas may be for little practical gain over AA.
- **Never altering raw colours** (substituting or failing loudly instead) —
  either makes some combos visibly theme less than others, or knowingly ships
  inaccessible UI.
- **Achromatic or fixed-house-combo default** — safe, but the site never
  demonstrates its core mechanic on arrival.
