# Context

A browser for Sanzo Wada's *A Dictionary of Color Combinations* (348 classic
combos). Clicking a combo opens a dialog with its full tonal scale and
copy-ready code; each combo is also an importable, contrast-safe design system.
The site has one dark look of its own and never re-themes
([ADR 0015](docs/adr/0015-playful-redesign-dialog-not-retheme.md)).

Stack: Vue 3 (`<script setup>` SFCs, `vue-router`), Reka UI (dialog, tabs),
Vite, TypeScript, Antfu ESLint config. See [ADR 0011](docs/adr/0011-vue-migration.md).

## Glossary

**Combo** — one of the 348 classic Wada combinations: an ordered set of 2–4
colours. The unit of browsing, sharing and export. "Seasons" and other
non-classic Wada sets are out of scope.

**Colour** — a single entry within a combo, carrying its hex, RGB and LAB values
from the source data. A colour belongs to a combo; the same physical pigment
appearing in two combos is two colours.

**Open combo** — the combo whose details dialog is showing, named by `?c=`. At
most one; none on a bare URL. Opening is a navigation, so Back closes it and a
link reopens it. See [ADR 0015](docs/adr/0015-playful-redesign-dialog-not-retheme.md).

**Mode** — light or dark. A property of a combo's *scale*, not of the site:
each scale exports both, with its *canonical* mode marked — light when its
colours average lighter than neutral mid-grey (mean OKLab L ≥ 0.60), dark
otherwise. See [ADR 0008](docs/adr/0008-combo-owned-mode.md). The site itself is
dark only.

**Role** — a semantic slot the design system renders from (canvas, surface,
ink, accent, on-accent, border, …). Roles are what components reference; they
never reference a combo's colours positionally.

**Role assignment** — deciding which of a combo's 2–4 colours fills which role.
Computed once per combo and invariant across modes.

**Derivation** — producing a role's final value from an assigned colour for the
active mode (`oklch` lightness/chroma manipulation). Mode-dependent, unlike
assignment.

**Hue source** — the combo colour whose hue tints the derived near-neutral
canvas and surfaces. Its chroma is heavily reduced; it is not shown raw.

**Accent** — the combo colour used at full strength for the scale's buttons,
links, borders and focus rings, lightness-clamped where necessary to clear AA.

**Raw vs role use** — showing a colour *as itself* (swatch, hex readout) uses
the exact Wada value and is never altered; using it *as a role* permits
lightness adjustment with hue and chroma preserved.

**Scale** — the complete exported value of one combo: a tonal layer and a
semantic layer. The library's public unit, and a pure function of the combo id.
See [ADR 0012](docs/adr/0012-combo-scale-model.md).

**Tonal layer** — one 11-step ramp per colour in a combo, plus a neutral ramp
tinted from the hue source. Steps are placed by WCAG luminance, so the contrast
between two steps depends on how far apart they are, never on hue.

**Step** — one of the eleven positions `50 100 200 … 900 950` in a ramp, each
with a fixed target luminance. Steps ≥500 apart clear 4.5:1, and steps ≥400
apart clear 3:1, in every ramp in the catalogue.

**Anchor** — the step in a colour's ramp that holds the exact Wada hex. It is
the step nearest the colour's own luminance, and its generated value is replaced
by the raw hex, so the swatch is always in its ramp. A ramp depends only on its
colour's hex, so a colour has the same ramp and anchor in every combo.

**Semantic layer** — the roles (canvas, ink, accent, …) exported for both modes,
with the combo's canonical mode marked. Exact adapter values, not references to
steps.

**Emitter** — a pure function from a scale to one export format's text (CSS,
Tailwind, SCSS, design tokens, TS/JS). The single source of that text: the
package's files and the dialog's code blocks both come from it. See
[ADR 0013](docs/adr/0013-export-formats-and-package.md).

**Density**.

**Details dialog** — a Reka UI dialog over the grid: one combo's raw swatches,
full scale and code blocks that are emitter output byte for byte. Every value is
hex and one click from the clipboard.

**Hue family** — one of red, orange, yellow, green, blue, purple or neutral,
assigned to each colour by its OKLCH hue (neutral below the hue-source chroma
floor). A combo is *in* a family when any of its colours is. Filterable via
`?hue=`, alongside the `?q=` search.

**Drift budget** — the lightness a role colour is permitted to move to clear its
contrast floor. Hue and chroma are held; only lightness pays. Bounded at ΔL 0.36
across the catalogue. See [ADR 0002](docs/adr/0002-combo-adaptation-model.md).

**Worst surface** — the lowest-contrast backdrop a foreground token can legally
land on (`--surface-muted`). Every foreground is clamped against it, not against
the surface it happens to sit on in one component.

## Decisions

- [ADR 0001 — Light/dark and combo theming semantics](docs/adr/0001-light-dark-and-combo-theming-semantics.md)
- [ADR 0002 — Combo → design-system adaptation model](docs/adr/0002-combo-adaptation-model.md)
- [ADR 0003 — Favourites persistence model](docs/adr/0003-favorites-persistence.md)
- [ADR 0004 — Shareable combo URL & routing scheme](docs/adr/0004-routing-and-url-state.md)
- [ADR 0005 — App state architecture](docs/adr/0005-app-state-architecture.md)
- [ADR 0006 — Browse surface and combo card](docs/adr/0006-browse-surface-and-grid.md)
- [ADR 0007 — Combo card refinements](docs/adr/0007-combo-card-refinements.md)
- [ADR 0008 — Combo-owned light/dark mode](docs/adr/0008-combo-owned-mode.md)
- [ADR 0009 — Bolder combo colour across the chrome](docs/adr/0009-bolder-combo-colour-across-chrome.md)
- [ADR 0010 — Visual language](docs/adr/0010-visual-language.md)
- [ADR 0011 — Port the site to Vue 3](docs/adr/0011-vue-migration.md)
- [ADR 0012 — Combo scale model](docs/adr/0012-combo-scale-model.md)
- [ADR 0013 — Export formats and the importable package](docs/adr/0013-export-formats-and-package.md)
- [ADR 0014 — Faster browse: compact list, richer filters, keyboard](docs/adr/0014-faster-browse.md)
- [ADR 0015 — Playful redesign: one dark scheme, a details dialog, no favourites](docs/adr/0015-playful-redesign-dialog-not-retheme.md)
