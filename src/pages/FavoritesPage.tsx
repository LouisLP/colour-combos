import { useSelectedCombo } from '../hooks/useSelectedCombo'

/** Placeholder. The favourites store and this list land in #23. */
export function FavoritesPage() {
  const combo = useSelectedCombo()

  return (
    <section>
      <h1>Favourites</h1>
      <p>
        Selected: No.
        {' '}
        {combo.id}
      </p>
    </section>
  )
}
