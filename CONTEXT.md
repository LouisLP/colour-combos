# Context

A browser for the 348 classic combos in Sanzo Wada's *A Dictionary of Color
Combinations*. Clicking a combo opens a dialog with its full tonal scale and
code you can copy, and every combo is also an importable, contrast-safe design
system. The site has one dark look of its own and never re-themes
([ADR 0015](docs/adr/0015-playful-redesign-dialog-not-retheme.md)).

Stack: Vue 3 (`<script setup>` SFCs, `vue-router`), Reka UI (dialog, tabs),
Vite, TypeScript and the Antfu ESLint config. See [ADR 0011](docs/adr/0011-vue-migration.md).

## Glossary

**Combo**: one of the 348 classic Wada combinations, an ordered set of 2–4
colours. It's the unit of browsing, sharing and export. "Seasons" and Wada's
other non-classic sets are out of scope.

**Colour**: one entry in a combo, with its hex, RGB and LAB values from the
source data. A colour belongs to a combo, so the same pigment in two combos is
two colours.

**Open combo**: the combo whose details dialog is showing, named by `?c=`. There's
at most one, and none on a bare URL. Opening is a navigation, so Back closes it
and a link reopens it. See [ADR 0015](docs/adr/0015-playful-redesign-dialog-not-retheme.md).

**Mode**: light or dark. It belongs to a combo's *scale*, not to the site. Each
scale exports both and marks one as *canonical*: light when its colours average
lighter than mid-grey (mean OKLab L ≥ 0.60), dark otherwise. See
[ADR 0008](docs/adr/0008-combo-owned-mode.md). The site itself is dark only.

**Role**: a semantic slot the design system renders from (canvas, surface, ink,
accent, on-accent, border, …). Components reference roles, never a combo's
colours by position.

**Role assignment**: deciding which of a combo's 2–4 colours fills which role.
It's computed once per combo and doesn't change between modes.

**Derivation**: producing a role's final value from its assigned colour for one
mode, by moving `oklch` lightness and chroma. Unlike assignment, it depends on
the mode.

**Hue source**: the combo colour whose hue tints the near-neutral canvas and
surfaces. Its chroma is cut hard, and it's never shown raw.

**Accent**: the combo colour used at full strength for the scale's buttons,
links, borders and focus rings. Its lightness is clamped where needed to clear
AA.

**Raw vs role use**: showing a colour *as itself* (a swatch, a hex readout) uses
the exact Wada value and never alters it. Using it *as a role* allows a
lightness change, with hue and chroma kept.

**Scale**: the complete exported value of one combo, made of a tonal layer and a
semantic layer. It's the library's public unit, and a pure function of the
combo id. See [ADR 0012](docs/adr/0012-combo-scale-model.md).

**Tonal layer**: one 11-step ramp per colour in a combo, plus a neutral ramp
tinted from the hue source. Steps are placed by WCAG luminance, so the contrast
between two steps depends on how far apart they are, never on hue.

**Step**: one of the eleven positions `50 100 200 … 900 950` in a ramp, each
with a fixed target luminance. In every ramp in the catalogue, steps ≥500 apart
clear 4.5:1 and steps ≥400 apart clear 3:1.

**Anchor**: the step in a colour's ramp that holds the exact Wada hex. It's the
step nearest the colour's own luminance, and the raw hex replaces its generated
value, so the swatch is always in its ramp. A ramp depends only on its colour's
hex, so a colour has the same ramp and anchor in every combo.

**Semantic layer**: the roles (canvas, ink, accent, …) for both modes, with the
combo's canonical mode marked. These are exact adapter values, not references to
steps.

**Emitter**: a pure function from a scale to the text of one export format (CSS,
Tailwind, SCSS, design tokens, TS/JS). It's the only source of that text: the
package's files and the dialog's code blocks both come from it. See
[ADR 0013](docs/adr/0013-export-formats-and-package.md).

**Details dialog**: a Reka UI dialog over the grid, showing one combo's raw
swatches, its full scale, and code blocks that match emitter output byte for
byte. Every value is hex and one click from the clipboard.

**Hue family**: red, orange, yellow, green, blue, purple or neutral, assigned to
each colour by its OKLCH hue (neutral below the hue-source chroma floor). A combo
is *in* a family when any of its colours is. Filter by it with `?hue=`, next to
the `?q=` search.

**Drift budget**: how far a role colour's lightness may move to clear its
contrast floor. Hue and chroma hold, and only lightness pays. It's bounded at
ΔL 0.36 across the catalogue. See [ADR 0002](docs/adr/0002-combo-adaptation-model.md).

**Worst surface**: the lowest-contrast backdrop a foreground token can legally
land on (`--surface-muted`). Every foreground is clamped against it, not against
whichever surface it sits on in one component.

## Decisions

- [ADR 0001: Light/dark and combo theming semantics](docs/adr/0001-light-dark-and-combo-theming-semantics.md)
- [ADR 0002: Combo → design-system adaptation model](docs/adr/0002-combo-adaptation-model.md)
- [ADR 0003: Favourites persistence model](docs/adr/0003-favorites-persistence.md)
- [ADR 0004: Shareable combo URL & routing scheme](docs/adr/0004-routing-and-url-state.md)
- [ADR 0005: App state architecture](docs/adr/0005-app-state-architecture.md)
- [ADR 0006: Browse surface and combo card](docs/adr/0006-browse-surface-and-grid.md)
- [ADR 0007: Combo card refinements](docs/adr/0007-combo-card-refinements.md)
- [ADR 0008: Combo-owned light/dark mode](docs/adr/0008-combo-owned-mode.md)
- [ADR 0009: Bolder combo colour across the chrome](docs/adr/0009-bolder-combo-colour-across-chrome.md)
- [ADR 0010: Visual language](docs/adr/0010-visual-language.md)
- [ADR 0011: Port the site to Vue 3](docs/adr/0011-vue-migration.md)
- [ADR 0012: Combo scale model](docs/adr/0012-combo-scale-model.md)
- [ADR 0013: Export formats and the importable package](docs/adr/0013-export-formats-and-package.md)
- [ADR 0014: Faster browse (compact list, richer filters, keyboard)](docs/adr/0014-faster-browse.md)
- [ADR 0015: Playful redesign (one dark scheme, a details dialog, no favourites)](docs/adr/0015-playful-redesign-dialog-not-retheme.md)
