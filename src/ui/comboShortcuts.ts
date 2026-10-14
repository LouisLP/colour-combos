import type { Combo } from '../data/combos'
import { comboHexes } from '../data/combos'
import { announce } from '../state/announcer'
import { isFavorite, toggle } from '../state/favorites'
import { copyText } from './clipboard'
import { isBareShortcut } from './keyboard'

/**
 * The per-result shortcuts (ADR 0014 §4), shared by the grid card and the
 * compact row so the two densities answer the same keys the same way:
 *
 * - `f` toggles the focused combo's favourite;
 * - `c` copies all of its hexes, and calls `onCopied` so the result can light
 *   its own chips where the colours are.
 *
 * Bound on each result's root, so "focused combo" is simply the one the keydown
 * bubbled out of — there is no separate focus state to keep in sync.
 */
export function handleComboShortcut(event: KeyboardEvent, combo: Combo, onCopied: () => void): void {
  if (!isBareShortcut(event) || event.shiftKey)
    return

  if (event.key === 'f') {
    event.preventDefault()
    const adding = !isFavorite(combo.id)
    toggle(combo.id)
    announce(adding ? `Added No. ${combo.id} to favourites` : `Removed No. ${combo.id} from favourites`)
  }
  else if (event.key === 'c') {
    event.preventDefault()
    const hexes = comboHexes(combo)
    void copyText(hexes).then((ok) => {
      if (!ok)
        return
      onCopied()
      announce(`Copied ${hexes}`)
    })
  }
}
