# 13. Export formats and the importable package

- **Status**: Accepted
- **Date**: 2026-10-14
- **Ticket**: [T4: Export formats & importable package build](https://github.com/LouisLP/colour-combos/issues/45)
- **Map**: [Vue rewrite, exportable scale library & docs UI](https://github.com/LouisLP/colour-combos/issues/41)
- **Builds on**: [ADR 0012](0012-combo-scale-model.md) (the scale, its naming)

## Context

ADR 0012 fixed what a scale is. This decides how it leaves the repo: which
text formats, how a consumer imports one combo without the catalogue, and how
the package is built next to a site that is not a package.

## Decision

### 1. Emitters are pure and are the only source of a format's text

Each format is a pure `(scale: ComboScale) => string` in `src/lib/emit/`:
`emitCss`, `emitTailwind`, `emitScss`, `emitTokens`, `emitTs`, `emitJs`. The
package's files are their output, byte for byte (the smoke test asserts it), and
the combo page (T6) renders its code blocks from them. Names, ramp order and
role order come from one helper (`emit/shared.ts`), so formats cannot disagree.

### 2. Per-format choices

- **CSS**: role ramps are `var()` aliases of the colour ramps, so the file says
  which colour `accent` is. Semantic roles are `light-dark(light, dark)` pairs;
  custom properties resolve where they are used, so `[data-theme]` (which the
  file maps to `color-scheme`) switches a subtree.
- **Tailwind v4**: `--color-cc-*` in one `@theme` block, every value literal.
  Tailwind emits only the theme variables a project uses, so a `var()` alias
  could point at one it pruned. The `cc-` prefix keeps the combo's `neutral`
  off Tailwind's own.
- **SCSS**: variables named as the custom properties are, plus `$cc-ramps` and
  `$cc-semantic` maps for loops and compile-time mode choice.
- **Design tokens**: W3C format, every token under `cc`, role ramps as
  `{cc.<slug>.<step>}` aliases. Values are hex strings rather than the format's
  newer colour objects, because that is what Style Dictionary and Tokens Studio
  read today. The anchor and canonical mode go in `$extensions`, since a group
  cannot also be a token.
- **TS/JS**: the scale object as a module, formatted one colour per line.
- No format sets `color-scheme` on `:root`. The canonical mode is data (JSON,
  SCSS, TS) and a comment (CSS); imposing it on a consumer's page is theirs to
  choose.

### 3. One repo package, two build targets; the published manifest is generated

No pnpm workspace split. The repo's `package.json` stays the private site;
`pnpm build:lib` writes a self-contained package to `dist-lib/` (not
committed), including its own `package.json`. tsdown bundles `src/lib/index.ts`
with declarations; `scripts/build-lib.ts` then generates every combo in every
format by importing that **build**, so the files come from the code that ships.

The package is `colour-combos` (free on npm at the time of writing):

```
colour-combos                 index.js        catalogue, buildScale, emitters
colour-combos/42              scales/42.js    the scale (+ .d.ts)
colour-combos/42.css          css/42.css
colour-combos/42.scss         scss/42.scss
colour-combos/42.json         tokens/42.json
colour-combos/tailwind/42.css tailwind/42.css
```

Export patterns resolve most-specific first in Node and TypeScript, which is
what lets `./*.css` and `./*` coexist.

### 4. CI proves it as a consumer would

`pnpm smoke:lib` counts the files (348 per format), `npm pack`s `dist-lib/`,
installs the tarball into an empty project, imports `colour-combos/42` and
resolves every per-combo specifier by name, and type-checks a NodeNext
consumer. The `exports` map only fails for a consumer, so this is the only
test that can catch it.

## Consequences

- A workspace split stays available: `src/lib` imports only `src/data` and
  `src/theme`, never the site. It is not worth doing until the site needs to
  depend on a published version.
- Publishing is a human step: `npm version`, build, smoke,
  `npm publish dist-lib`. The version is the root `package.json`'s, which
  `scripts/build-lib.ts` copies into the generated manifest. No changesets yet;
  one package with a hand-bumped version does not need them.
- The repo and the package are MIT, matching the upstream digitisation. The
  colours are public domain either way.
- Any change to an emitter's output is a change to the published files. The
  emitter snapshots make it visible in review.
