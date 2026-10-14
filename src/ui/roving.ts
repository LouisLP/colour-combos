/**
 * Where a navigation key moves roving focus through the results (ADR 0014 §4),
 * as a pure function of the key, the current position, the result count and
 * how many results sit on one visual row.
 *
 * Both densities lay results out row-major, so the arrows mean what they look
 * like: ←/→ step one result, ↑/↓ step one visual row. `j`/`k` always step one
 * result, whatever the layout, so they walk the list in reading order. Home and
 * End jump to the ends. Movement stops at the edges rather than wrapping: a
 * wrap from the last result to the first would read as the list having
 * reloaded.
 *
 * `undefined` means "not a navigation key" — the caller leaves the event alone.
 */
export function rovingTarget(key: string, index: number, count: number, columns: number): number | undefined {
  const last = count - 1
  const clamp = (n: number) => Math.min(last, Math.max(0, n))

  switch (key) {
    case 'j':
    case 'ArrowRight':
      return clamp(index + 1)
    case 'k':
    case 'ArrowLeft':
      return clamp(index - 1)
    case 'ArrowDown':
      return clamp(index + columns)
    case 'ArrowUp':
      return clamp(index - columns)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return undefined
  }
}

/**
 * How many results share the first visual row, read off the layout.
 *
 * Measured rather than computed from the CSS: `auto-fill` decides the column
 * count from the viewport, and the browser has already done that sum. Where
 * nothing has been laid out (a test DOM, or a list skipped by
 * `content-visibility` before its first paint) every rect is zero, and one
 * column — "↓ is next" — is the honest fallback.
 */
export function columnsOf(items: ArrayLike<Element>): number {
  const first = items[0]?.getBoundingClientRect()
  if (!first || first.height === 0)
    return 1

  let columns = 1
  while (columns < items.length && items[columns]!.getBoundingClientRect().top === first.top)
    columns++
  return columns
}
