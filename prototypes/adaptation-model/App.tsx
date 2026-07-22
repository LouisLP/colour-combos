// PROTOTYPE — throwaway. Answers issue #4: given an arbitrary 2-4 colour combo,
// how do we derive a complete contrast-safe semantic palette?
//
// Three assignment algorithms on one route, switchable via ?variant=A|B|C.
// Also: ?combo=1..348 and ?mode=light|dark. The dark panel on the right is
// prototype chrome, not part of the design being evaluated.

import type { Combo, Mode, VariantKey } from './adapt.ts'
import { useEffect, useState } from 'react'
import { derive, totalShift, VARIANTS } from './adapt.ts'
import { contrast } from './colour.ts'
import combosJson from './combos.json'

const combos = combosJson as Combo[]
const keys = Object.keys(VARIANTS) as VariantKey[]

/** Combos whose colours fight the contrast contract hardest (most drift). */
const TOUGH = [...combos]
  .map(c => ({ id: c.id, cost: totalShift(derive(c, 'C', 'light')) + totalShift(derive(c, 'C', 'dark')) }))
  .sort((a, b) => b.cost - a.cost)
  .slice(0, 8)
  .map(c => c.id)

function useParam(key: string, fallback: string) {
  const [value, setValue] = useState(() => new URLSearchParams(window.location.search).get(key) ?? fallback)
  const set = (next: string) => {
    const p = new URLSearchParams(window.location.search)
    p.set(key, next)
    window.history.replaceState(null, '', `?${p}`)
    setValue(next)
  }
  return [value, set] as const
}

