# ADR-0001: Favorites persistence model

- **Status**: Accepted
- **Date**: 2026-07-22
- **Issue**: [#6](https://github.com/LouisLP/colour-combos/issues/6) (part of [#1](https://github.com/LouisLP/colour-combos/issues/1))

## Context

v1 of the colour-combinations hub lets a visitor mark any of the ~360 Wada
combos as a favorite. The combo dataset ships with the app as committed static
JSON, so a favorite never needs to carry colour data of its own — it only needs
to point into data we already ship. There is no account system and no server;
persistence is browser-local.

This ADR fixes what is stored, where, how it is surfaced, and how it behaves
when the browser fights back.

## Decision

### 1. A favorite is a bare numeric combo id

```jsonc
// localStorage["colour-combos:favorites"]
{ "v": 1, "ids": [12, 87, 301] }
```

No timestamps, no denormalized combo record. The favorite is a pointer; the
combo data is the bundle's job. This keeps storage tiny and means a corrected
hex or a reworded combo name can never leave a stale copy behind.

The id is the **numeric Wada id (1–360)**, not the URL slug. The source's own
identifier is the stable one — a slug-keyed favorite would break the moment a
display name is corrected, while a numeric one survives. The URL may still be
pretty (`/combo/12-hydrangea-blue`); the number is the truth.

### 2. Key and read discipline

Key: `colour-combos:favorites` — namespaced, so nothing else served from the
same origin (a preview deploy, a sibling toy app) can collide with it.

Reads are **validate-or-reset**. Anything unrecognised yields an empty set
rather than throwing:

| Condition | Result |
| --- | --- |
| `JSON.parse` fails | `[]` |
| `v !== 1` (including unknown future versions) | `[]` |
| `ids` is not an array of integers | `[]` |
| Valid | dedupe, then drop ids absent from the dataset |

The `v` field exists so a future schema change has somewhere to hang a real
migration. Until `v` bumps, there is no migration code to write.

### 3. Surfacing: a dedicated `/favorites` route

`/favorites` renders the **same `<Grid>` component** as browse, honouring the
**same filter/search param contract**. The route's only job is to supply a
different source list:

```
/          → <Grid source={allCombos} />
/favorites → <Grid source={favCombos} />

both honour ?size=3&q=blue
/favorites?size=3 → 3-colour favorites
```

One grid, one filter implementation, no duplicated UI.

Ordering is **array insertion order, newest first** — prepend on add, so the
array *is* the order. This gives "most recently saved first" without storing
anything extra.

Entry point: a persistent nav link with a live count — `★ Favorites (12)`, or
plain `Favorites` at zero. Always discoverable, and the count doubles as
feedback that a star toggle registered. The empty state is not a dead end:

```
★ No favorites yet
Star any combo to save it here.
[ Browse all 360 → ]
```

### 4. Runtime model

A module-level store owns the state, consumed through `useSyncExternalStore`:

```
favorites.ts (module singleton)
  ids: number[]      ← order (newest first)
  index: Set<number> ← derived, O(1) membership
  subscribe / getSnapshot
  toggle(id) → mutate, persist, notify
```

Memory is the truth during a session; localStorage is the durable mirror,
written through on every mutation. No provider to thread through the tree, and
every card's star stays consistent because they all read one snapshot.

The ordered array and the derived `Set` are kept in step deliberately — a bare
`Set` cannot express "prepend", and a bare array makes membership checks O(n)
on a grid of 360 cards.

### 5. Multi-tab: adopt wholesale

The store subscribes to the window `storage` event. When another tab writes the
key, re-read, replace the in-memory list, and notify subscribers. Both tabs
converge live, with no merge logic — **last write wins**, which is correct for
one user toggling their own stars.

A union-merge was rejected: it never loses an add, but it makes *un*favoriting
unreliable, since a removal in one tab gets re-added by the other's union.

### 6. Storage failure: silent session-only degrade

Every read and write is wrapped. If reads fail, start empty; if writes fail,
keep the in-memory set working and swallow the error behind a single
`console.warn`. Favoriting still works for the session and simply doesn't
survive a reload.

No toast, no modal, no capability flag threaded through the UI. This is a
low-stakes convenience feature, and the honest degradation is the quiet one —
a nag the user can't act on buys nothing.

### 7. No export, import, or share in v1

Favorites are private and browser-local. The site's shareable unit is a
*combo*, not a collection.

Deferring costs nothing precisely because a favorite is an integer:
`/favorites?ids=12,87,301` remains a **pure addition** — no storage change, no
migration — if a share link is ever wanted.

## Consequences

**Constraint handed to [#2](https://github.com/LouisLP/colour-combos/issues/2)
(data schema)** — the numeric Wada id must be the canonical key in the combo
schema, stable across any renaming or re-scrape.

**Constraint handed to [#5](https://github.com/LouisLP/colour-combos/issues/5)
(routing)** — filter and search params must be route-agnostic, since `/` and
`/favorites` share one param contract.

**Ordering differs by route** — browse renders in Wada order, `/favorites` in
insertion order. Deliberate, but it is an inconsistency a reader will notice,
and worth a second look if the two ever need to feel like one surface.

**Timestamps are a v2 migration.** This is the one thing the schema cannot add
for free. A "sort by date added" control, or displaying when a combo was
saved, requires bumping to `v: 2` with `{ id, at }` items and writing the first
real migration. Accepted knowingly: no v1 surface shows dates.

**Unresolvable ids vanish silently.** If a combo leaves the dataset, favorites
pointing at it are dropped on read with no notice. Correct for a static,
committed dataset that changes only when we re-scrape.

## Alternatives considered

- **Full denormalized combo per favorite** — survives dataset changes and could
  work without the bundle, but duplicates shipped data and goes stale when a
  hex is corrected.
- **Favorites as a filter over the browse grid** (`/?fav=1`) instead of a route
  — composes with filters just as well and avoids a second route, but a
  dedicated route is easier to link in nav and reads as first-class.
- **Pinned favorites strip on home** — zero navigation cost, but permanently
  consumes prime vertical space and doesn't compose with search or size.
- **React Context + `useState`** — conventional, but needs a provider wrapping
  the tree and re-renders consumers more broadly than a snapshot subscription.
- **Reading localStorage on demand** — always in sync, including across tabs,
  but parses JSON on every render.
