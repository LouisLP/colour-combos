# japanese-colour-combos

A browser for all 348 classic combinations in Sanzo Wada's *A Dictionary of
Color Combinations*. Click one to get its full tonal scale and code you can
copy.

**[louislp.github.io/japanese-colour-combos](https://louislp.github.io/japanese-colour-combos/)**

Every combination is adapted into a full semantic design system, and CI proves
all 696 renderings (348 combos × 2 modes) clear WCAG 2.2 AA. A combo that can't
be made legible doesn't ship. So far, there are none.

## Running it

```sh
pnpm install
pnpm dev
```

| | |
| --- | --- |
| `pnpm test` | unit tests, plus the AA and scale-promise sweeps |
| `pnpm lint` | |
| `pnpm build` | type-check and build to `dist/` |
| `pnpm build:lib` | build the importable package to `dist-lib/` |
| `pnpm smoke:lib` | pack, install and import the built package |
| `pnpm preview` | serve the build at `/japanese-colour-combos/` |

`prototypes/` holds the React prototypes the ADRs cite. They're frozen and only
run from commit `b057a76`; see `prototypes/README.md`.

## The package

Every combo is also an importable scale: CSS, Tailwind v4, SCSS, W3C design
tokens and typed JS/TS (`japanese-colour-combos/42.css`,
`japanese-colour-combos/42`, and so on). Usage for each format is in
[`src/lib/README.md`](src/lib/README.md), which ships as the package's README.

`pnpm build:lib` writes the package to `dist-lib/`. tsdown bundles the main
entry from `src/lib/index.ts`, then `scripts/build-lib.ts` uses that build to
generate every combo in every format, plus a `package.json` with the `exports`
map. Nothing in `dist-lib/` is committed, and CI builds and smoke-tests it on
every push.

The package's version is the root `package.json`'s. Publishing is manual, from
a clean `main`:

```sh
npm version patch   # or minor / major: bumps, commits and tags vX.Y.Z
pnpm build:lib && pnpm smoke:lib
npm publish dist-lib
git push --follow-tags
```

Use `npm version`, not `pnpm version`. pnpm 11's command applies change intents
instead of bumping.

## Deployment

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.
The host makes two things easy to break:

- **Base path.** A project page lives at `/japanese-colour-combos/`, so Vite's
  `base` and the router's history base have to agree. `main.ts` reads
  `import.meta.env.BASE_URL`, so `base` in `vite.config.ts` is the only knob.
- **SPA fallback.** Deep links need `/*` → `/index.html` (ADR 0004 §9). Pages
  has no rewrite rules, so the build writes a `404.html` copy instead. CI checks
  it, because a missing fallback only breaks on the deployed host.

## Where the decisions live

`CONTEXT.md` is the glossary and `docs/adr/` is the reasoning. If you only read
one, read [ADR 0002](docs/adr/0002-combo-adaptation-model.md): the combo →
design-system adaptation model, which everything else hangs off.
[ADR 0015](docs/adr/0015-playful-redesign-dialog-not-retheme.md) covers the site
as it is now (one dark look, a details dialog, no favourites).

## Credits

Colours are from Sanzo Wada's *A Dictionary of Color Combinations* (1933–1937),
which is public domain. The data comes from
[dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations)
by Matt DesLauriers (MIT). See [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).

The code and the generated scales are MIT; see [LICENSE](LICENSE).
