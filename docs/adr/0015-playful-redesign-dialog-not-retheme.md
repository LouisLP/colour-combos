# 15. Playful redesign: one dark scheme, a details dialog, no favourites

- **Status**: Accepted
- **Date**: 2026-10-14
- **Supersedes**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md) (site theming),
  [ADR 0003](0003-favorites-persistence.md),
  [ADR 0005](0005-app-state-architecture.md) (theme and stores),
  [ADR 0007](0007-combo-card-refinements.md),
  [ADR 0008](0008-combo-owned-mode.md) (site mode; the scale's canonical mode stands),
  [ADR 0009](0009-bolder-combo-colour-across-chrome.md),
  [ADR 0010](0010-visual-language.md),
  [ADR 0014](0014-faster-browse.md);
  amends [ADR 0004](0004-routing-and-url-state.md) and [ADR 0006](0006-browse-surface-and-grid.md)

## Context

The site had grown a lot of UI: re-theming on every click, a combo page,
favourites, a grid/list toggle, a colour-format toggle, five filter groups,
keyboard roving and a shortcuts dialog. Clicking a combo re-themed the whole
page, which felt slow and made the site's own look change every time. It also
looked like a tool rather than something fun to browse.

## Decision

1. **The site no longer re-themes.** It has one dark scheme of its own: sumi
   ink background, washi-paper text, a vermilion (shu) seal accent and gold
   (kin). The adapter and the semantic layer stay, as the package's export
   (ADR 0002, ADR 0012). The site just stops wearing them.
2. **Clicking a combo opens a dialog**, built on Reka UI's `Dialog`, with the
   raw swatches, the full scale and the code blocks. The semantic-role preview
   and the format toggle are gone; every value is hex.
3. **The dialog is `?c=<id>`.** One route, `/`. Opening is a push, so Back
   closes it and a link opens it. Prev/next replace, and closing a dialog we
   pushed is `history.back()`. The grid reads only `q` and `hue`, so the dialog
   never re-renders it. `/combo/:id` and `?combo=` redirect to `?c=`, and
   `/favorites` to `/`.
4. **Favourites are removed.** No storage, no star, no `/favorites`.
5. **Filtering is search plus hue.** The size and mode filters, facet counts,
   match highlighting, density, roving focus and shortcuts are gone.
6. **The look is playful, with Japanese accents.** Dela Gothic One for display,
   Zen Maru Gothic for body text, DM Mono for values, all from Google Fonts. A
   hanko seal reading 配色, a seigaiha wave pattern behind the header, combo
   numbers in kanji (`十二`), and a kanji for each hue chip (赤 橙 黄 緑 青 紫
   灰). The kanji are decoration: each sits beside its English and is
   `aria-hidden`. Cards tilt, buttons bounce, and all motion turns off under
   `prefers-reduced-motion`.

## Consequences

- Much less code: the module stores, `ThemeStyle`, the token emitter and the
  CSS relative-colour ramp (with its joint test) are all gone.
- The AA sweep still gates CI. It covers the package's semantic layer, which no
  longer happens to be on screen.
- The dialog and the scale engine load as an async chunk straight after first
  paint, so the first load is lighter than before.
- Old links still work, but a `?c=` on a bare URL used to pick the theme. Now it
  opens a dialog.
