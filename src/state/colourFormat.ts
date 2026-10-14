// How the combo page spells a colour (hex, `oklch()` or `rgb()`), as a module
// singleton — the app's third module store, shaped like density: a
// module-level `shallowRef` is the store, localStorage a best-effort mirror.
//
// Per viewer and not in the URL, for the reason density is (ADR 0014 §1): it
// is how this person likes to read values, not a fact about the combo, so a
// shared link opens in the recipient's notation.

import type { ColourFormat } from '../lib/format'
import { computed, shallowRef } from 'vue'
import { COLOUR_FORMATS } from '../lib/format'

/** Namespaced alongside `colour-combos:density`. */
export const COLOUR_FORMAT_KEY = 'colour-combos:format'

/** Validate-or-default: storage may be missing, blocked or hold anything. Hex is the answer. */
function read(): ColourFormat {
  try {
    const raw = localStorage.getItem(COLOUR_FORMAT_KEY)
    return COLOUR_FORMATS.find(format => format === raw) ?? 'hex'
  }
  catch {
    return 'hex'
  }
}

const value = shallowRef<ColourFormat>(read())

/** The current format. Read-only: `setColourFormat` is the one writer. */
export const colourFormat = computed(() => value.value)

/** Switch format and remember it. A failed write degrades to session-only. */
export function setColourFormat(next: ColourFormat): void {
  value.value = next
  try {
    localStorage.setItem(COLOUR_FORMAT_KEY, next)
  }
  catch {}
}

if (typeof window !== 'undefined') {
  // Another tab switched: follow it, as density does.
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === COLOUR_FORMAT_KEY)
      value.value = read()
  })
}
