// PROTOTYPE — throwaway.
//
// VARIANT C — "Reference index"
//
// Stance on the five questions:
//   card       not a card — a row. One dominant colour block leads, secondary
//              colours are small chips, hexes are set in monospace inline.
//   metadata   everything, always: id, colour names, hex values. Scannable.
//   selected   the row inverts to --surface-muted with an --ink gutter bar
//   filters    persistent left rail with faceted counts; search at its top
//   star       always visible at the row end, full-height hit target
//
// The recursion answer here is ABSTINENCE: the list uses only neutrals
// (--surface / --ink / --border). --accent is spent on exactly two things —
// the selected row's marker and a starred star — so the eye has somewhere
// unambiguous to land no matter what the active combo looks like.

import type { VariantProps } from './shared.tsx'
import { bands, StarIcon } from './shared.tsx'

export const NAME = 'Reference index'

export default function VariantC(p: VariantProps) {
  return (
    <div className="c">
      <aside className="c-rail">
        <h1 className="c-brand">Dictionary of Color Combinations</h1>
        <input
          className="c-field"
          value={p.q}
          placeholder="Search"
          onChange={e => p.onQ(e.target.value)}
        />

        <h2>Colours</h2>
        <ul className="c-facets">
          <li>
            <button type="button" className={p.size === null ? 'on' : ''} onClick={() => p.onSize(null)}>
              <span>Any</span>
              <em>{p.all.length}</em>
            </button>
          </li>
          {([2, 3, 4] as const).map(s => (
            <li key={s}>
              <button type="button" className={p.size === s ? 'on' : ''} onClick={() => p.onSize(p.size === s ? null : s)}>
                <span>{`${s} colours`}</span>
                <em>{p.all.filter(c => c.size === s).length}</em>
              </button>
            </li>
          ))}
        </ul>

        <h2>Saved</h2>
        <ul className="c-facets">
          <li>
            <button type="button" className={p.fav ? 'on' : ''} onClick={() => p.onFavFilter(!p.fav)}>
              <span>Favourites</span>
              <em>{p.favs.size}</em>
            </button>
          </li>
        </ul>

        <p className="c-status">{`${p.list.length} of ${p.all.length}`}</p>
      </aside>

      <main className="c-main">
        {p.list.length === 0
          ? (
              <div className="c-empty">
                <p className="c-empty-h">{p.fav ? 'No favourites yet' : 'No matches'}</p>
                <p>
                  {p.fav
                    ? 'Star a combination to save it here.'
                    : `Nothing matches “${p.q}”. Search runs over colour names, hex values and combination numbers.`}
                </p>
              </div>
            )
          : (
              <ol className="c-rows">
                {p.list.map((combo) => {
                  const [lead, ...rest] = bands(combo)
                  const starred = p.favs.has(combo.id)
                  return (
                    <li key={combo.id} className={combo.id === p.selected ? 'sel' : ''}>
                      <button type="button" className="c-row" onClick={() => p.onSelect(combo.id)}>
                        <span className="c-num">{combo.id}</span>
                        <span className="c-lead" style={{ background: lead.colour.hex }} />
                        <span className="c-names">
                          <b>{lead.colour.name}</b>
                          <code>{lead.colour.hex.toUpperCase()}</code>
                        </span>
                        <span className="c-rest">
                          {rest.map(b => (
                            <span className="c-chip" key={b.colour.index}>
                              <i style={{ background: b.colour.hex }} />
                              <span>{b.colour.name}</span>
                              <code>{b.colour.hex.toUpperCase()}</code>
                            </span>
                          ))}
                        </span>
                        {combo.id === p.selected && <span className="c-active">Active</span>}
                      </button>
                      <button
                        type="button"
                        className={`c-star${starred ? ' on' : ''}`}
                        aria-pressed={starred}
                        aria-label={`Favourite combination ${combo.id}`}
                        onClick={() => p.onFav(combo.id)}
                      >
                        <StarIcon on={starred} />
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
      </main>
    </div>
  )
}
