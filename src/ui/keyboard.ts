/**
 * Whether a keydown is a bare single-key shortcut we may claim (ADR 0014 §4).
 *
 * Never while the user is typing into a field — `/`, `f` and `c` are letters
 * there — and never with Ctrl, Meta or Alt held, so ⌘C, ⌘F and the browser's
 * own bindings keep working. Shift is allowed through because `?` needs it.
 */
export function isBareShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing)
    return false
  return !isTypingTarget(event.target)
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement))
    return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** The id of the search field, so `/` and Escape can reach it from anywhere. */
export const SEARCH_FIELD_ID = 'combo-search'

/** Marks the one element per result that roving focus lands on. */
export const ROVING_ATTR = 'data-roving'
