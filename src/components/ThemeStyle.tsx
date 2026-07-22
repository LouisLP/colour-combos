import { useMode } from '../hooks/useMode'
import { useSelectedCombo } from '../hooks/useSelectedCombo'
import { adapt } from '../theme/adapt'
import { paletteToCss } from '../theme/tokens'

/**
 * The palette, *rendered* rather than written (ADR 0005 §2). The style lands in
 * the same commit as the tree that consumes it, so there is no window in which
 * markup exists under the wrong palette, and nothing here touches the DOM.
 *
 * This is the only caller of `adapt()` in the app. No `useMemo`: the adapter
 * memoises by `id:mode`, so after the first render for a pair this is a map
 * lookup (ADR 0005 §3).
 *
 * `color-scheme` is deliberately absent — the mode store owns it, because it has
 * to be set before React exists (ADR 0005 §4, §5).
 */
export function ThemeStyle() {
  const combo = useSelectedCombo()
  const mode = useMode()

  return <style>{`:root{${paletteToCss(adapt(combo, mode))}}`}</style>
}
