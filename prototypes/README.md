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
