import { useSelectedCombo } from '../hooks/useSelectedCombo'

/** Placeholder. The grid of 348 combos lands in #22. */
export function BrowsePage() {
  const combo = useSelectedCombo()

  return (
    <section>
      <h1>Browse</h1>
      <p>
        Selected: No.
        {' '}
        {combo.id}
        {' '}
        —
        {' '}
        {combo.colours.map(colour => colour.name).join(', ')}
      </p>
    </section>
  )
}
