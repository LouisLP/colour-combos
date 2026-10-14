// The browse density, as a module singleton (ADR 0014 §1) — the app's second
// module store, shaped like favourites: a module-level `shallowRef` is the
// store, memory is the truth for the session, localStorage is a best-effort
// mirror.
//
// Per viewer and not in the URL, deliberately. Density is how *this* person
// likes to scan, not a fact about what they are looking at: a shared link
// should show the recipient the combos in the layout *they* chose, the same
// stance ADR 0004 §6 took on mode before mode became combo-owned.

import { computed, shallowRef } from 'vue'

export const DENSITIES = ['grid', 'list'] as const
export type Density = typeof DENSITIES[number]

/** Namespaced alongside `colour-combos:favorites`. */
export const DENSITY_KEY = 'colour-combos:density'

/**
 * Validate-or-default. Storage can be missing, blocked, or hold anything, and
 * none of that may cost the visitor their page — the grid is the answer.
 */
function read(): Density {
  try {
    const raw = localStorage.getItem(DENSITY_KEY)
    return DENSITIES.find(density => density === raw) ?? 'grid'
  }
  catch {
    return 'grid'
  }
}

const value = shallowRef<Density>(read())

/** The current density. Read-only: `setDensity` is the one writer. */
export const density = computed(() => value.value)

/** Switch density and remember it. A failed write degrades to session-only. */
export function setDensity(next: Density): void {
  value.value = next
  try {
    localStorage.setItem(DENSITY_KEY, next)
  }
  catch {}
}

if (typeof window !== 'undefined') {
  // Another tab switched: follow it, as favourites does (ADR 0003 §5).
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === DENSITY_KEY)
      value.value = read()
  })
}
