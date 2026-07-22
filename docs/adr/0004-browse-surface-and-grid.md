# 4. Browse surface and combo card

- **Status**: Accepted
- **Date**: 2026-07-22
- **Ticket**: [Browse & grid UI](https://github.com/LouisLP/colour-combos/issues/13)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Builds on**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md),
  [ADR 0002](0002-combo-adaptation-model.md) §5,
  [ADR 0003](0003-favorites-persistence.md) §3
- **Prototype**: `prototypes/browse-grid/` (three variants, `?variant=A|B|C`)

## Context

Everything the browse surface depends on is settled: the data schema, the
theming semantics, the token contract, and the `c` / `q` / `size` param
contract shared with `/favorites`. What was not settled is the surface itself —
how a 2–4 colour combo reads at grid scale, how a page themed *by* one combo
displays the other 347 without the grid and the theme fighting, and whether 348
cards paint acceptably.

Three structurally different browse surfaces were built on the real adaptation
model and the real param contract, then measured in a production build under
Chromium:

| | A — Framed catalogue | B — Colour wall | C — Reference index |
| --- | --- | --- | --- |
| unit | bordered card on `--surface` | gapless full-bleed tile | table row |
| swatches | equal-split bands | proportional, ranked | one lead block + chips |
| metadata | always visible | hover/focus reveal | always, including hex |
| selected | `--ink` ring + pill | punched out of the wall | inverted row + gutter bar |
| filters | sticky bar above grid | floating command bar | left rail with facet counts |
| star | always visible | hover, coarse-pointer always | always, full-height target |
| theme stance | participation | withdrawal | abstinence |

## Decision

### 1. Variant A — the framed card grid

Cards on `--surface` with a hairline `--border`, an equal-split swatch block,
and a caption that is always present. It is the least clever of the three and
the only one that survives contact with the actual catalogue.

The deciding property is that **a card must read as a combination, not as
colours**. B proved the negative case: with zero gaps, adjacent tiles' bands
line up into continuous horizontal stripes across the whole viewport and the
eye cannot find the boundary between one combo and the next. The wall is a
gorgeous image and a useless browser — it dissolves the exact unit the product
exists to sell. The frame is not decoration; it is what makes the unit legible.

### 2. Equal-split bands, not proportional ones

B and C weighted their bands by the ADR 0002 accent ranking, which is honest —
the widest band is the colour that would dominate the theme. At grid scale it
fails twice: a 4-colour combo's third and fourth bands become slivers too thin
to read as colours, and the weighting silently editorialises about a plate
where Wada gave the colours equal standing.

Equal split, full bleed, no rounding on the swatch block itself. The card's
`overflow: hidden` provides the corner radius so no `--canvas` shows through
between the colours.

### 3. There is no combo name — the label is `No. N` plus its colour names

Worth stating plainly because the issue asked and the schema answers: a Wada
combo carries **no name of its own**. Only its colours do. So the caption is
`No. 12` in `--ink` with `Isabella Color · Green Blue` beneath it in
`--ink-muted`, ellipsised at one line.

Hex values do **not** appear on the card. They are the one piece of metadata a
grid cannot afford — three or four monospace strings per card at 13rem wide
either wrap to three lines or shrink below legibility. C proved they are
wonderful when there is room for them; the grid is not that room. They live on
the card's `title` and on the detail surface.

### 4. Recursion: the grid participates, and *selected* is marked in `--ink`

The page wears the selected combo while showing 347 rivals, so the marker for
"this is the one you're wearing" cannot be `--accent` — the accent is already
on the filter chips, the focus rings and the buttons, and a fourth accented
thing reads as more chrome rather than as *this one*.

So: the selected card gets a 2px `--ink` outline and an `--ink` / `--surface`
pill reading **Theming this page**. `--ink` is the one token guaranteed 4.5:1
against every surface in the system (ADR 0002 §5), which makes the marker
theme-proof by construction rather than by luck.

The general rule this generalises to: **`--accent` is spent only on interactive
state** — an engaged filter chip, a starred star, a focus ring. Never on
identity or decoration. That leaves the accent meaning exactly one thing on a
page that is otherwise saturated with colour it does not control.

Withdrawal (B) and abstinence (C) were the other two stances and both work
visually, but participation is the only one that keeps the browse surface part
of the same product as the rest of the site.

### 5. Grid density

`repeat(auto-fill, minmax(13rem, 1fr))`, widening to `minmax(15rem, 1fr)` above
100rem. That yields 5 columns at 1440px, 2 at 390px, and never a card so narrow
that the caption ellipsises on the first word.

### 6. No virtualisation. `content-visibility: auto` instead

Measured, not assumed — production build, Chromium, synchronous style+layout
forcing (no `requestAnimationFrame` quantisation), 12 successive filter passes
re-rendering the whole grid, plus 60 full-document scroll jumps:

| | 1440×900 | | 390×844, 4× CPU throttle | |
| --- | --- | --- | --- | --- |
| | `cv: auto` | no `cv` | `cv: auto` | no `cv` |
| filter pass, mean | 4.7 ms | 7.4 ms | 14.8 ms | 26.0 ms |
| filter pass, worst | 8.8 ms | 19.5 ms | 31.8 ms | 76.5 ms |
| 60 scroll jumps, total | 0.5 ms | 0.1 ms | 0.4 ms | 0.7 ms |
| select + re-theme | 1.4 ms | 0.5 ms | — | — |
| first grid painted | — | — | 285 ms | 336 ms |

348 cards is 5,248 DOM nodes and a 12,516px document. A full re-render of every
card on every keystroke costs single-digit milliseconds on a desktop and stays
inside one frame on a 4×-throttled phone. **Virtualisation would buy nothing
and cost scroll restoration, find-in-page, and Ctrl+F.**

`content-visibility: auto` with `contain-intrinsic-size: auto 11rem` on each
grid item is kept because it more than halves the *worst* keystroke on the slow
device — 32 ms against 77 ms, and on B and C 32/36 ms against 92/99 ms. That is
the difference between a filter that feels immediate and one that visibly
stutters at the top of the range. Scroll cost stays negligible either way.

Its price is a document height estimated from `contain-intrinsic-size` rather
than measured: 13,498px against a true 12,516px, ~8% out, so the scrollbar
thumb drifts as skipped content is rendered for real. Accepted — a slightly
elastic scrollbar is a smaller sin than a stuttering search.

### 7. Filters and search

A sticky bar directly under the header, holding the search field, the size
chips, and a live count. Chips carry their **facet counts** — `Any (348)`,
`2 colours (120)`, `3 colours (120)`, `4 colours (108)` — lifted from C, which
made it obvious that a count is what turns a filter into a fact about the
catalogue. Search matches colour names, hex values, and the combo number.

The history semantics from the routing decision hold up in use: `replace` on
typing (250 ms debounce) with a local echo so the field never lags a keystroke,
`push` on chip toggles. Back after a search returns to the pre-search grid in
one step instead of unwinding letter by letter, and back after a chip toggle
undoes exactly that toggle. Both are what the hand expects.

Empty results are a live surface, not a dead end: heading, a line naming what
search actually covers, and a **Clear filters** button.

### 8. The star is always visible

Hover-only fails on touch outright, and focus-only hides the feature from
everyone not driving by keyboard. B's compromise —
`@media (pointer: coarse)` to force it visible — works, but it means the
affordance a designer looks at is not the one half the users get.

So the star sits in the caption row at all times: `--ink-muted` when off,
`--accent-text` when on, `aria-pressed` carrying the state. At 348 cards it is
348 permanent glyphs and the grid still reads as colour, because the star is
outside the swatch block entirely.

## Consequences

- **The grid component is shared with `/favorites`** exactly as ADR 0003 §3
  requires; the route supplies the source list, and the empty state's copy is
  the only branch.
- **Hex values now need a home.** Cutting them from the card makes the detail
  surface responsible for the full readout — that is the next ticket's problem,
  and it inherits a real requirement from this one.
- **`content-visibility` is load-bearing for search feel on mobile**, so it is
  not a stray optimisation to be tidied away. The 8% scrollbar drift is its
  known cost and should not be "fixed" by removing it.
- **`--accent` is now reserved for interactive state** across the whole site,
  not just the grid. That is a constraint on every component built after this.
- **Writing history from inside a `setState` updater is a trap.** The prototype
  hit it: React double-invokes updaters under `StrictMode`, so every selection
  pushed two identical entries and Back appeared to do nothing until pressed
  twice. The URL write has to happen outside the updater. Worth knowing before
  the real router integration repeats it.
- **The measurement harness is worth keeping.** The prototype's `ⓘ` panel
  reports commit time, time-to-paint and node count live, and the numbers above
  are reproducible from it.
- **Cards render raw Wada hex** (ADR 0001 §4), so the grid is the one surface
  where the token system is deliberately absent from the largest pixel area on
  screen.

## Alternatives rejected

- **B — the colour wall.** The best-looking of the three and the one that
  answers the recursion problem most elegantly (the wall opts out of the theme
  entirely, so nothing can fight it). Rejected because gapless tiling destroys
  combo boundaries — adjacent tiles' bands merge into continuous stripes and the
  combination stops being visible as a unit. Its punch-out selection also
  *shrinks* the selected tile, emphasising it by making it smaller.
- **C — the reference index.** Genuinely better than A at the thing it does:
  hex values inline, faceted counts, everything scannable. Rejected as the
  browse surface because it is a lookup table, not a browse — you read it rather
  than see it, colour occupies maybe 8% of the row, and 348 rows is an
  18,474px document. Its facet counts were taken into A.
- **Proportional bands weighted by accent rank** — encodes real information
  about how the combo would theme the site, but reduces a 4-colour combo's
  minor colours to unreadable slivers.
- **Hover-revealed metadata** — maximises colour per card and dies on touch.
- **Marking the selected card with `--accent`** — the obvious choice, and wrong:
  the accent is already spread across the page chrome, so it reads as one more
  accented element rather than as identity.
- **Windowed/virtualised list** — measured as unnecessary at 348 items, and it
  would cost find-in-page and scroll restoration to buy nothing.
