// PROTOTYPE — throwaway.
//
// VARIANT B — "Colour wall"
//
// Stance on the five questions:
//   card       no card at all. Gapless full-bleed tiles, proportional bands
//              weighted by the ADR 0002 accent ranking.
//   metadata   nothing until hover/focus, then an overlay drawn in the TILE's
//              own contrast colour — never in page tokens.
//   selected   punched OUT of the wall: a --canvas gutter + inset ring, i.e.
//              negative space rather than a competing colour.
//   filters    floating command bar over the wall; the wall is never interrupted
//   star       hover/focus-revealed on fine pointers, always visible on coarse
//              ones (@media (pointer: coarse)) and whenever already starred.
//
// The recursion answer here is WITHDRAWAL: the wall opts out of the theme
// entirely. Page tokens appear only in the floating chrome, so 347 combos
// can never fight the one that is theming the page.

import type { VariantProps } from './shared.tsx'
import { onColour } from '../adaptation-model/colour.ts'
import { bands, comboLabel, StarIcon } from './shared.tsx'

export const NAME = 'Colour wall'

export default function VariantB(p: VariantProps) {
  return (
    <div className="b">
      {p.list.length === 0
        ? (
            <div className="b-empty">
              <p className="b-empty-h">Nothing here</p>
              <p>{p.fav ? 'Star a combination and it lands on this wall.' : 'No combination matches that colour name, hex, or number.'}</p>
            </div>
          )
        : (
            <ul className="b-wall">
              {p.list.map((combo) => {
                const rows = bands(combo)
                const ink = onColour(rows[0].colour.hex)
                const starred = p.favs.has(combo.id)
                return (
                  <li key={combo.id} className={`b-tile${combo.id === p.selected ? ' sel' : ''}`}>
                    <button type="button" className="b-hit" onClick={() => p.onSelect(combo.id)}>
                      <span className="b-vis">{`Use combination ${combo.id} — ${comboLabel(combo)}`}</span>
                      {rows.map(b => (
                        <i key={b.colour.index} style={{ background: b.colour.hex, flexGrow: b.share }} />
                      ))}
                      <span className="b-label" style={{ color: ink }}>
                        <b>{combo.id}</b>
                        <span>{comboLabel(combo)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`b-star${starred ? ' on' : ''}`}
                      style={{ color: ink }}
                      aria-pressed={starred}
                      aria-label={`Favourite combination ${combo.id}`}
                      onClick={() => p.onFav(combo.id)}
                    >
                      <StarIcon on={starred} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

      <div className="b-command">
        <input
          className="b-field"
          value={p.q}
          placeholder="Search…"
          onChange={e => p.onQ(e.target.value)}
        />
        <span className="b-sep" />
        {([null, 2, 3, 4] as const).map(s => (
          <button
            key={String(s)}
            type="button"
            className={`b-seg${p.size === s ? ' on' : ''}`}
            onClick={() => p.onSize(s)}
          >
            {s === null ? 'All' : s}
          </button>
        ))}
        <span className="b-sep" />
        <button type="button" className={`b-seg${p.fav ? ' on' : ''}`} onClick={() => p.onFavFilter(!p.fav)}>
          <StarIcon on={p.fav} />
          {` ${p.favs.size}`}
        </button>
        <span className="b-sep" />
        <output className="b-count">{`${p.list.length}`}</output>
      </div>
    </div>
  )
}
