# 11. Port the site to Vue 3

- **Status**: Accepted
- **Date**: 2026-10-14
- **Ticket**: [T1: Port the site to Vue 3](https://github.com/LouisLP/colour-combos/issues/42)
- **Map**: [Vue rewrite, exportable scale library & docs UI](https://github.com/LouisLP/colour-combos/issues/41)
- **Supersedes**: the framework parts of [ADR 0005](0005-app-state-architecture.md)
  — §2's "rendered in the same commit" mechanism, §6's StrictMode/TanStack
  rationale, §7's TanStack location state, and §8's hook rule and
  `useSyncExternalStore` subscription. The architecture those sections describe
  (no app state, a rendered palette, URL as truth, one module store) is unchanged.
- **Builds on**: [ADR 0003](0003-favorites-persistence.md) (the store's shape),
  [ADR 0004](0004-routing-and-url-state.md) (the URL contract, unchanged)

## Context

The site was React 19 with `@tanstack/react-router`. The next stretch of work
(Map #41) turns it into a docs site for an importable scale library, and the
maintainer works in Vue daily. Single-file components also give each component
its own `<style scoped>`, where React left every rule in one 840-line
`index.css`.

The port is a **pure port**: behaviour parity, no redesign. UI changes belong to
later tickets. `src/theme/*` and `src/data/*` are framework-free and are not
touched.

## Decision

### 1. Vue 3 + `vue-router`, not `@tanstack/vue-router`

`vue-router` is the idiomatic choice and the smaller one. What TanStack gave us
was typed, validated search params on the root route. Here that is
`validateHubSearch` run over `route.query` inside one composable,
`useHubSearch()`, plus `toHubQuery()` to serialise a `HubSearch` back to a query
with a fixed `c, q, size` order and absent params left out. If typed search
params become awkward, `@tanstack/vue-router` is the like-for-like swap.

`vue-router` hands every param over as a string, or as an array when the param
is repeated. The first value of an array wins, as with `URLSearchParams.get`.
TanStack's structural parsing, which turned `?q=13` into a number, no longer
happens. The numeric branch it needed in `resolveQuery` is gone.

### 2. Resolving `c` is a global guard

The root route's `beforeLoad` becomes `router.beforeEach`. It pins a resolved
`c` with a `replace` redirect, as before (ADR 0004 §5, §8). It also pins when
`c` is present but not spelled canonically (`?c=`, `?c=01`). The URL then always
names the combo exactly, and the guard stays idempotent.

The rejected value still rides in history state rather than the URL (ADR 0005
§7). `vue-router` passes a redirect's `state` through to `history.replaceState`.
History state is not reactive, so `NotFoundNotice` re-reads
`router.options.history.state` whenever the route changes. The router writes the
state before it publishes the route.

### 3. Favourites: a module `shallowRef`, not `useSyncExternalStore`

`state/favorites.ts` keeps its shape: one module singleton owning one fact,
validated-or-reset on read, persisted on every write, cross-tab last write wins
(ADR 0003). The listener set and snapshot functions are replaced by a
`shallowRef<number[]>` that is replaced wholesale on every mutation, plus a
derived `computed` `Set` for membership. **No Pinia**: one fact needs no store
library.

ADR 0005 §8 required that starring a combo re-render one card, not 348. That
still holds: `useIsFavorite(id)` is a `computed` over `isFavorite(id)`, and a
computed only triggers when its value changes. Each toggle re-evaluates 348
cheap computeds and re-renders one card.

### 4. Hooks become composables, with the same rule

`src/hooks/` → `src/composables/`. The rule from ADR 0005 §8 carries over: **a
composable exists only to subscribe to something that lives outside the
component tree** (the router, the favourites store). It holds no logic and
makes no decisions.

### 5. `ThemeStyle` is a render-function component

Vue's template compiler drops `<style>` tags inside templates, so `ThemeStyle`
is a `defineComponent` with `h('style', …)`. It still renders the palette in the
same patch as the tree that consumes it (ADR 0005 §2), and it is still the only
caller of `adapt()`. Nothing primes the document before mount: there was no
head script to keep (ADR 0008).

### 6. Styles move into `<style scoped>`

Each component owns its rules. `index.css` keeps only document-level rules:
the token and neutral-ramp declarations that `ramp.test.ts` reads by path, the
reset, element defaults (`a`, `h1`, `code`, `:focus-visible`), the `.sr-only`
utility, `#root`, and the reduced-motion guard.

Two scoping details:

- The empty-state copy is slot content, so it carries the page's scope.
  `ComboGrid` styles it with `:slotted()`.
- `FavoritesLink`'s root `<a>` inherits `HubLayout`'s scope, so the `.site-nav a`
  rule in `HubLayout` covers both nav links.

### 7. Parity details that are easy to lose

- **Scroll.** TanStack resets the window to the top after every navigation by
  default (`resetScroll`). That includes selecting a card, toggling a chip and a
  debounced search write. `scrollBehavior: () => ({ top: 0 })` keeps that
  behaviour. Whether it is the *right* behaviour, particularly for search, is a
  question for T5, not a port.
- **`aria-current`.** `vue-router` matches on path and params and ignores the
  query, so every card's query-only `<RouterLink>` would be "exact active". The
  card sets `aria-current` explicitly, `"true"` only on the selected combo. The
  chips and Clear filters stay buttons for the same reason they were buttons
  before.

### 8. Prototypes are frozen, not ported

`prototypes/` stays React. ADRs cite those prototypes as their primary sources
(0002, 0006, 0012). `b057a76` is the last commit whose dependencies can run
them. The `prototype:*` scripts are removed, and
the directory stays outside lint and type-checking.

## Consequences

- No `react*` dependencies. The bundle is 256 kB (59 kB gzipped), mostly the
  combo JSON.
- The component tests mount the real routes, guard and layout on a memory
  history through one helper (`src/test/mountHub.ts`) with `@vue/test-utils`.
  Memory history keeps its stack private, so the helper counts history entries
  by wrapping `push`.
- A headless-Chrome comparison of the built site against `main` at three URLs
  differed by at most 13 antialiased pixels.

## Alternatives rejected

- **`@tanstack/vue-router`.** Closest to the old code, but heavier and less
  idiomatic. Its main advantage, typed search params, takes one composable and
  one serialiser to replace.
- **Pinia for favourites.** A store library for one array.
- **Teleporting the palette `<style>` into `<head>`.** It would work, but it
  splits the palette from the tree it themes and adds DOM placement the
  rendered-in-place approach never needed.
