// PROTOTYPE — throwaway.
//
// VARIANT A — "Framed catalogue"
//
// Stance on the five questions:
//   card       framed card on --surface; equal-split vertical swatch bars
//   metadata   always visible (#id + colour names), no hover dependency
//   selected   --ink ring + an explicit "Theming this page" pill
//   filters    sticky full-width bar above the grid
//   star       always visible in the caption row
//
// The recursion answer here is PARTICIPATION: cards are ordinary themed
// components, and the selected card is marked in --ink because --accent is
// already all over the page chrome and would not read as "this one".

import type { VariantProps } from './shared.tsx'
import { comboLabel, StarIcon } from './shared.tsx'

export const NAME = 'Framed catalogue'

export default function VariantA(p: VariantProps) {
  const sizes = [2, 3, 4] as const
  return (
    <div className="a">
      <header className="a-bar">
        <h1>A Dictionary of Color Combinations</h1>
        <span className="a-spacer" />
        <button type="button" className={`a-chip${p.fav ? ' on' : ''}`} onClick={() => p.onFavFilter(!p.fav)}>
          <StarIcon on={p.fav} />
          {` Favourites (${p.favs.size})`}
        </button>
      </header>

      <div className="a-filters">
        <div className="a-filters-inner">
          <input
            className="a-field"
            value={p.q}
            placeholder="Search 348 combinations by colour name or hex…"
            onChange={e => p.onQ(e.target.value)}
          />
          <div className="a-chips">
            <button type="button" className={`a-chip${p.size === null ? ' on' : ''}`} onClick={() => p.onSize(null)}>
              {`Any (${p.all.length})`}
            </button>
            {sizes.map(s => (
              <button
                key={s}
                type="button"
                className={`a-chip${p.size === s ? ' on' : ''}`}
                onClick={() => p.onSize(p.size === s ? null : s)}
              >
                {`${s} colours (${p.all.filter(c => c.size === s).length})`}
              </button>
            ))}
          </div>
          <output className="a-count">{`${p.list.length} shown`}</output>
        </div>
      </div>

      <main className="a-main">
        {p.list.length === 0
          ? (
              <div className="a-empty">
                <p className="a-empty-h">No combinations match that.</p>
                <p>
                  {p.fav
                    ? 'Star any combination to save it here.'
                    : 'Try a colour name like “rose”, a hex like #d96629, or a combination number.'}
                </p>
                <button
                  type="button"
                  className="a-btn"
                  onClick={() => {
                    p.onQ('')
                    p.onSize(null)
                    p.onFavFilter(false)
                  }}
                >
                  Clear filters
                </button>
              </div>
            )
          : (
              <ul className="a-grid">
                {p.list.map(combo => (
                  <li key={combo.id}>
                    <article className={`a-card${combo.id === p.selected ? ' sel' : ''}`}>
                      <button type="button" className="a-hit" onClick={() => p.onSelect(combo.id)}>
                        <span className="a-vis">{`Use combination ${combo.id}`}</span>
                        <span className="a-swatches">
                          {/* Raw Wada hex — swatches are sacred (ADR 0001 §4). */}
                          {combo.colours.map(c => (
                            <i key={c.index} style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
                          ))}
                        </span>
                      </button>
                      <div className="a-meta">
                        <div className="a-meta-text">
                          <b>{`No. ${combo.id}`}</b>
                          <span>{comboLabel(combo)}</span>
                        </div>
                        <button
                          type="button"
                          className={`a-star${p.favs.has(combo.id) ? ' on' : ''}`}
                          aria-pressed={p.favs.has(combo.id)}
                          aria-label={`Favourite combination ${combo.id}`}
                          onClick={() => p.onFav(combo.id)}
                        >
                          <StarIcon on={p.favs.has(combo.id)} />
                        </button>
                      </div>
                      {combo.id === p.selected && <p className="a-pill">Theming this page</p>}
                    </article>
                  </li>
                ))}
              </ul>
            )}
      </main>
    </div>
  )
}
