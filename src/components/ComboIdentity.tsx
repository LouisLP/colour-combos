import { comboLabel } from '../data/combos'
import { useSelectedCombo } from '../hooks/useSelectedCombo'

/**
 * The active combo, shown as itself at the top of the page (T2, ADR 0009).
 *
 * The chrome tints toward the selected combo, but a tinted header is a whisper —
 * this band is the shout. It puts the combo's *raw* colours on the page at full
 * strength, in a large-format strip, so which combo is theming the site is
 * unmistakable before a single card is read. That the strip is raw is on
 * purpose: colours here are shown *as themselves*, so the "swatches are sacred"
 * contract (ADR 0001 §4) applies and no role touches them.
 *
 * The meta sits *below* the strip on `--surface`, never over the raw colours, so
 * nothing here has to hold a contrast promise against an arbitrary Wada value.
 * The one vivid role — the accent eyebrow — is an `--on-accent` on `--accent`
 * pill, a pairing the AA sweep proves at 4.5:1 across the whole catalogue.
 *
 * Shared chrome, so it lives in `HubLayout` above both routes and reads the
 * combo from the URL like everything else. It is identity, not document
 * structure: the number is a `<p>`, not a heading, so it never competes with a
 * page's own `<h1>`.
 */
export function ComboIdentity() {
  const combo = useSelectedCombo()

  return (
    <section className="combo-hero" aria-label="Active combination">
      <span className="combo-hero-swatches" aria-hidden="true">
        {combo.colours.map(colour => (
          <i key={colour.index} style={{ background: colour.hex }} />
        ))}
      </span>

      <div className="combo-hero-meta">
        <p className="combo-hero-eyebrow">Now theming</p>
        <p className="combo-hero-id">{`Combination No. ${combo.id}`}</p>
        <p className="combo-hero-names">{comboLabel(combo)}</p>
      </div>
    </section>
  )
}
