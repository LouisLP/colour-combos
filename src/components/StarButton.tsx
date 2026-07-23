/**
 * The favourite affordance, always visible (ADR 0006 §8). Hover-only dies on
 * touch and focus-only hides the feature from everyone not driving by keyboard,
 * so the star is present on every card — 348 permanent glyphs, which the grid
 * was measured with.
 *
 * It is positioned absolutely over the swatch block by the card, so it lands in
 * the same top-right spot regardless of caption length (ADR 0007); the CSS gives
 * it a `--surface` backdrop so it stays legible over any raw Wada colour.
 *
 * It stays presentational: the card subscribes to `useIsFavorite` and hands the
 * answer down, so the store has exactly one consumer per card rather than one
 * per glyph.
 */

interface StarButtonProps {
  comboId: number
  pressed: boolean
  onToggle: (id: number) => void
}

export function StarButton({ comboId, pressed, onToggle }: StarButtonProps) {
  return (
    <button
      type="button"
      className="combo-star"
      // `aria-pressed` carries the state, so the accessible name stays the same
      // sentence whether or not the combo is starred.
      aria-pressed={pressed}
      aria-label={`Favourite combination ${comboId}`}
      onClick={() => onToggle(comboId)}
    >
      <StarIcon filled={pressed} />
    </button>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
      <path
        d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.2 6.7L12 17.8 6.1 20.9l1.2-6.7L2.5 9.5l6.6-.9z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
