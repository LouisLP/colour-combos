# Context

A browser for Sanzo Wada's *A Dictionary of Color Combinations* (348 classic
combos). Selecting a combo re-themes the entire site through a contrast-safe
semantic design system.

Stack: React 19, Vite, TypeScript, Antfu ESLint config.

## Glossary

**Combo** — one of the 348 classic Wada combinations: an ordered set of 2–4
colours. The unit of selection, sharing, and favouriting. "Seasons" and other
non-classic Wada sets are out of scope.

**Colour** — a single entry within a combo, carrying its hex, RGB and LAB values
from the source data. A colour belongs to a combo; the same physical pigment
appearing in two combos is two colours.

**Selected combo** — the one combo currently theming the site. Exactly one is
always selected; a bare URL resolves to a random one. Distinct from a
*favourited* combo, of which there may be many.

**Mode** — light or dark. A pure function of the selected combo, not a user
control: the combo renders light when its colours average lighter than neutral
mid-grey (mean OKLab L ≥ 0.60), dark otherwise. One combo → one canonical
rendering; there is no toggle and no `prefers-color-scheme` default. See
[ADR 0008](docs/adr/0008-combo-owned-mode.md), superseding
[ADR 0001](docs/adr/0001-light-dark-and-combo-theming-semantics.md) §1.

**Favourite** — a combo the visitor has starred. Stored browser-locally as a
bare numeric Wada id, never a copy of the combo's colours; there may be many, and
favouriting is independent of selection. Note the identifier in code and in the
URL is spelled `favorites` (the `/favorites` route, the
`colour-combos:favorites` storage key). See
[ADR 0003](docs/adr/0003-favorites-persistence.md).

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

**Accent** — the combo colour used at full strength for buttons, links, borders,
focus rings and now the chrome (header rule, active-route underline, the identity
band's eyebrow), lightness-clamped where necessary to clear AA. ADR 0006 §4 once
reserved it for *interactive state* only; [ADR 0009](docs/adr/0009-bolder-combo-colour-across-chrome.md)
spreads it across the chrome to make the selected combo obvious at a glance.
Identity is now disambiguated by the neutral marker, not accent scarcity — the
selected combo is marked in `--ink`, not `--accent` (ADR 0009 §4).

**Raw vs role use** — showing a colour *as itself* (swatch, hex readout) uses
the exact Wada value and is never altered; using it *as a role* permits
lightness adjustment with hue and chroma preserved.

**Token baseline** — the achromatic zero-chroma fallback values every role
carries before hydration, and when a URL names a combo that doesn't exist.

**Palette** — the concrete custom-property values one (combo, mode) pair
derives to. Never stored: a pure function of the URL — the URL fixes the combo,
and the combo fixes the mode (see **Mode**) — memoised in the adapter and
rendered as a `<style>` element. See
[ADR 0005](docs/adr/0005-app-state-architecture.md).

**Module store** — a module-level singleton owning exactly one fact, read
through `useSyncExternalStore`. Favourites is now the only one; the app ships no
context providers. (Mode was the second until it became combo-derived —
[ADR 0008](docs/adr/0008-combo-owned-mode.md).)

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
