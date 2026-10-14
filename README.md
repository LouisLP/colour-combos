# colour-combos

A browser for Sanzo Wada's *A Dictionary of Color Combinations* — all 348
classic combinations. Click one for its full tonal scale and copy-ready code.

**[louislp.github.io/colour-combos](https://louislp.github.io/colour-combos/)**

Under the grid, every combination is adapted into a full semantic design
system, and all 696 renderings (348 combos × 2 modes) are proved to clear WCAG
2.2 AA in CI. A combo that cannot be made legible does not ship — there are
none.

## Running it

```sh
pnpm install
pnpm dev
```

| | |
| --- | --- |
| `pnpm test` | unit tests plus the AA and scale-promise sweeps |
| `pnpm lint` | |
| `pnpm build` | type-check and build to `dist/` |
| `pnpm build:lib` | build the importable package to `dist-lib/` |
| `pnpm smoke:lib` | pack, install and import the built package |
| `pnpm preview` | serve the build at `/colour-combos/` |

The React prototypes in `prototypes/` are kept because their ADRs cite them.
They are frozen as React and run from commit `b057a76`; see
`prototypes/README.md`.

## The package

Every combo is also an importable scale, in CSS, Tailwind v4, SCSS, W3C design
tokens and typed JS/TS: `colour-combos/42.css`, `colour-combos/42`, and so on.
Usage per format is in [`src/lib/README.md`](src/lib/README.md), which ships
as the package's README.

`pnpm build:lib` writes the package to `dist-lib/`: tsdown bundles the main
entry from `src/lib/index.ts`, then `scripts/build-lib.ts` generates every combo
in every format from that build, plus the `package.json` with the `exports`
map. Nothing in `dist-lib/` is committed. CI builds it and runs the smoke test
on every push.

The package's version is the root `package.json`'s. Publishing is a manual
step, from a clean `main`:

```sh
npm version patch   # or minor / major: bumps, commits and tags vX.Y.Z
pnpm build:lib && pnpm smoke:lib
npm publish dist-lib
git push --follow-tags
```

`npm version`, not `pnpm version`: pnpm 11's command applies change intents
instead of bumping.

## Deployment

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Two things follow from the host and are easy to break:

- **Base path.** A project page is served from `/colour-combos/`, so Vite's
  `base` and the router's history base must agree. They do — `main.ts` reads
  `import.meta.env.BASE_URL`, so `base` in `vite.config.ts` is the single knob.
- **SPA fallback.** Deep links need `/*` → `/index.html` (ADR 0004 §9). GitHub
  Pages has no rewrite rules, so the build writes a `404.html` copy instead.
  CI asserts it, because a missing fallback only fails on the deployed host.

## Where the decisions live

`CONTEXT.md` holds the glossary; `docs/adr/` holds the reasoning. Start with
[ADR 0002](docs/adr/0002-combo-adaptation-model.md) if you only read one — it
is the combo → design-system adaptation model everything else hangs off.
[ADR 0015](docs/adr/0015-playful-redesign-dialog-not-retheme.md) covers the
current site: one dark look, a details dialog, no favourites.

## Credits

Colours from Sanzo Wada's *A Dictionary of Color Combinations* (1933–1937),
public domain; data via
[dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations)
by Matt DesLauriers (MIT). See [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).

The code and the generated scales are MIT; see [LICENSE](LICENSE).
