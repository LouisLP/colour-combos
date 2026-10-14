# 14. Faster browse — compact list, richer filters, keyboard

- **Status**: Superseded by [ADR 0015](0015-playful-redesign-dialog-not-retheme.md)
- **Date**: 2026-10-14
- **Ticket**: [T5: Faster browse — compact view, richer search, keyboard nav](https://github.com/LouisLP/colour-combos/issues/46)
- **Map**: [Vue rewrite, exportable scale library & docs UI](https://github.com/LouisLP/colour-combos/issues/41)
- **Builds on**: [ADR 0004](0004-routing-and-url-state.md) §4–5,
  [ADR 0006](0006-browse-surface-and-grid.md) (amends §3, §6, §7),
  [ADR 0007](0007-combo-card-refinements.md), [ADR 0008](0008-combo-owned-mode.md)

## Context

The map's destination changes what browse is for. A site that re-themes
itself wants a surface to *look at*; a library of importable scales wants a
surface to *find one in*. With ADR 0006's grid, finding a combo you can
already describe is slow: about 26 cards fit on a 1440×900 screen, search
results don't show why they matched, the only filter is size, and everything
needs the mouse.

## Decision

### 1. A second density: the compact list

A Grid / List toggle sits in the filter bar. The grid stays the default and
does not change. The list puts one combo on each ruled line: number, colour
names, a strip of the raw colours with each hex printed on its colour, a "copy
all" button and the star.

- **Three columns at 1440px, row-major**, so the arrow keys mean the same thing
  in both layouts (§4). On a phone it drops to one column. When a row is
  narrower than 23rem (a container query, not a media query), the strip moves
  to its own line under the names.
- **Rows are 1.375rem plus a hairline.** Measured in Chromium at 1440×900,
  averaged over 20 scroll positions mid-catalogue: the grid shows **25.8**
  whole combos (min 24, max 30) and the list shows **99**, which is 3.8× on
  average and 3.3× in the grid's best case. Every target is still 24px apart
  centre to centre (WCAG 2.2 §2.5.8). Coarse pointers get 2.5rem rows.
- **Hexes are on the face.** This reverses ADR 0006 §3 for the list only. That
  section kept hexes off the card because a 13rem card has no room for them.
  The list is ADR 0006's rejected variant C, the reference index, brought back
  as a second view: C lost because it is something you read rather than look
  at, which is exactly what the list is for. Each hex is its own copy button,
  so the label *is* the per-swatch copy control from ADR 0007. The text sits
  on the raw colour in whichever of black or white contrasts more, which
  clears 4.5:1 against any sRGB colour. The `#` is left off so the names keep
  their width.
- **The strip is equal-split and a fixed width** whatever the combo's size
  (ADR 0006 §2), so strips line up in one column down the page.
- **Density is per viewer and stays out of the URL.** It is how one person
  likes to scan, not a fact about what they are looking at, so a shared link
  opens in the recipient's layout. ADR 0004 §6 took the same stance on mode.
  It lives in a second module store, `state/density.ts`, stored under
  `colour-combos:density`. Every storage read and write is wrapped in
  try/catch, and an unusable value falls back to the grid.

### 2. Search highlights what matched

Search still covers colour names, hex and combo number, with the same 250 ms
debounce and the same rules for reading the query (ADR 0006 §7). The parsing
is now exported as `parseNeedle`, so the highlighter and the filter read a
query the same way: a hex query lights only hexes, a number lights nothing
(the number already is the caption), and a word lights names and hexes
without the `#`. A highlight is bold plus an underline in `currentColor`, with
no background. It has to work on `--surface` in a caption and on a raw colour
in a hex chip, and no single background token is legible on both.

### 3. Hue family and mode join size as filters

Two more chip groups, each with facet counts read from the unfiltered list:

- **Hue family** (`?hue=`): red, orange, yellow, green, blue, purple or
  neutral. A combo is in a family when **any** of its colours is. A combo's
  colours have equal standing (ADR 0006 §2), and the accent is a theming
  decision that never shows on a card, so "has a blue in it" is the useful
  question. Families are OKLCH hue ranges fitted to the catalogue's 159
  distinct colours (browns and tans fall in orange, olives in yellow). Any
  colour with chroma below the adapter's hue-source floor, 0.04, is
  `neutral`, so a white is not filed under whatever hue its rounding noise
  points to.
- **Mode** (`?mode=`): light or dark, the combo's canonical mode (ADR 0008).

Both follow the `size` pattern exactly. Values are validated, and an unknown
one counts as no filter rather than an empty grid. A chip toggle `push`es a
history entry (ADR 0004 §5), and the params carry across `/` and `/favorites`.
The full query string now reads `?c=…&q=…&size=…&hue=…&mode=…`.

Only the bar's first row stays pinned: search, count, density toggle and `?`.
Three chip groups wrap to two lines at 1440px and five on a phone, and pinning
them would eat the height the list exists to win. The chips scroll away with
the page.

### 4. Keyboard

| Key | Does |
| --- | --- |
| `/` | Focus search (and select its text) |
| `↓` / `Enter` in search | Write the pending query now, then focus the first result |
| `j` / `k` | Next / previous result |
| `←` `→` / `↑` `↓` | One result / one visual row |
| `Home` / `End` | First / last result |
| `Enter` | Follow the focused result's link, which selects the combo |
| `f` | Toggle the focused result's favourite |
| `c` | Copy all the focused result's hexes |
| `Esc` | Back to search |
| `?` | The shortcuts dialog |

- **Roving focus without roving tabindex.** Each result marks one element
  (its selection link) as its focus target, and the list's keydown handler
  moves focus between those targets. Tab order is unchanged, so every star and
  copy chip can still be reached with Tab, as ADR 0007 promised. The keys are
  an extra fast lane, not a replacement. The column count for `↑`/`↓` is read
  from the layout (how many results share the first row's top edge), because
  `auto-fill` already worked it out.
- **"Focused result" is just where the keydown came from.** `f` and `c` are
  handled on each result's root, so whatever focus is inside is the target.
  There is no separate focus state to keep in sync.
- **Bare keys only.** Shortcuts never fire while typing in a field, or with
  Ctrl, Meta or Alt held, so ⌘C and ⌘F still work.
- **Searching flushes the debounce.** Within 250 ms of the last keystroke the
  results still show the previous query. `↓` and `Enter` write the pending
  query first, so "the first result" means the first one for what is in the
  field.
- **`Enter` selects the combo.** The issue asks for `Enter` to open the T6
  combo page. That page doesn't exist yet, so `Enter` follows the link, which
  selects the combo today. When T6 ships, the result's focus target can point
  at it without any change to the key handling.
- **The focus ring on swatches is `--accent` on a `--surface` band.** A plain
  ring disappears on a swatch close to the accent's hue, and the card's
  `overflow: hidden` clips anything outside it.
- **The shortcuts are listed in a native modal `<dialog>`**, opened by `?` or
  the `?` button in the bar. The browser handles focus trapping, Escape and
  returning focus.

### 5. Copy, consolidated

The per-swatch copy chip (ADR 0007) is now a shared `CopyButton`, used by the
card's chips, the list's hex labels and the list's "copy all". `c` copies a
whole combo as space-separated hexes (`#d96629 #0093a5`) and lights every
chip on that result, so the copy is visible where the colours are. A lit chip
stays visible even on fine pointers, where chips are usually revealed only on
hover.

Announcements go through **one** polite live region in the layout instead of
one per card. That removes 348 idle `role="status"` nodes, and gives keyboard
actions a voice even when they have no visible control of their own (`f` and
`c`).

### 6. `content-visibility` stays

It still applies to every item, with `contain-intrinsic-size: auto 1.5rem`
for list rows. No virtualisation: 348 rows is fewer nodes than 348 cards, and
ADR 0006 §6's arguments are unchanged.

## Consequences

- **There are two module stores again** (favourites and density), and an
  announcer that is shaped like a store but only holds a transient message.
- **The list is the first surface that prints hex on the browse page.** If the
  ruling in §1 is ever challenged, the measurements behind it are here.
- **Hue families depend on the catalogue.** The boundaries were fitted to
  Wada's colours. A different dataset would need them refitted, and
  `data/hue.test.ts` pins the colours whose family is unambiguous.
- **T6 inherits `Enter`.** When the combo page exists, the result's focus
  target is where to wire it up.
- **The results component is now `ComboResults`** (it was `ComboGrid`), since
  it renders either layout.

## Alternatives rejected

- **Density in the URL.** A shared link would force the sender's layout on the
  recipient. That's the same reason mode stayed out of the URL before it
  became combo-owned (ADR 0004 §6).
- **A one-column list.** It reaches about 1.3× the grid's density at 1440px,
  far short of 3×, and leaves two-thirds of a wide screen empty.
- **Column-major (newspaper) flow for the list.** `↓` would then mean "next",
  which is nice, but the first screen would show combos 1–33, 117–150 and
  233–266, which is no way to scan a catalogue.
- **A true roving tabindex** (one tab stop for the whole list). It would make
  per-swatch copy and the star unreachable by Tab, undoing ADR 0007's keyboard
  promise.
- **Hue by accent colour only.** The accent is chosen by the adapter and never
  appears on a card, so filtering on it would show combos with no visible
  reason for being there.
- **A highlight background.** No single token is legible both on `--surface`
  and on an arbitrary raw colour.
