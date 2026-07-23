# 5. App state architecture

- **Status**: Accepted
- **Date**: 2026-07-22
- **Ticket**: [App state architecture](https://github.com/LouisLP/colour-combos/issues/12)
- **Map**: [Wada-Sanzo colour-combinations hub](https://github.com/LouisLP/colour-combos/issues/1)
- **Builds on**: [ADR 0001](0001-light-dark-and-combo-theming-semantics.md),
  [ADR 0002](0002-combo-adaptation-model.md),
  [ADR 0003](0003-favorites-persistence.md),
  [ADR 0004](0004-routing-and-url-state.md)

## Context

Four decisions already constrain how this app holds state, and each was taken
without reference to the others:

- **The URL owns the active combo** (ADR 0004 §1, §3) — `?c=153` alongside `q`
  and `size`, typed search params via TanStack Router. Selecting a combo is a
  navigation, and mirroring `c` into client state is called out there as a bug
  rather than an optimisation.
- **Combo identity resolves synchronously** (ADR 0001 §6) — a bare `/` picks a
  random combo and `replaceState`s it in before first paint settles.
- **Favourites are a module-level store read through `useSyncExternalStore`**
  (ADR 0003 §4) — deliberately not context.
- **Mode is site-owned** with a `prefers-color-scheme` default (ADR 0001 §1),
  and had no persistence story at all.

ADR 0002 §5 fixes the token *contract* but says nothing about who writes those
custom properties or when. That gap, plus mode's missing persistence, is the
last structural decision before v1 can be built.

## Decision

### 1. There is no application state — three sources of truth and a pure function

Every fact the app holds is one of exactly three, and everything else is
derived from them:

| Fact | Owner | Read through | Survives reload |
| --- | --- | --- | --- |
| Active combo | the URL (`?c`) | `Route.useSearch()` | in the link itself |
| Light/dark | `state/mode.ts` module store | `useMode()` | localStorage, override only |
| Favourites | `state/favorites.ts` module store | `useIsFavorite(id)` | localStorage |
| **Palette** | **nobody — derived** | `adapt(combo, mode)` | never |

v1 ships **no context providers**, and no `useState` above the level of a leaf
interaction (a disclosure's open flag, the dismissal of a notice). If something
looks like app state and is not in that table, it is derived and should be
recomputed rather than stored.

The palette in particular is never state. It is a pure function of a row in
that table and one other row, and it is cheap (ADR 0002: well under a
millisecond, and cached besides). Storing it would create a fourth thing that
can disagree with the first three.

### 2. The palette is *rendered*, not written

One component turns the derived palette into CSS, as ordinary render output:

```tsx
function ThemeStyle() {
  const combo = useSelectedCombo()
  const mode = useMode()
  const css = paletteToCss(adapt(combo, mode))
  return <style>{`:root{${css}}`}</style>
}
```

It emits `--hue-source` plus the ~9 accent-family values that ADR 0002 §6 says
must be computed in TypeScript. **The neutral ramp is not emitted** — it stays
in the stylesheet as declarative relative colour off `--hue-source`, exactly as
that ADR specified. The runtime writes the values CSS cannot compute, and not
one property more.

Rendering the palette rather than writing it to `documentElement` in an effect
buys four things:

- **No effect ordering to reason about.** The style lands in the same commit as
  the tree that consumes it, so there is no window in which markup exists under
  the wrong palette.
- **No imperative mirror of derived state** — the pattern React 19 explicitly
  steers away from.
- **It survives prerendering.** ADR 0004 deferred per-combo prerendering for
  OG/SEO but did not rule it out; a rendered `<style>` needs nothing added to
  work server-side, while a layout effect needs a parallel implementation.
- **One writer.** `ThemeStyle` is the only code in the app that calls `adapt`.

The template literal is safe by construction: every interpolated value is a
machine-generated `oklch()` string produced by the adapter from committed
numeric data. No user input reaches it, and none can — `c` is validated to an
integer in `1–348` before a combo is ever resolved.

`color-scheme` is deliberately **not** in this block. It is owned by the mode
store (§4) because it has to be set before React exists (§5).

### 3. Memoisation belongs to the adapter, not the component

`theme/adapt.ts` is a plain module with two internal caches:

```
assignmentCache: Map<comboId, Assignment>        // mode-invariant, ADR 0002 §2
paletteCache:    Map<`${comboId}:${mode}`, Palette>
```

Bounded at 348 and 696 entries respectively for the whole catalogue, so there
is no eviction policy to write and no cache to invalidate — the inputs are
committed static data.

Because the cache lives in the module, `ThemeStyle` needs no `useMemo`: after
the first render for a given pair, the call is a map lookup. A `useMemo` would
have been strictly worse — per-mount, invisible to anything outside React, and
unavailable to the test that matters most.

That last point is load-bearing. **`adapt.ts` imports no React and touches no
DOM**, so [#15](https://github.com/LouisLP/colour-combos/issues/15) can port
`sweep.ts` to run against the *shipping* adapter in a plain node test, rather
than re-implementing the ladder and proving a guarantee about code that isn't
the code.

### 4. Mode is a module singleton, and stores only an override

> **Superseded by [ADR 0008](0008-combo-owned-mode.md).** Mode is no longer
> stored at all: it is a pure function of the selected combo, so `state/mode.ts`,
> the `colour-combos:mode` key, and the `matchMedia`/`storage` wiring below are
> gone. Favourites is now the only module store; the "two stores, one pattern"
> note in §7 collapses to one.

Mode takes the same shape as favourites — one pattern, learned once:

```
state/mode.ts
  value: "light" | "dark"      ← memory is the truth
  subscribe / getSnapshot / setMode / toggle
  mirrors:  localStorage["colour-combos:mode"], documentElement.style.colorScheme
  listens:  matchMedia("(prefers-color-scheme: dark)"), window "storage"
```

The key follows ADR 0003's namespacing convention, and **absence is
meaningful**:

| `colour-combos:mode` | Behaviour |
| --- | --- |
| absent | Follow `prefers-color-scheme`, **live** — a system change mid-session flips the site |
| `"light"` / `"dark"` | Explicit override; system changes are ignored from then on |
| anything else | Treated as absent (validate-or-reset, ADR 0003 §2) |

The `matchMedia` listener is attached always but only acts while no override
exists. This falls out of the store shape rather than needing a mode-of-modes.

Mode belongs in a module rather than the React tree because React is not its
only owner: the pre-hydration head script primes it, `matchMedia` and the
`storage` event push into it, and `color-scheme` on `<html>` is a DOM fact that
outlives any component. Putting the truth in React would mean two authorities
for one answer.

Multi-tab and storage failure inherit ADR 0003 wholesale — adopt wholesale on
`storage`, last write wins; and on a write failure, warn once and keep working
for the session. Two stores, one set of rules.

### 5. Mode is the flash risk. The combo is not.

> **Superseded by [ADR 0008](0008-combo-owned-mode.md).** With mode
> combo-derived and the bare `/` combo picked in JS, no mode is knowable before
> hydration, so the priming head script below is gone. Mode and combo now arrive
> together at the first commit; the pre-hydration frame is the achromatic token
> baseline under the `color-scheme: light dark` fallback.

These are usually discussed as one problem. They are not.

**Mode can flash**, because the document has a background before React exists.
Six blocking lines in `<head>`, no network, sub-millisecond:

```html
<script>
  (function () {
    var m = localStorage.getItem('colour-combos:mode')
    if (m !== 'light' && m !== 'dark')
      m = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.style.colorScheme = m
  })()
</script>
```

**The combo cannot flash.** This is a client-rendered SPA: nothing is painted
before React's first commit, because `#root` is empty until then. The palette
therefore lands in the first frame that has anything in it. ADR 0001 §6's
achromatic token baseline is honoured precisely — it *is* the first frame — and
it is invisible, because that frame is blank. The only places it is ever seen
for a perceptible duration are the overscroll gutter for a few milliseconds and
a load where the bundle never arrives, which is the correct thing to show then.

This is why the head script does not attempt the tint. Doing so would require
either a 348-entry id → hue-source table or the adapter itself in the head, to
colour a frame with nothing on it.

The store does not recompute mode on first read — it resolves the same
localStorage-then-`matchMedia` question the head script did, and gets the same
answer. Two writers of `color-scheme`, one decision.

Toggling mode is a discrete event, so React commits the new accents in the same
frame the CSS neutrals flip via `light-dark()`. There is no split frame where
old accents sit on a new canvas.

### 6. Resolving `c` must be idempotent within a document

ADR 0004 §8 puts random-combo resolution in the search-param validator.
Validators are not called once: React StrictMode double-invokes them in
development, and TanStack re-validates whenever *any* search param changes. A bare `Math.random()` in there would hand back a different combo on
each call — the site would re-theme itself as the user typed in the search box.

The random pick is therefore a per-document one-shot:

```ts
let sessionComboId: number | undefined
export function fallbackComboId(): number {
  return (sessionComboId ??= 1 + Math.floor(Math.random() * COMBO_COUNT))
}
```

The validator becomes pure with respect to the document. A reload picks a new
combo; a re-validation cannot.

### 7. The "not found" notice rides in router location state

ADR 0004 §8 specifies that `?c=999` resolves to a random combo,
`replaceState`s it, **and** shows a dismissible *"Combo 999 not found —
showing 71"* notice. After the replace, the rejected value is gone from the
URL, so something has to carry it.

It goes in TanStack Router's typed location state — not serialised into the
URL, and not a fourth store. The layout reads it and a local `useState` handles
dismissal. It survives the replace but not a reload, which is right: it is a
transient explanation of what just happened, not a fact about the app.

### 8. The seams

| Module | Kind | Knows about | Consumed by |
| --- | --- | --- | --- |
| `data/combos.ts` | plain module | the committed JSON | everything |
| `theme/adapt.ts` | pure function + caches | colour maths | `ThemeStyle`, the AA sweep |
| `theme/tokens.ts` | pure function | custom-property *names* | `ThemeStyle` |
| `state/mode.ts` | module store | localStorage, `matchMedia`, `color-scheme` | `useMode` |
| `state/favorites.ts` | module store | localStorage | `useFavorites` |
| `hooks/*` | one line each | React | components |
| components | — | CSS tokens, raw `Combo` | — |

**The rule for hooks: a hook exists only to subscribe to something that lives
outside React.** It holds no logic and makes no decisions. `useMode`,
`useFavorites`, `useIsFavorite`, `useSelectedCombo` are each a single line over
a store or the router. When a hook grows a branch, that branch belongs in the
module underneath it.

**What a component sees**: CSS custom properties for anything themed, and a
`Combo` object only where the raw value *is* the product — the swatch, the
hex/RGB/LAB readout (ADR 0001 §4). No component calls `adapt`, and per ADR
0002, any component reaching for `combo.colours[n]` outside those two places is
a bug.

Cards subscribe with `useIsFavorite(id)`, not `useFavorites()`. The snapshot is
a boolean, so starring a combo re-renders one card, not a grid of 348.

## Consequences

- **v1 has no providers.** Any component renders in a test with no wrapper; the
  only setup a test needs is a fake `localStorage`.
- **[#15](https://github.com/LouisLP/colour-combos/issues/15) is unblocked in
  the shape it asked for** — the AA sweep imports the shipping `adapt()` from a
  node test with no DOM and no React.
- **Two module stores now follow one pattern, and a third should be resisted.**
  Anything else that wants to be state is either a URL param or derived.
- **The head script duplicates knowledge.** The storage key and the
  resolution rule exist in both `index.html` and `state/mode.ts`. It is the one
  place in the app where a change must be made twice; both sites need a comment
  saying so.
- **There is no way back to "follow system" in the v1 UI.** Once toggled, an
  override exists forever. Clearing the key is a pure addition later — no
  migration, because absence is already the meaningful state — but until then a
  user who wants to track their system again has to clear site data.
- **Prerendering stays open.** Everything except the head script is
  render-pure, and both stores can serve a `getServerSnapshot` (`"light"` and
  `[]`).
- **Animating between combos would re-open §2.** A rendered `<style>` cannot
  transition a custom property without registering it via `@property`. Nothing
  in v1 needs it; if a cross-fade is ever wanted, this is the decision it
  touches.

## Alternatives rejected

- **React context for mode** — conventional and discoverable, but every themed
  component consumes it, so it re-renders no less than the singleton does, and
  the head script still has to own the first value. Two authorities for one
  fact, in exchange for a provider.
- **`useLayoutEffect` + `setProperty` on `documentElement`** — the familiar
  theming pattern, and it does run before paint. Rejected as an imperative
  mirror of derived state that needs a second implementation the moment
  anything renders on a server.
- **Inline `style` on the app root** — purest React and zero DOM access, but
  the custom properties then live on a descendant of `<html>`, so the
  overscroll gutter and any portal outside `#root` cannot resolve `--canvas`.
- **`useMemo` in `ThemeStyle`** — per-mount, and invisible to the AA sweep. The
  cache belongs where the pure function does.
- **A combo store mirroring the URL** — familiar, but creates a second truth
  that has to be reconciled with the back button. ADR 0004 §1 already settled
  that the URL is the source of truth, and its consequences name this
  duplication explicitly; a mirror quietly reopens a closed decision.
- **Computing the palette in a router loader** — puts combo resolution and
  theming in one place, but adds an async boundary around a sub-millisecond
  synchronous function, and moves colour maths into the routing layer.
- **Mode in the URL** — already rejected by ADR 0004 §6: a shared link should
  adopt the recipient's mode, not impose the sender's.
- **Three-state mode toggle (system / light / dark)** — keeps "follow system"
  reachable forever, which the chosen design gives up. Rejected because it
  spends a third visual state, and a third of the toggle's affordance, on a
  control most users press once.
- **Head script that also resolves the combo tint** — removes the achromatic
  first frame, at the cost of shipping the adapter or a lookup table in
  `<head>`, to colour a frame with nothing on it.