export default function App() {
  const [variantRaw, setVariant] = useParam('variant', 'C')
  const [comboRaw, setCombo] = useParam('combo', '1')
  const [modeRaw, setMode] = useParam('mode', 'light')

  const variant = (keys.includes(variantRaw as VariantKey) ? variantRaw : 'C') as VariantKey
  const mode = (modeRaw === 'dark' ? 'dark' : 'light') as Mode
  const combo = combos.find(c => c.id === Number(comboRaw)) ?? combos[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.matches('input, textarea, [contenteditable]'))
        return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const d = e.key === 'ArrowRight' ? 1 : -1
        setVariant(keys[(keys.indexOf(variant) + d + keys.length) % keys.length])
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const d = e.key === 'ArrowUp' ? 1 : -1
        setCombo(String(((combo.id - 1 + d + combos.length) % combos.length) + 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const palette = derive(combo, variant, mode)
  const vars = Object.fromEntries(Object.entries(palette.roles).map(([k, v]) => [`--${k}`, v.hex]))
  const near = combos.filter(c => c.id !== combo.id).slice(0, 5)

  return (
    <>
      <div className="sample" style={{ ...vars, colorScheme: mode } as React.CSSProperties}>
        <header className="bar">
          <h1>A Dictionary of Color Combinations</h1>
          <span className="spacer" />
          <a href="#top">About</a>
          <button type="button" className="btn ghost" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
            {mode === 'light' ? 'Dark' : 'Light'}
            {' '}
            mode
          </button>
        </header>

        <div className="wrap" style={{ paddingInlineEnd: '21.5rem' }}>
          <section>
            <h2>{`Combination ${combo.id} — ${combo.size} colours`}</h2>
            <div className="panel" style={{ display: 'grid', gap: '1.1rem' }}>
              <div className="readout">
                {combo.colours.map((c, i) => (
                  <div className="row" key={c.index}>
                    {/* Swatches are sacred: raw Wada hex, never derived. */}
                    <i style={{ background: c.hex }} />
                    <span>
                      <b>{c.name}</b>
                      <br />
                      <code>{c.hex.toUpperCase()}</code>
                    </span>
                    <span className="spacer" style={{ flex: 1 }} />
                    {i === palette.assignment.hueSource && <span className="tag">hue source</span>}
                    {palette.assignment.accents[0] === i && <span className="tag">accent</span>}
                    {palette.assignment.accents[1] === i && <span className="tag">accent 2</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn primary">Save to favourites</button>
                <button type="button" className="btn secondary">Copy palette</button>
                <button type="button" className="btn ghost">Share link</button>
              </div>
              <p className="muted">
                Muted body copy at 4.5:1 on the muted surface — the tightest
                text pairing in the system. Inline
                {' '}
                <a href="#top">links look like this</a>
                {' '}
                and must clear 4.5:1 here too.
              </p>
              <input className="field" placeholder="Search 348 combinations…" />
              <div className="chips">
                <span className="chip on">2 colours</span>
                <span className="chip">3 colours</span>
                <span className="chip">4 colours</span>
                <span className="chip">Favourites</span>
              </div>
            </div>
          </section>

          <section>
            <h2>Browse</h2>
            <div className="grid">
              {[combo, ...near].map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={`card${c.id === combo.id ? ' sel' : ''}`}
                  style={{ padding: 0, font: 'inherit', textAlign: 'start', cursor: 'pointer', color: 'inherit' }}
                  onClick={() => setCombo(String(c.id))}
                >
                  <div className="swatches">
                    {c.colours.map(col => <i key={col.index} style={{ background: col.hex }} />)}
                  </div>
                  <div className="meta">
                    <span>{`#${c.id}`}</span>
                    <span>{`${c.colours.length} colours`}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Every derived role</h2>
            <div className="tokens">
              {Object.entries(palette.roles).map(([name, role]) => (
                <div className="token" key={name}>
                  <i style={{ background: role.hex }} />
                  <span>
                    <b>{name}</b>
                    <code>{role.hex.toUpperCase()}</code>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <AuditPanel combo={combo} variant={variant} mode={mode} palette={palette} />

      <div className="switcher">
        <button type="button" onClick={() => setVariant(keys[(keys.indexOf(variant) - 1 + keys.length) % keys.length])}>←</button>
        <span className="label">
          <b>{variant}</b>
          {` — ${VARIANTS[variant].name}`}
        </span>
        <button type="button" onClick={() => setVariant(keys[(keys.indexOf(variant) + 1) % keys.length])}>→</button>
        <span className="sep" />
        <button type="button" onClick={() => setCombo(String(((combo.id - 2 + combos.length) % combos.length) + 1))}>↓</button>
        <input value={combo.id} onChange={e => setCombo(e.target.value)} />
        <button type="button" onClick={() => setCombo(String((combo.id % combos.length) + 1))}>↑</button>
        <span className="sep" />
        <button type="button" title="Hardest combos" onClick={() => setCombo(String(TOUGH[Math.floor(Math.random() * TOUGH.length)]))}>⚠</button>
        <button type="button" title="Random" onClick={() => setCombo(String(1 + Math.floor(Math.random() * combos.length)))}>?</button>
      </div>
    </>
  )
}

function AuditPanel({ combo, variant, mode, palette }: {
  combo: Combo
  variant: VariantKey
  mode: Mode
  palette: ReturnType<typeof derive>
}) {
  const src = palette.hueSourceColour
  const accent = palette.accentColours[0]
  return (
    <aside className="audit">
      <h3>{`Variant ${variant} — ${VARIANTS[variant].name}`}</h3>
      <p>{VARIANTS[variant].blurb}</p>

      <h3>Assignment (mode-invariant)</h3>
      <p>{`hue source: ${src.name}`}</p>
      <p>{`accents: ${palette.accentColours.map(c => c.name).join(', ')}`}</p>

      <h3>{`WCAG 2.2 AA — ${mode}`}</h3>
      <table>
        <tbody>
          {palette.audit.map(r => (
            <tr key={r.pair}>
              <td>{r.pair}</td>
              <td className={r.pass ? 'ok' : 'no'}>
                {r.ratio.toFixed(2)}
                {r.pass ? ' ✓' : ` ✕ <${r.target}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Drift from raw Wada values</h3>
      <table>
        <tbody>
          {Object.entries(palette.roles).filter(([, r]) => r.shifted !== undefined).map(([k, r]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className={(r.shifted ?? 0) > 0.001 ? '' : 'ok'}>
                {(r.shifted ?? 0) === 0 ? 'exact' : `ΔL ${(r.shifted ?? 0).toFixed(3)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{`total ΔL this rendering: ${totalShift(palette).toFixed(3)}`}</p>

      <h3>Raw vs role</h3>
      <p>
        {`accent ${accent.name}: `}
        <span style={{ color: accent.hex }}>{accent.hex}</span>
        {' → '}
        <span style={{ color: palette.roles.accent.hex }}>{palette.roles.accent.hex}</span>
      </p>
      <p>{`contrast of the RAW accent on canvas: ${contrast(accent.hex, palette.roles.canvas.hex).toFixed(2)} (target 3)`}</p>

      <h3>Shippable CSS for this combo</h3>
      <p className="css">
        {[
          `--hue-source: ${src.hex};`,
          `--accent-raw: ${accent.hex};`,
          `--canvas: oklch(from var(--hue-source) ${mode === 'light' ? '98.5%' : '18%'} clamp(0.0066, calc(c * 0.08), 0.012) h);`,
          `--accent: ${palette.roles.accent.hex}; /* JS-clamped, see notes */`,
          `--on-accent: contrast-color(var(--accent));`,
        ].join('\n')}
      </p>
      <p>{`combo #${combo.id}, ${combo.size} colours`}</p>
      <h3>Keys</h3>
      <p>← → variant · ↑ ↓ combo · ⚠ hardest combos</p>
    </aside>
  )
}
