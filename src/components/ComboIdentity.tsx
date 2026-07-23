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
 * T4 finishes the band (ADR 0010): a row of per-colour **hex** aligned under the
 * strip — the datum the grid card has no room for (ADR 0006 §3) — and the number
 * set in the editorial serif. The `--ink`-muted hex sits on `--surface`, so it
 * keeps the same contrast guarantee as the rest of the meta. The strip and hex
 * are `aria-hidden`; the combo's spoken identity is the number and names.
 *
 * Shared chrome, so it lives in `HubLayout` above both routes and reads the
 * combo from the URL like everything else. It is identity, not document
 * structure: the number is a `<p>`, not a heading, so it never competes with a
 * page's own `<h1>`. The meta is keyed by combo id so its entry animation
 * replays on each pick (and no-ops under reduced motion).
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

      {/* Aligned one-per-cell under the strip. Decorative detail for sighted
          users; the spoken identity is the number and names below. */}
      <ul className="combo-hero-hexes" aria-hidden="true">
        {combo.colours.map(colour => (
          <li key={colour.index}>{colour.hex}</li>
        ))}
      </ul>

      <div key={combo.id} className="combo-hero-meta">
        <p className="combo-hero-eyebrow">Now theming</p>
        <p className="combo-hero-id">{`Combination No. ${combo.id}`}</p>
        <p className="combo-hero-names">{comboLabel(combo)}</p>
      </div>
    </section>
  )
}
