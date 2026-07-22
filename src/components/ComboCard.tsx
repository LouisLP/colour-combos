import type { Combo } from '../data/combos'
import { Link } from '@tanstack/react-router'
import { comboLabel } from '../data/combos'
import { StarButton } from './StarButton'

interface ComboCardProps {
  combo: Combo
  /** Whether this combo is the one currently theming the site. */
  selected: boolean
}

/**
 * One combo as a framed card (ADR 0006 §1): a hairline frame on `--surface`, an
 * equal-split swatch block, and a caption that is always present.
 *
 * The frame is not decoration — it is what makes a combo read as a combination
 * rather than as loose colours, which is the whole reason variant A won.
 */
export function ComboCard({ combo, selected }: ComboCardProps) {
  return (
    <article className={selected ? 'combo-card is-selected' : 'combo-card'}>
      {/*
        A link, not a button: selecting a combo *is* a navigation (ADR 0004 §1),
        so it is shareable, middle-clickable, and pushes exactly one history
        entry — TanStack's default (ADR 0004 §5). `to="."` keeps the current
        route, which is what lets `/favorites` reuse this card unchanged.
      */}
      <Link
        to="."
        search={prev => ({ ...prev, c: combo.id })}
        className="combo-hit"
        aria-current={selected ? 'true' : undefined}
      >
        <span className="sr-only">{`Theme this page with combination ${combo.id}`}</span>
        {/*
          Raw Wada hex, never a role (ADR 0001 §4). Equal split and full bleed —
          proportional bands reduce a 4-colour combo's minor colours to
          unreadable slivers (ADR 0006 §2). The card's `overflow: hidden` cuts
          the corners so no `--canvas` shows between the colours.
        */}
        <span className="combo-swatches" aria-hidden="true">
          {combo.colours.map(colour => (
            <i
              key={colour.index}
              style={{ background: colour.hex }}
              // The grid cannot afford hex on the card face (ADR 0006 §3), so
              // this is where it lives until the detail surface exists.
              title={`${colour.name} ${colour.hex}`}
            />
          ))}
        </span>
      </Link>

      <div className="combo-caption">
        <div className="combo-caption-text">
          {/* A Wada combo carries no name of its own — only its colours do. */}
          <b>{`No. ${combo.id}`}</b>
          <span>{comboLabel(combo)}</span>
        </div>
        <StarButton comboId={combo.id} pressed={false} onToggle={noop} />
      </div>

      {/*
        Marked in `--ink`, not `--accent`: the accent is already on the chips,
        the focus rings and the buttons, so a fourth accented thing reads as more
        chrome rather than as *this one*. `--ink` clears 4.5:1 on every surface in
        the system (ADR 0002 §5), which makes the marker theme-proof by
        construction (ADR 0006 §4).
      */}
      {selected && <p className="combo-pill">Theming this page</p>}
    </article>
  )
}

/** Favouriting lands with the store in #23; the affordance ships inert. */
function noop() {}
