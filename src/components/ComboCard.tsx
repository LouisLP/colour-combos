import type { Combo, ComboColour } from '../data/combos'
import { Link } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import { comboLabel } from '../data/combos'
import { useIsFavorite } from '../hooks/useFavorites'
import { toggle } from '../state/favorites'
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
 *
 * Two controls sit *over* the swatch block rather than inside its selection link
 * (ADR 0007): the always-present star, top-right in a fixed spot on every card,
 * and a per-swatch copy chip. They cannot nest inside the `<a>` that selects the
 * combo, so they are sibling overlays with a `--surface` backdrop that keeps them
 * legible over any raw Wada colour.
 */
export function ComboCard({ combo, selected }: ComboCardProps) {
  // A boolean snapshot, so starring re-renders this card and not the other 347
  // (ADR 0005 §8).
  const favorited = useIsFavorite(combo.id)
  const { copiedIndex, copy, announcement } = useCopyHex()

  return (
    <article className={selected ? 'combo-card is-selected' : 'combo-card'}>
      <div className="combo-media">
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
              <i key={colour.index} style={{ background: colour.hex }} />
            ))}
          </span>
        </Link>

        {/*
          The copy layer is a sibling of the link, not a child: it must hold real
          buttons (ADR 0007). Chips are small so the rest of each swatch still
          selects the combo on a tap; the layer passes clicks through and only the
          chips catch them. Hover-revealed on fine pointers, always shown on
          coarse ones and on keyboard focus.
        */}
        <div className="combo-copy-layer">
          {combo.colours.map(colour => (
            <span key={colour.index} className="combo-copy-cell">
              <CopyChip
                colour={colour}
                copied={copiedIndex === colour.index}
                onCopy={copy}
              />
            </span>
          ))}
        </div>

        {/* Absolute, so it lands in the same spot on every card regardless of
            caption length (ADR 0007). Backdrop keeps it legible over any colour. */}
        <StarButton comboId={combo.id} pressed={favorited} onToggle={toggle} />
      </div>

      <div className="combo-caption">
        {/* A Wada combo carries no name of its own — only its colours do. */}
        <b>{`No. ${combo.id}`}</b>
        <span>{comboLabel(combo)}</span>
      </div>

      {/* One polite region per card announces the copy for screen readers, since
          the confirmation is otherwise a silent icon swap. */}
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

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

interface CopyChipProps {
  colour: ComboColour
  copied: boolean
  onCopy: (colour: ComboColour) => void
}

/**
 * A per-swatch copy affordance. Its accessible name carries the colour name and
 * the hex so a screen-reader user knows what a press will copy.
 */
function CopyChip({ colour, copied, onCopy }: CopyChipProps) {
  return (
    <button
      type="button"
      className="combo-copy"
      aria-label={copied ? `Copied ${colour.hex}` : `Copy ${colour.name} ${colour.hex}`}
      onClick={() => onCopy(colour)}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

/**
 * Tracks which swatch was last copied so the chip can flip to a check, and holds
 * a matching announcement for the card's live region. The confirmation clears
 * itself after a moment; the timer is cancelled on re-copy so a fast series of
 * copies never leaves a stale check behind.
 */
function useCopyHex() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const copy = useCallback((colour: ComboColour) => {
    // `writeText` can reject (denied permission, insecure context). A failed copy
    // simply shows no confirmation rather than throwing into the render tree.
    void navigator.clipboard?.writeText(colour.hex).then(() => {
      setCopiedIndex(colour.index)
      setAnnouncement(`Copied ${colour.hex}`)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopiedIndex(null)
        setAnnouncement('')
      }, 1400)
    }, () => {})
  }, [])

  return { copiedIndex, copy, announcement }
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14">
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15.5 5.5H6.5a2 2 0 0 0-2 2v9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14">
      <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
