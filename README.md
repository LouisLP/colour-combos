# colour-combos

A browser for Sanzo Wada's *A Dictionary of Color Combinations* — all 348
classic combinations. Pick one and it re-themes the entire site, contrast-safe
in light and dark.

**[louislp.github.io/colour-combos](https://louislp.github.io/colour-combos/)**

The interesting part is not the grid, it is what happens when you click a card:
every combination is adapted into a full semantic design system at runtime, and
all 696 renderings (348 combos × 2 modes) are proved to clear WCAG 2.2 AA in
CI. A combo that cannot be made legible does not ship — there are none.

## Running it

```sh
pnpm install
pnpm dev
```

| | |
| --- | --- |
| `pnpm test` | unit tests plus the full AA sweep |
| `pnpm lint` | |
| `pnpm build` | type-check and build to `dist/` |
| `pnpm preview` | serve the build at `/colour-combos/` |

Two prototypes are kept in the repo because their ADRs cite them:
`pnpm prototype:adaptation` and `pnpm prototype:browse`.

## Deployment

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Two things follow from the host and are easy to break:

- **Base path.** A project page is served from `/colour-combos/`, so Vite's
  `base` and the router's `basepath` must agree. They do — the router reads
  `import.meta.env.BASE_URL`, so `base` in `vite.config.ts` is the single knob.
- **SPA fallback.** Deep links need `/*` → `/index.html` (ADR 0004 §9). GitHub
  Pages has no rewrite rules, so the build writes a `404.html` copy instead.
  CI asserts it, because a missing fallback only fails on the deployed host.

## Where the decisions live

`CONTEXT.md` holds the glossary; `docs/adr/` holds the reasoning. Start with
[ADR 0002](docs/adr/0002-combo-adaptation-model.md) if you only read one — it
is the combo → design-system adaptation model everything else hangs off.

## Credits

Colours from Sanzo Wada's *A Dictionary of Color Combinations* (1933–1937),
public domain; data via
[dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations)
by Matt DesLauriers (MIT). See [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).
