import { comboLabel } from '../data/combos'
import { useSelectedCombo } from '../hooks/useSelectedCombo'

/**
 * The identity band for the active combo (T4, ADR 0009).
 *
 * The page is already themed *by* the selected combo, so this band gives that
 * fact somewhere to land: the editorial `No. N`, the colour names, and the raw
 * swatches at a size that carries their hex — the one datum the grid card
 * deliberately drops for want of room (ADR 0006 §3).
 *
 * The band is neutral `--canvas`; every scrap of colour is a swatch shown *as
 * itself*, never a role and never altered (ADR 0001 §2, §4). Nothing here is
 * accent: the whole band is identity, not interactive state (ADR 0006 §4).
 *
 * It renders on both `/` and `/favorites` because both wear the same combo. The
 * head is keyed by combo id so a selection remounts it, which is what lets the
 * entry animation replay per pick (and no-ops under reduced motion).
 */
export function ComboHero() {
  const combo = useSelectedCombo()

  return (
    <section className="combo-hero" aria-label="Selected combination">
      <div className="combo-hero-inner">
        <div key={combo.id} className="combo-hero-head">
          <p className="combo-hero-eyebrow">Now theming this page</p>
          <p className="combo-hero-no">
            <span className="combo-hero-no-prefix">No.</span>
            <span className="combo-hero-no-num">{combo.id}</span>
          </p>
          <p className="combo-hero-names">{comboLabel(combo)}</p>
        </div>

        {/* Raw Wada hex, never a role. Bounded and hex-captioned so the strip
            reads as swatches rather than as the page painted in one colour. */}
        <ul className="combo-hero-swatches">
          {combo.colours.map(colour => (
            <li key={colour.index} className="combo-hero-swatch">
              <span
                className="combo-hero-chip"
                style={{ background: colour.hex }}
                title={`${colour.name} ${colour.hex}`}
              />
              <span className="combo-hero-swatch-hex">{colour.hex}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
