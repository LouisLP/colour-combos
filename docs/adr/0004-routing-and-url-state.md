# 4. Shareable combo URL & routing scheme

- **Status**: Accepted
- **Date**: 2026-07-22
- **Ticket**: [Shareable combo URL & routing scheme](https://github.com/LouisLP/colour-combos/issues/5)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Builds on**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md)

## Context

Selecting a combo re-themes the entire site, so "which combo is active" is the
single most load-bearing piece of state in the app. It has to survive a reload,
a shared link, and navigation between the browse grid and the favourites list —
and per ADR 0001 §6 it has to resolve *synchronously*, before first paint
settles, because the achromatic token baseline is not a resting state.

That forces three questions at once: where the combo lives in the URL, what the
route tree looks like around it, and which router owns the parsing. Filters and
search press on the same seam — they are part of what a shared link should
reproduce.

This ADR records what [#5](https://github.com/LouisLP/colour-combos/issues/5)
settled. It is already cited by
[ADR 0003](0003-favorites-persistence.md) and constrains
[#12](https://github.com/LouisLP/colour-combos/issues/12); it was written up
here so it stops living only in a closed issue's comments.

## Decision

### 1. The URL is the source of truth for the active combo

Selecting a combo is a *navigation*. The theme is a function of the URL, not of
React state. Every themed view is therefore inherently shareable, and there is
exactly one place the answer lives.

### 2. Two routes, one shared hub layout

```
/            hub (the 348-combo grid)
/favorites   favourites list
```

That is the whole route tree. `/favorites` is a real route rather than a filter
param because it reads as first-class and is easy to link in nav
(ADR 0003 §3).

### 3. The combo is a search param, not a path segment

`?c=153` — the `Combo.id` from
[#2](https://github.com/LouisLP/colour-combos/issues/2)'s schema, contiguous
`1–348` and annotated there as *"stable — used in share URLs"*.

It started as `/combo/153`. Once `/favorites` became a route of its own, the
path form forced a choice between a combinatorial route tree (`/favorites/153`)
and dropping the theme on navigation. **As a search param the combo is
orthogonal to the route** — it composes with `/favorites`, and with any page
added later, for free.

### 4. Filters and search live in the URL too

```
/?c=153&q=blue&size=3
/favorites?c=153&q=blue
```

`c`, `q` and `size` all survive navigation between `/` and `/favorites`.
Orthogonal params; nothing is dropped. This is the same route-agnostic param
contract ADR 0003 §3 depends on.

### 5. History semantics

| Action | Behaviour |
| --- | --- |
| Select a combo | `push` — back undoes the re-theme |
| Type in search | `replace`, debounced — the back button is not a keystroke-by-keystroke undo |
| Toggle a filter | `push` — a discrete, deliberate act |
| Resolve a bare or invalid `c` | `replace` — never leaves a history entry |

### 6. Light/dark stays out of the URL

Consistent with ADR 0001: mode is site-owned (a toggle defaulting to
`prefers-color-scheme`), so a shared link adopts the *recipient's* mode rather
than imposing the sender's. The URL carries the combo; the viewer carries the
mode.

### 7. Router: TanStack Router, code-based route tree

The route tree is trivial, so the actual work is the query params — and typed,
validated, defaulted search params are TanStack Router's headline feature:

```ts
function ComboGrid() {
  const { c, q, size } = Route.useSearch() // typed, not URLSearchParams strings
}
```

It also satisfies ADR 0001's synchronous-resolution constraint: search-param
validation runs during route matching, not in an async loader.

### 8. Resolving `c`

Resolution happens in the search-param validator, so exactly one combo is always
selected:

| Incoming | Result |
| --- | --- |
| `?c=153` (valid, `1–348`) | Combo 153 themes the site |
| `/` (absent) | Random combo, `replaceState`d in before first paint — the visit is reproducible and shareable from the first frame |
| `?c=999`, `?c=abc` (invalid) | Random combo, `replaceState`d in, **plus** a dismissible *"Combo 999 not found — showing 71"* notice |

The invalid case deliberately does not park the user on the achromatic baseline:
ADR 0001 reserves that for pre-hydration and transient resolution. The notice is
what stops a mistyped or stale shared link from being silently swallowed — the
user is told what happened rather than landing on what looks like a normal first
visit.

### 9. Hosting: an SPA fallback rewrite

The only constraint routing places on the host:

```
/*  /index.html  200
```

Available on Netlify, Vercel, Cloudflare Pages, and GitHub Pages (via a
`404.html` copy). No hash routing.

## Consequences

- **Combo identity is a URL concern, not a store concern.** App state
  architecture ([#12](https://github.com/LouisLP/colour-combos/issues/12)) reads
  `c`, `q` and `size` from the router rather than mirroring them into client
  state; duplicating them is a bug, not an optimisation.
- **Any page added later inherits theming for free**, since `c` is orthogonal to
  the route.
- **`Combo.id` is now a published contract.** Renumbering the catalogue breaks
  every shared link.
- Per-combo prerendering for OG/SEO was considered and **deferred**. Nothing
  here blocks adding it later, though with `c` as a search param it would need
  rethinking.
- A shared `/favorites` link shows the *recipient* their own list — favourites
  are device-local (ADR 0003).

## Alternatives rejected

- **`/combo/153` as a path segment** — prettier, and the obvious first instinct.
  Rejected because it does not compose with a second route: either the route
  tree goes combinatorial (`/favorites/153`) or the theme is dropped on
  navigation.
- **React Router** — would have meant hand-building the parse/validate/
  serialise layer for the search params, which is the bulk of this feature.
- **A hand-rolled router** — two routes barely justify a dependency, but it
  would mean owning scroll restoration and link interception forever.
- **Mode in the URL** — makes a link reproduce the sender's screen exactly.
  Rejected by ADR 0001: mode belongs to the viewer.
- **Hash routing** — avoids the hosting requirement entirely, at the cost of
  uglier links and worse sharing semantics. The rewrite is one line on every
  host under consideration.
