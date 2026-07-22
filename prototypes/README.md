# Prototypes

Throwaway code that answers a question. **Nothing here ships.** It is exempt
from the ESLint ruleset (`eslint.config.js` ignores `prototypes/**`) and carries
no tests. Once a prototype's question is settled, the answer is folded into an
ADR and the prototype stays here as the primary source.

## `adaptation-model/` — issue #4

**Question:** given an arbitrary 2–4 colour Wada combo, how do we derive a
complete, contrast-safe semantic palette?

**Answer:** [ADR 0002](../docs/adr/0002-combo-adaptation-model.md) — variant C,
the chroma-weighted hybrid.

```bash
npm run prototype:adaptation   # http://localhost:5173/prototypes/adaptation-model/
node prototypes/adaptation-model/sweep.ts   # headless AA sweep, 348 combos x 2 modes
```

Three assignment algorithms on one page, switchable via `?variant=A|B|C`. Also
`?combo=1..348` and `?mode=light|dark`. Keys: `←`/`→` variant, `↑`/`↓` combo.
The `⚠` button jumps to the combos that fight the contrast contract hardest.

The dark panel on the right is prototype chrome — a live WCAG audit, the drift
of each role from its raw Wada value, and the CSS the combo would emit. It is
not part of the design being evaluated. Everything to its left renders from role
tokens only, except the swatches and hex readouts, which show raw values by
design (ADR 0001 §4).

| File | |
|---|---|
| `colour.ts` | sRGB ↔ OKLCh, gamut mapping, WCAG contrast. No dependencies. |
| `adapt.ts` | the three assignment algorithms + the shared derivation stage |
| `sweep.ts` | headless validation over the whole catalogue |
| `combos.json` | 348 combos inverted from `mattdesl/dictionary-of-colour-combinations` (MIT) |

## `browse-grid/` — issue #13

**Question:** what does the browse surface look like — the grid of 348 combos,
the combo card, and how filter/search render into it?

**Answer:** [ADR 0004](../docs/adr/0004-browse-surface-and-grid.md) — variant A,
the framed card grid, with facet counts taken from C. No virtualisation.

```bash
npm run prototype:browse   # http://localhost:5173/prototypes/browse-grid/
```

Three browse surfaces on one route, switchable via `?variant=A|B|C` or `←`/`→`.
The page is themed by `?c=` through the real ADR 0002 adaptation model, so the
recursion problem — a page wearing one combo while displaying 347 others — is
live rather than simulated. Also `?q=`, `?size=2|3|4`, `?fav=1`,
`?mode=light|dark`, and `?cv=0` to disable `content-visibility`.

The `?c`/`?q`/`?size` params implement the real routing contract, including its
push-on-select / replace-on-type history semantics. Favourites use the ADR 0003
store shape but are **memory-only** — persistence is settled elsewhere and a
prototype should not depend on it.

The dark pill at the bottom and the `ⓘ` panel behind it are prototype chrome:
live commit time, time-to-paint, DOM node count, a `content-visibility` toggle
and a 12-pass filter stress test. The measurements in ADR 0004 §6 are
reproducible from it.

| File | |
|---|---|
| `App.tsx` | theming, param contract, variant switcher, measurement chrome |
| `VariantA/B/C.tsx` | the three surfaces — no shared layout, by design |
| `state.ts` | params + history semantics, filtering, favourites store, paint meter |
| `shared.tsx` | the star glyph and the accent-ranked band split. Nothing else. |
