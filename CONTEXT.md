# Context

A browser for Sanzo Wada's *A Dictionary of Color Combinations* (~360 classic
combos). Selecting a combo re-themes the entire site through a contrast-safe
semantic design system.

Stack: React 19, Vite, TypeScript, Antfu ESLint config.

## Glossary

**Combo** — one of the ~360 classic Wada combinations: an ordered set of 2–4
colours. The unit of selection, sharing, and favouriting. "Seasons" and other
non-classic Wada sets are out of scope.

**Colour** — a single entry within a combo, carrying its hex, RGB and LAB values
from the source data. A colour belongs to a combo; the same physical pigment
appearing in two combos is two colours.

**Selected combo** — the one combo currently theming the site. Exactly one is
always selected; a bare URL resolves to a random one. Distinct from a
*favourited* combo, of which there may be many.

**Mode** — light or dark. Owned by the site's own toggle (defaulting to
`prefers-color-scheme`), never by the combo. See
[ADR 0001](docs/adr/0001-light-dark-and-combo-theming-semantics.md).

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

**Accent** — the combo colour used at full strength for buttons, links, borders
and focus rings, lightness-clamped where necessary to clear AA.

**Raw vs role use** — showing a colour *as itself* (swatch, hex readout) uses
the exact Wada value and is never altered; using it *as a role* permits
lightness adjustment with hue and chroma preserved.

**Token baseline** — the achromatic zero-chroma fallback values every role
carries before hydration, and when a URL names a combo that doesn't exist.

## Decisions

- [ADR 0001 — Light/dark and combo theming semantics](docs/adr/0001-light-dark-and-combo-theming-semantics.md)
