# 2. Combo → design-system adaptation model

- **Status**: Accepted
- **Date**: 2026-07-22
- **Ticket**: [Combo → design-system adaptation model](https://github.com/LouisLP/colour-combos/issues/4)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Builds on**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md)
- **Prototype**: `prototypes/adaptation-model/` (branch `worktree-adaptation-model`)

## Context

ADR 0001 fixed the semantics: site-owned light/dark, derived near-neutral canvas
tinted by the combo's hue, raw colours as accents only, WCAG 2.2 AA as a hard
gate, mode-invariant role assignment. What it did not fix is the **algorithm** —
which of a combo's 2–4 colours becomes the hue source, which becomes the accent,
how the missing roles are filled, and what happens when the raw colours cannot
hold the contrast contract.

Three candidate assignment algorithms were built and run over all 348 combos in
both modes (696 renderings each). They share one derivation stage, so the only
variable is assignment.

| | A — source order | B — luminance ordering | **C — chroma-weighted hybrid** |
|---|---|---|---|
| Hue source | colour #2 | lightest colour | quietest *usable* colour |
| Primary accent | colour #1 | darkest colour | best chroma-vs-drift score |
| Analysis required | none | one sort | one sort + a contrast probe |
| AA failures | **0 / 696** | **0 / 696** | **0 / 696** |
| Accent used at its exact Wada lightness | 58% | 58% | **62%** |
| Mean accent ΔL | 0.062 | 0.067 | **0.052** |
| Renderings where accent ΔL > 0.2 (identity visibly lost) | 12.5% | 11.9% | **8.5%** |
| Mean accent chroma (how colourful the UI reads) | 0.118 | 0.093 | **0.138** |

The three disagree on assignment for **315 of 348** combos, so the choice is not
academic.

## Decision

### 1. Adopt variant C — chroma-weighted hybrid

**AA is not the discriminator.** All three variants pass every pairing on every
combo in both modes, because the derivation clamps until they do. What separates
them is how much of the combo survives the clamping. C is the best on all three
fidelity measures at once: it keeps the accent at its published lightness most
often, moves it least when it must move, and yields the most colourful UI.

### 2. Assignment (computed once per combo, invariant across modes)

**Hue source** — the colour with the *lowest* OKLCh chroma among those with
`c >= 0.04`. The quietest colour loses the least when chroma is cut ~90%, so
tinting from it is the least destructive choice.

The `c >= 0.04` eligibility floor is load-bearing. Below it a colour's hue is
numerical noise, and 46 of 348 combos contain such a colour — without the floor
C picks it every single time, tinting 13% of the catalogue with an arbitrary
hue. If *no* colour clears the floor (combo #69, Warm Gray + Black), the site
renders with genuinely achromatic neutrals rather than a fabricated tint.

**Accents** — every colour, including the hue source, ranked by

```
score = chroma × (1 − 0.6 × min(1, meanRequiredΔL / 0.5))
```

where `meanRequiredΔL` is how far the colour must move in lightness to clear 3:1
against each mode's canvas. Vivid colours win; colours that can only reach AA by
abandoning their own lightness are demoted. Rank 1 is `--accent`, rank 2
`--accent-2`, rank 3 `--accent-3`.

**The hue source is not excluded from accent ranking.** Combo #55 is Old Rose +
White; excluding it forces White to be the accent, and light mode drags White to
`#868686`. One colour honestly playing two roles beats a colour that has to stop
being itself. This happens for 30 of 348 combos.

### 3. Scaling from 2 to 4 colours

Roles are **ranked, not positional**. A combo of any size produces a full
palette; `--accent-2` and `--accent-3` simply resolve to lower-ranked colours,
and in a 2-colour combo the same colour may fill more than one accent slot. No
role is ever synthesised out of nothing, and no combo renders a role empty.

### 4. Derivation — clamp against the *worst* surface, not the nearest one

Every foreground token is clamped against `--surface-muted`, the
lowest-contrast backdrop it can legally land on — not against `--canvas`.

This was the prototype's most valuable finding. Clamping against the canvas
produced a palette that passed its own audit and **failed AA on 454 of 696
renderings** the moment an accent link was rendered on a muted card. Contrast is
a property of a pair, so a token that can appear on three surfaces must be
clamped against the darkest of them.

### 5. Token set

| Token | Derivation | Contract |
|---|---|---|
| `--canvas` | hue source, L 98.5% / 18%, chroma clamped to [0.0066, 0.012] | — |
| `--surface` | hue source, L 100% / 22.5% | — |
| `--surface-muted` | hue source, L 94.5% / 28%, chroma ≤ 0.02 | — |
| `--ink` | hue source, L 24% / 94%, chroma ≤ 0.03 | ≥ 4.5:1 on `--surface-muted` |
| `--ink-muted` | hue source, L 52% / 72% | ≥ 4.5:1 on `--surface-muted` |
| `--border` | hue source, L 88% / 35%, chroma ≤ 0.035 | decorative hairline, **no promise** |
| `--border-strong` | as `--border`, clamped | ≥ 3:1 on `--canvas` |
| `--accent` | rank-1 colour, lightness-clamped | ≥ 3:1 on `--surface-muted` |
| `--accent-text` | rank-1 colour, lightness-clamped harder | ≥ 4.5:1 on `--surface-muted` |
| `--on-accent` | `contrast-color(--accent)` | ≥ 4.5:1 on `--accent` |
| `--accent-2`, `--accent-2-text`, `--on-accent-2` | rank-2, same rules | as above |
| `--accent-3`, … | rank-3, same rules | as above |

Two border tokens, not one. A 3:1 hairline around every card is visually loud
and is not required — AA's 3:1 applies to boundaries that *carry information*
(inputs, focus rings, the selected state). Decorative dividers get `--border`;
anything a user must perceive to operate the UI gets `--border-strong`.

Likewise `--accent` and `--accent-text` are separate because they carry
different contracts (3:1 fill vs 4.5:1 text). Collapsing them to one token means
either illegible links or needlessly dulled buttons.

### 6. Clamping is computed in TypeScript, not in CSS

The neutral ramp is expressible as pure CSS relative colour and should be
authored that way:

```css
--canvas: light-dark(
  oklch(from var(--hue-source) 98.5% clamp(0.0066, calc(c * 0.08), 0.012) h),
  oklch(from var(--hue-source) 18%   clamp(0.0066, calc(c * 0.08), 0.012) h)
);
```

The **accent clamp cannot be**: it is a search for the smallest lightness shift
that clears a contrast ratio, and CSS has no contrast function to branch on. So
role assignment and accent clamping run in TS at combo-selection time and are
written to the document as concrete `oklch()` values; the neutrals stay
declarative.

`contrast-color()` is used for `--on-accent` where supported, with a computed
black-or-white fallback behind `@supports`. Because `--accent` is already
guaranteed ≥ 3:1 against the canvas and is clamped away from mid-luminance, the
fallback and the native function agree in practice.

### 7. The fallback when raw colours fight the contract

There is no failure mode — there is a **drift budget**. Lightness moves, hue and
chroma are held, and the sweep confirms the promise is real: gamut mapping after
a lightness shift moves hue by at most **0.86°** and costs a mean of **0.009**
chroma. "Hue and chroma preserved" from ADR 0001 survives contact with the data.

The cost lands entirely in lightness, and it is bounded: worst case across the
catalogue is ΔL 0.36 (combo #139, Deep Indigo `#051230` → `#607399` in dark
mode — a near-black colour cannot be an accent on a near-black page). 8.5% of
renderings exceed ΔL 0.2. Those combos read as a lighter version of themselves,
never as a different colour, and they remain correct in the swatch grid where
the raw value is shown untouched.

## Consequences

- **The design-token architecture is now specified**, not just sketched — §5 is
  the token contract the site builds against. That map item can close with this
  ADR.
- **Accessibility validation is done, not deferred.** `sweep.ts` is a 60-line
  script that proves 0 AA failures over 348 combos × 2 modes × 13 pairings. It
  should be promoted from the prototype into a real test so a change to the
  ladder cannot silently break the guarantee.
- **Combo selection has a compute cost** (one assignment + ~6 clamp searches).
  Measured at well under a millisecond; assignment is cacheable per combo id
  since it is mode-invariant.
- Component authors reference tokens only. Any component reaching for
  `combo.colours[n]` is a bug except in the swatch/readout components, where the
  raw value is the product.
- The `c >= 0.04` floor and the 0.5 drift-penalty denominator are tuned
  constants, not derived truths. They are worth re-checking if the palette ever
  gains the Seasons volume.

## Alternatives rejected

- **Variant A (source order)** — free, zero analysis, and faithful to the book's
  ordering. Rejected because Wada's ordering is a *compositional* order, not a
  UI-role order: it makes the accent 12.5% likely to be visibly dragged and
  yields a measurably duller UI. Fidelity to the printed sequence is not the
  same as fidelity to the colours.
- **Variant B (luminance ordering)** — the most explicable rule, and it maps
  intuitively onto "paper and ink". Rejected because it ignores chroma entirely:
  picking the darkest colour as the accent systematically selects the colour
  with the least room to move in dark mode, and produces the dullest UI of the
  three (mean accent chroma 0.093 vs C's 0.138).
- **Per-mode role assignment** — would cut drift further by picking a different
  accent in dark mode. Rejected by ADR 0001: flipping the toggle must read as
  one palette lit two ways.
- **Synthesising missing roles by hue rotation** for 2-colour combos — invents
  colours Wada never chose, in a product whose entire premise is his choices.
- **Failing loudly on combos that can't hold AA** — no combo actually fails, so
  the branch would be dead code guarding an impossible state.
