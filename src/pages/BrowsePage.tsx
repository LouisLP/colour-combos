import { ComboGrid } from '../components/ComboGrid'
import { COMBO_COUNT, COMBOS } from '../data/combos'

/**
 * The whole catalogue. Filtering and search land in #24 and narrow the list
 * passed here; nothing else about this page changes when they do.
 */
export function BrowsePage() {
  return (
    <section>
      {/* The visible page identity is the site header; this is for structure. */}
      <h1 className="sr-only">{`Browse all ${COMBO_COUNT} combinations`}</h1>
      <ComboGrid
        combos={COMBOS}
        empty={(
          <>
            <p className="combo-empty-heading">No combinations match that.</p>
            <p>Search covers colour names, hex values and the combination number.</p>
          </>
        )}
      />
    </section>
  )
}
