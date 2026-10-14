# 12. Combo scale model

- **Status**: Accepted
- **Date**: 2026-10-14
- **Ticket**: [T2: Combo scale model — prototype → ADR](https://github.com/LouisLP/colour-combos/issues/43)
- **Map**: [Vue rewrite, exportable scale library & docs UI](https://github.com/LouisLP/colour-combos/issues/41)
- **Builds on**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md) §4
  (swatches are sacred), [ADR 0002](0002-combo-adaptation-model.md) (the
  semantic roles and the AA contract), [ADR 0008](0008-combo-owned-mode.md)
  (canonical mode)
- **Prototype**: [`prototypes/scale-model/`](../../prototypes/scale-model/)

## Context

The product is changing from a site that re-themes itself into a library of
importable colour scales, one per Wada combo. The shape of a scale is the
library's public API: export formats (T4) and the combo page (T6) both read
it, and it is expensive to change once anyone imports it.

Today the adapter (ADR 0002) turns a combo into about a dozen semantic roles for
one mode. That works for theming this site and nothing else. Someone building a
real UI from a combo needs more: light and dark tints of every colour, a neutral
ramp, and a guarantee of which pairings are legible.

The prototype built three ways to place the exact Wada hex in a ramp, under two
lightness curves, and checked nine candidate contrast promises across all 348
combos (1032 colour ramps and 348 neutral ramps). Two results decided this ADR:

- **A perceptual lightness curve cannot carry contrast promises.** Steps spaced
  evenly in OKLab L fail "any two steps ≥500 apart clear 4.5:1" in 880–1032 of
  the 1032 colour ramps. At equal OKLab L, a saturated blue and a saturated
  yellow differ widely in WCAG luminance, so a promise that depends only on step
  distance needs steps placed by luminance.
- **The exact hex can sit inside the ramp only if the ends are pushed
  outward.** A Wada colour rarely lands exactly on a step's luminance target; it
  misses by up to ×1.18 contrast. Grade-gap promises survive that only when each
  100 grades buys at least ×1.39 contrast, which puts step 50 at near-white and
  step 950 at near-black.

## Decision

### 1. A scale has two layers

A **scale** is the complete exported value of one combo:

- the **tonal layer**: one 11-step ramp per Wada colour, plus one neutral ramp;
- the **semantic layer**: the ADR 0002 roles, computed for **both** modes, with
  the combo's canonical mode (ADR 0008) marked.

```ts
interface ComboScale {
  id: number
  canonicalMode: 'light' | 'dark'
  ramps: Ramp[] // one per Wada colour, in combo order
  neutral: Ramp
  semantic: Record<'light' | 'dark', Record<RoleName, ColourValue>>
}

interface Ramp {
  name: string // Wada name, e.g. "English Red"
  slug: string // "english-red"
  anchor: Step // which step holds the exact Wada hex (absent on neutral)
  steps: Record<Step, ColourValue>
}

interface ColourValue { hex: string, oklch: [l: number, c: number, h: number], rgb: [number, number, number] }
```

No Display P3 values in v1. In sRGB, 17% of steps lose chroma to gamut mapping,
and fewer than half of those (44%) would keep more in P3. That gain is too small to justify
a second value per step, and it can be added later without breaking anything.

### 2. Steps

There are eleven steps, `50 100 200 300 400 500 600 700 800 900 950`.

### 3. Lightness curve: fixed WCAG luminance, geometric

Each step has a target WCAG relative luminance `Y`. The targets are spaced so
that every 100 grades multiplies `Y + 0.05`, and therefore the contrast ratio,
by the same factor:

```
Y(50)  = 0.98     Y(950) = 0.001
r      = ((0.98 + 0.05) / (0.001 + 0.05)) ^ (1/9) ≈ 1.3965   per 100 grades
Y(s)   = (0.98 + 0.05) / r ^ ((s − 50) / 100) − 0.05
```

| step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Y | .980 | .822 | .574 | .397 | .270 | .179 | .114 | .068 | .034 | .010 | .001 |

The 950 step is offset by only 50 grades, but it still follows the formula; it
is the formula's end point, not a special case.

For each colour and step, the generator finds the OKLab L whose rendered colour
(after the chroma taper of §4 and the gamut mapping of §5) has luminance
`Y(step)`. It does this by bisection on L, 28 iterations. Contrast between steps
therefore follows from step distance regardless of hue, which is what lets §7
promise anything.

### 4. Hue and chroma

- **Hue** is the Wada colour's OKLCh hue, held at every step.
- **Chroma** tapers away from the anchor's lightness `La`, using the anchor's
  chroma `Ca`:

  ```
  t = L > La ? (1 − L) / (1 − La) : L / La
  C(L) = Ca × (0.12 + 0.88 × min(1, t) ^ 0.85)
  ```

  The 0.12 floor keeps a trace of the colour at 50 and 950, so the ends read as
  that colour's paper and ink rather than plain white and black.

### 5. Gamut mapping

The generator maps to sRGB by reducing chroma, holding hue and L. This is the
existing `oklchToRgb` (`src/theme/colour.ts`). The output is an 8-bit hex.
Measured hue drift of the emitted hex, on steps with chroma ≥ 0.03, is at most
6.6°. The **tolerance is 8°**. Gamut mapping holds hue exactly, so the drift is
the 8-bit rounding of near-white and near-black steps. It rose from 2.9° to
6.6° when the ends were pushed outward (§3).

### 6. Anchoring: the exact hex replaces its nearest step

ADR 0001 §4 says swatches are sacred. The exact Wada hex is **inside** its ramp:

- The anchor step is the step whose target is nearest the colour's own
  luminance, measured as `|ln(Y + 0.05) − ln(Y_step + 0.05)|`. This is distance
  in contrast space, so "nearest" means the smallest contrast miss.
- That step's value **is** the Wada hex, byte for byte. Every other step is
  generated as in §3–§5.
- `anchor` records which step that is. Exports also emit an unsuffixed alias
  for it (§8).

Across the catalogue, anchors land on steps 50–900:

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 92 | 178 | 193 | 135 | 135 | 96 | 114 | 50 | 38 | 0 |

A ramp is a function of the colour's hex alone, not of the combo it appears in.
The catalogue contains 159 distinct colours, and each name slug maps to exactly
one hex. A colour therefore has the same ramp in every combo that contains it.

### 7. Contrast promises

The library guarantees these pairings for **every ramp, colour and neutral, in
all 348 combos**:

| Promise | Worst measured |
|---|---|
| 950 on 50 ≥ 7:1 | 20.08 |
| 900 on 50 ≥ 7:1 | 16.98 |
| 600 on 50 ≥ 4.5:1 | 5.45 |
| 500 on 50 ≥ 3:1 | 3.81 |
| **any two steps ≥ 500 grades apart ≥ 4.5:1** | **4.50** |
| **any two steps ≥ 400 grades apart ≥ 3:1** | 3.23 |

The two grade-gap rules are the important ones. They make the ramp usable in
either mode without lookup tables: in light mode, put 600 text on 100; in dark
mode, put 300 text on 800; both clear 4.5:1 because they are 500 grades apart.

**The margin on the 500-grade rule is zero.** The worst case is an anchored step
against the step 500 grades away, sitting at 4.50 after 8-bit rounding. That is
a pass, but it means any change to §3–§6 can break it. The promises become a
CI sweep over the catalogue in T3, in the same spirit as the existing AA gate
(`adapt.sweep.test.ts`). A curve change that turns the sweep red is rejected,
not waved through.

The promises cover the tonal layer. The semantic layer keeps its own contract
(ADR 0002 §4), which the existing AA sweep already gates.

### 8. Naming

Exports use the `--cc-` prefix and two parallel namespaces:

- **Colour-named**, global across the library: `--cc-<slug>-<step>`, plus
  `--cc-<slug>` aliased to the anchor step. Example: `--cc-english-red-400`,
  and `--cc-english-red: var(--cc-english-red-400)`. Because ramps depend only
  on the hex (§6), importing several combos never produces two different
  values for one name.
- **Role-named**, per combo, for drop-in theming: `--cc-accent-*`,
  `--cc-accent-2-*` … `--cc-accent-4-*`, and `--cc-neutral-*`. Accents are
  ranked by the adapter's assignment (ADR 0002 §2). The semantic roles are
  `--cc-<role>` (`--cc-canvas`, `--cc-ink`, `--cc-accent-text`, …).

No Wada slug collides with a role name. One looks like it might: Neutral Gray
produces `--cc-neutral-gray-*`, which is distinct from the role ramp
`--cc-neutral-*`. T3 should add a test asserting the namespaces stay disjoint.

### 9. The semantic layer exports values, not step references

The prototype measured how close each adapter role lands to its nearest tonal
step. The light canvas and the accents match within the just-noticeable range
(ΔEok < 0.02). Ink, borders, the dark canvas and every `on-accent` (pure black
or white) miss by 2–10 ΔE. Forcing roles onto steps would change what the site
renders and reopen ADR 0002's contrast fixes.

So the semantic layer exports the adapter's exact values for both modes. The
adapter remains the single source of the semantic layer. T3 must call it, not
re-derive the roles, so the exported semantic layer cannot diverge from the
site's live preview.

### 10. The site keeps re-theming on select

Selecting a combo still themes the site in its canonical mode. That is now a
live preview of the semantic layer rather than the product itself, and it
shows that the exported roles work in a real UI.

### 11. The neutral ramp

The neutral ramp is tinted from the adapter's hue source and uses the same
luminance curve as the colour ramps. Its chroma peaks mid-ramp and never
exceeds 0.03:

```
C(L) = min(0.03, C_src × 0.16) × (0.5 + 0.5 × max(0, 1 − |L − 0.6| / 0.45))
```

If the combo has no colour above `HUE_SOURCE_MIN_CHROMA`, the neutral ramp is
true grey (C = 0), matching ADR 0002 §2.

## Consequences

- The scale engine is a pure function of combo id. T3 can memoise it per combo
  the way `adapt()` is memoised (ADR 0005 §3).
- The ramp ends are extreme. 50 is about `#fffcfb` and 950 about `#0b0100`,
  very close to white and black. That is the price of keeping the exact hex in
  the ramp while promising grade-gap contrast. The other end of the trade-off
  is the rejected separate-`DEFAULT` alternative.
- The sweep becomes a second CI hard gate beside AA. Its 4.50 margin means
  curve parameters are effectively frozen once published. Any change is a
  breaking change to the library's guarantees and needs its own ADR.
- The adapter's own `LADDER` (canvas at L 0.985, ink at L 0.24, …) is
  unrelated to the tonal steps. That is deliberate (§9), but the docs (T6)
  should not imply that roles are steps.
- No P3 in v1. Adding it later adds a field and changes no existing value.

## Alternatives rejected

- **Fixed OKLab L per step** (TARGET_L `0.97 … 0.22`). This curve is
  perceptually even and looks good, but contrast then depends on hue.
  "600 on 50 ≥ 4.5:1" fails in 8 ramps, and the grade-gap rules fail in most
  of them. It would mean promising per pairing and per colour rather than
  across the library.
- **Separate `DEFAULT` key, ramp untouched (Tailwind-style).** This passed
  every promise with real margin (5.26 on the 500-grade rule at the chosen
  ends, and still 5.01 at softer ends of 0.95 / 0.004). It was rejected because the exact Wada hex would not be in the
  ramp. ADR 0001 §4 makes the swatch sacred, and a ramp a user can walk without
  ever meeting the actual colour breaks that in spirit. If the extreme ends
  prove unworkable in real use, this is the fallback, and it needs a
  superseding ADR.
- **Anchor-relative re-spacing.** The anchor keeps its own lightness and the
  other steps are re-interpolated between it and the ends. Every step moves per
  colour, so no fixed-pair promise holds: 818 of 1032 ramps fail the
  500-grade rule on the luminance curve, and all 1032 fail it on the OKLab
  curve.
- **Softer luminance ends** (Y 0.95 / 0.004). These give friendlier 50 and 950
  values but fail the 500-grade rule in 112 ramps (53 ramps at 0.97 / 0.002).
- **Semantic roles as references into the tonal layer.** See §9.
- **One mode per combo (ADR 0008 only).** Rejected because a library user may
  need a combo in the mode the site never shows it in. Both modes are exported,
  and the canonical one is marked.
