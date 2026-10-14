// PROTOTYPE — throwaway. Answers issue #43: what is "a scale" for a combo?
//
// One page, three tonal models (?model=A|B|C, ←/→) × two lightness curves
// (?curve=oklab|wcag, `c`), over any combo (?combo=1..348, ↑/↓). The wcag
// curve's endpoints are tunable (?yTop= &yBottom=) so the margin the contrast
// promises run on is visible, not asserted.
//
// The variants disagree about the MODEL, not the layout — the question is the
// shape of exported data, so the view stays fixed and the data swaps under it.
// Everything left of the dark panel renders from the scale; the semantic cards
// render from the real adapter (src/theme/adapt.ts). The dark panel is
// prototype chrome: catalogue-wide sweep + the CSS a combo would export.

import type { Mode } from '../../src/theme/adapt'
import type { CurveKey, ModelKey, Ramp, Swatch } from './scale'
import { useEffect, useMemo, useState } from 'react'
import { COMBOS } from '../../src/data/combos'
import { adapt, comboMode } from '../../src/theme/adapt'
import { contrast, hexToOklch } from '../../src/theme/colour'
import { buildScale, CURVE_NAMES, ENDS, MODEL_NAMES, PER_100, PROMISES, setEnds, STEPS } from './scale'
import { sweep } from './sweep'

const FEATURED = [
  { id: 1, why: '2 · vivid pair' },
  { id: 100, why: '2 · muted' },
  { id: 160, why: '3' },
  { id: 250, why: '4 · vivid' },
  { id: 300, why: '4 · pastels' },
  { id: 69, why: 'achromatic' },
  { id: 139, why: 'extreme drift' },
]
const MODELS: ModelKey[] = ['A', 'B', 'C']
const CURVES: CurveKey[] = ['wcag', 'oklab']

function readParams() {
  const p = new URLSearchParams(location.search)
  const id = Number(p.get('combo'))
  return {
    combo: id >= 1 && id <= 348 ? id : 1,
    model: (MODELS.includes(p.get('model') as ModelKey) ? p.get('model') : 'A') as ModelKey,
    curve: (CURVES.includes(p.get('curve') as CurveKey) ? p.get('curve') : 'wcag') as CurveKey,
    yTop: Number(p.get('yTop')) || 0.98,
    yBottom: Number(p.get('yBottom')) || 0.001,
    naming: p.get('naming') === 'colour' ? 'colour' as const : 'role' as const,
  }
}
type Params = ReturnType<typeof readParams>

const fmt = (n: number, d = 2) => n.toFixed(d)

export default function App() {
  const [params, setParamsState] = useState(readParams)
  const set = (patch: Partial<Params>) => {
    const next = { ...params, ...patch }
    const q = new URLSearchParams(Object.entries(next).map(([k, v]) => [k, String(v)]))
    history.replaceState(null, '', `?${q}`)
    setParamsState(next)
  }

  // Module-level knob: retune before anything below reads the scale.
  if (ENDS.top !== params.yTop || ENDS.bottom !== params.yBottom)
    setEnds(params.yTop, params.yBottom)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]'))
        return
      const cycle = <T,>(list: T[], cur: T, d: number) => list[(list.indexOf(cur) + d + list.length) % list.length]
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
        set({ model: cycle(MODELS, params.model, e.key === 'ArrowLeft' ? -1 : 1) })
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
        set({ combo: ((params.combo - 1 + (e.key === 'ArrowUp' ? -1 : 1) + 348) % 348) + 1 })
      else if (e.key === 'c')
        set({ curve: cycle(CURVES, params.curve, 1) })
      else return
      e.preventDefault()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const combo = COMBOS[params.combo - 1]
  const scale = buildScale(params.model, params.curve, combo)
  const canonical = comboMode(combo)

  return (
    <div className="page">
      <main>
        <header>
          <h1>Combo scale model <small>PROTOTYPE · #43</small></h1>
          <div className="controls">
            <div className="seg">
              {MODELS.map(m => (
                <button key={m} type="button" aria-pressed={params.model === m} onClick={() => set({ model: m })}>
                  <b>{m}</b>
                  {' '}
                  {MODEL_NAMES[m]}
                </button>
              ))}
            </div>
            <div className="seg">
              {CURVES.map(c => (
                <button key={c} type="button" aria-pressed={params.curve === c} onClick={() => set({ curve: c })}>
                  {CURVE_NAMES[c]}
                </button>
              ))}
            </div>
            {params.curve === 'wcag' && (
              <div className="ends">
                <label>
                  Y(50)
                  <input type="number" step="0.005" min="0.8" max="1" value={params.yTop} onChange={e => set({ yTop: Number(e.target.value) })} />
                </label>
                <label>
                  Y(950)
                  <input type="number" step="0.001" min="0" max="0.05" value={params.yBottom} onChange={e => set({ yBottom: Number(e.target.value) })} />
                </label>
                <span>
                  ×
                  {fmt(PER_100, 3)}
                  {' '}
                  / 100 grades → ×
                  {fmt(PER_100 ** 5)}
                  {' '}
                  / 500
                </span>
              </div>
            )}
          </div>
          <nav className="combos">
            {FEATURED.map(f => (
              <button key={f.id} type="button" aria-pressed={params.combo === f.id} onClick={() => set({ combo: f.id })}>
                <span className="dots">{COMBOS[f.id - 1].colours.map(c => <i key={c.hex} style={{ background: c.hex }} />)}</span>
                #
                {f.id}
                {' '}
                <small>{f.why}</small>
              </button>
            ))}
            <label className="any">
              #
              <input type="number" min={1} max={348} value={params.combo} onChange={e => set({ combo: Math.min(348, Math.max(1, Number(e.target.value) || 1)) })} />
            </label>
          </nav>
        </header>

        <section>
          <h2>
            Tonal layer — combo #
            {combo.id}
            {' '}
            <small>
              {`canonical mode: ${canonical} · hue source: ${combo.colours[scale.hueSource].name}`}
            </small>
          </h2>
          {scale.ramps.map((r, i) => (
            <RampRow key={r.source + i} ramp={r} label={`${r.name}`} sub={`colour ${i + 1}`} />
          ))}
          <RampRow ramp={scale.neutral} label="Neutral" sub={`tinted from ${combo.colours[scale.hueSource].name}`} />
          <p className="legend">
            ★ exact Wada hex · ✂ sRGB cut chroma (P3 would keep more) · numbers = contrast vs 50 / vs 950 · bar = OKLCh chroma
          </p>
        </section>

        <section className="modes">
          {(['light', 'dark'] as Mode[]).map(m => (
            <SemanticCard key={m} mode={m} canonical={m === canonical} comboId={combo.id} rampsNeutral={scale.neutral} rampsAll={[...scale.ramps, scale.neutral]} />
          ))}
        </section>

        <section className="modes">
          <Sample mode="light" ramps={scale.ramps} neutral={scale.neutral} />
          <Sample mode="dark" ramps={scale.ramps} neutral={scale.neutral} />
        </section>
      </main>

      <Panel params={params} set={set} />
    </div>
  )
}

function RampRow({ ramp, label, sub }: { ramp: Ramp, label: string, sub: string }) {
  const s50 = ramp.swatches[0].hex
  const s950 = ramp.swatches[10].hex
  return (
    <div className="ramp">
      <div className="ramp-label">
        <b>{label}</b>
        <small>{sub}</small>
        <code>{ramp.source}</code>
      </div>
      <div className="swatches">
        {ramp.swatches.map((s, i) => (
          <SwatchCell key={s.step} s={s} anchor={i === ramp.anchorIndex && !ramp.separateDefault} near={i === ramp.anchorIndex && ramp.separateDefault} s50={s50} s950={s950} />
        ))}
        {ramp.separateDefault && (
          <div className="sw default">
            <div className="chip" style={{ background: ramp.source }}>
              <span style={{ color: contrast(ramp.source, '#fff') > contrast(ramp.source, '#000') ? '#fff' : '#000' }}>★</span>
            </div>
            <b>DEFAULT</b>
            <code>{ramp.source}</code>
            <small>
              ≈
              {STEPS[ramp.anchorIndex]}
            </small>
          </div>
        )}
      </div>
    </div>
  )
}

function SwatchCell({ s, anchor, near, s50, s950 }: { s: Swatch, anchor: boolean, near: boolean, s50: string, s950: string }) {
  const on = contrast(s.hex, '#fff') > contrast(s.hex, '#000') ? '#fff' : '#000'
  return (
    <div className={`sw${anchor ? ' anchor' : ''}${near ? ' near' : ''}`} title={`L ${fmt(s.got.l, 3)} C ${fmt(s.got.c, 3)} h ${fmt(s.got.h, 1)}\n${s.p3}`}>
      <div className="chip" style={{ background: s.hex, color: on }}>
        {anchor && '★'}
        {s.clipped && <span className="clip">✂</span>}
      </div>
      <b>{s.step}</b>
      <code>{s.hex}</code>
      <small>
        {fmt(contrast(s.hex, s50), 1)}
        {' / '}
        {fmt(contrast(s.hex, s950), 1)}
      </small>
      <div className="cbar"><i style={{ width: `${Math.min(100, (s.got.c / 0.25) * 100)}%`, background: s.hex }} /></div>
    </div>
  )
}

/** Real adapter output, with the nearest tonal step each role could reference. */
function SemanticCard({ mode, canonical, comboId, rampsAll }: { mode: Mode, canonical: boolean, comboId: number, rampsNeutral: Ramp, rampsAll: Ramp[] }) {
  const p = adapt(COMBOS[comboId - 1], mode)
  // Neutral roles may only reference the neutral ramp; accent roles the colour ramps.
  const nearest = (role: string, hex: string) => {
    const a = hexToOklch(hex)
    let best = { name: '', d: Infinity }
    const pool = /accent/.test(role) ? rampsAll.slice(0, -1) : rampsAll.slice(-1)
    for (const r of pool) {
      for (const s of r.swatches) {
        const b = s.got
        const hr = Math.PI / 180
        const d = Math.hypot(a.l - b.l, a.c * Math.cos(a.h * hr) - b.c * Math.cos(b.h * hr), a.c * Math.sin(a.h * hr) - b.c * Math.sin(b.h * hr))
        if (d < best.d)
          best = { name: `${r.slug}-${s.step}`, d }
      }
    }
    return best
  }
  return (
    <div className="semantic">
      <h3>
        Semantic layer ·
        {' '}
        {mode}
        {canonical && <span className="tag">canonical</span>}
      </h3>
      <table>
        <tbody>
          {Object.entries(p.roles).map(([role, r]) => {
            const n = nearest(role, r.hex)
            // ΔEok < 0.02 ≈ just-noticeable: could be a reference, not a value.
            const ref = n.d < 0.02
            return (
              <tr key={role}>
                <td><i className="dot" style={{ background: r.hex }} /></td>
                <td>{role}</td>
                <td><code>{r.hex}</code></td>
                <td className={ref ? 'ok' : 'miss'}>
                  {ref ? '→ ' : '≉ '}
                  {n.name}
                  <small>
                    {' '}
                    ΔE
                    {fmt(n.d * 100, 1)}
                  </small>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** A UI built ONLY from tonal steps — does the exported scale theme a real page? */
function Sample({ mode, ramps, neutral }: { mode: Mode, ramps: Ramp[], neutral: Ramp }) {
  const n = (step: number) => neutral.swatches[STEPS.indexOf(step as never)].hex
  const light = mode === 'light'
  const tok = {
    bg: n(light ? 50 : 950),
    surface: light ? '#ffffff' : n(900),
    ink: n(light ? 950 : 50),
    muted: n(light ? 600 : 300),
    border: n(light ? 200 : 800),
  }
  return (
    <div className="sample" style={{ background: tok.bg, color: tok.ink }}>
      <h3>
        Sample UI ·
        {' '}
        {mode}
        {' '}
        <small style={{ color: tok.muted }}>
          neutral-
          {light ? '50/950' : '950/50'}
          , accents
          {' '}
          {light ? '600 + 50 text' : '400 + 950 text'}
        </small>
      </h3>
      <div className="card" style={{ background: tok.surface, borderColor: tok.border }}>
        <p>
          Body text on surface. Muted:
          {' '}
          <span style={{ color: tok.muted }}>secondary copy</span>
          .
        </p>
        <div className="buttons">
          {ramps.map((r, i) => {
            const fill = r.swatches[STEPS.indexOf(light ? 600 : 400)].hex
            const text = r.swatches[STEPS.indexOf(light ? 50 : 950)].hex
            const link = r.swatches[STEPS.indexOf(light ? 700 : 300)].hex
            return (
              <span key={r.source + i} className="pair">
                <button type="button" style={{ background: fill, color: text }}>
                  {r.name}
                  <small>
                    {' '}
                    {fmt(contrast(fill, text), 1)}
                  </small>
                </button>
                <a style={{ color: link }}>
                  link
                  {' '}
                  {fmt(contrast(link, tok.surface), 1)}
                </a>
                <span className="tint" style={{ background: r.swatches[STEPS.indexOf(light ? 100 : 900)].hex, color: r.swatches[STEPS.indexOf(light ? 800 : 200)].hex }}>
                  badge
                </span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Panel({ params, set }: { params: Params, set: (p: Partial<Params>) => void }) {
  // Whole catalogue, all six model × curve combinations. ~1–2 s once per ends change.
  const results = useMemo(() => {
    const out: Record<string, ReturnType<typeof sweep>> = {}
    for (const c of CURVES) {
      for (const m of MODELS)
        out[`${m}/${c}`] = sweep(m, c)
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.yTop, params.yBottom])
  const cur = results[`${params.model}/${params.curve}`]
  const combo = COMBOS[params.combo - 1]
  const scale = buildScale(params.model, params.curve, combo)
  const a = adapt(combo, 'light').assignment

  const css = useMemo(() => {
    const lines: string[] = [`/* combo #${combo.id} — model ${params.model}, ${params.curve} */`, ':root {']
    const name = (r: Ramp, i: number) => {
      if (params.naming === 'colour')
        return r.slug
      if (r.slug === 'neutral')
        return 'neutral'
      const rank = a.accents.indexOf(i)
      return rank === 0 ? 'accent' : `accent-${rank + 1}`
    }
    ;[...scale.ramps, scale.neutral].forEach((r, i) => {
      const n = name(r, i)
      for (const s of r.swatches)
        lines.push(`  --cc-${n}-${s.step}: ${s.hex};`)
      if (r.anchorIndex >= 0)
        lines.push(r.separateDefault ? `  --cc-${n}: ${r.source}; /* DEFAULT */` : `  --cc-${n}: var(--cc-${n}-${STEPS[r.anchorIndex]}); /* anchor */`)
    })
    lines.push('}')
    return lines.join('\n')
  }, [scale, params.naming, params.model, params.curve, combo.id, a])

  return (
    <aside className="panel">
      <h2>Catalogue sweep</h2>
      <p className="dim">348 combos · 1032 colour ramps + 348 neutral. Fail counts, colour / neutral.</p>
      <table className="sweep">
        <thead>
          <tr>
            <th />
            {CURVES.flatMap(c => MODELS.map(m => (
              <th key={m + c} className={params.model === m && params.curve === c ? 'cur' : ''}>
                {m}
                <br />
                <small>{c}</small>
              </th>
            )))}
          </tr>
        </thead>
        <tbody>
          {PROMISES.map(p => (
            <tr key={p.id}>
              <td>{p.label}</td>
              {CURVES.flatMap(c => MODELS.map((m) => {
                const t = results[`${m}/${c}`].promises[p.id]
                const bad = t.colourFail + t.neutralFail
                return (
                  <td key={m + c} className={`${bad ? 'bad' : 'good'}${params.model === m && params.curve === c ? ' cur' : ''}`} title={`worst ${fmt(t.worst)}`}>
                    {bad ? `${t.colourFail}/${t.neutralFail}` : '✓'}
                    <small>{fmt(t.worst, 2)}</small>
                  </td>
                )
              }))}
            </tr>
          ))}
          <tr>
            <td>max hue drift</td>
            {CURVES.flatMap(c => MODELS.map(m => <td key={m + c}>{fmt(results[`${m}/${c}`].maxHueDrift, 1)}°</td>))}
          </tr>
          <tr>
            <td>non-monotonic ramps</td>
            {CURVES.flatMap(c => MODELS.map(m => <td key={m + c}>{results[`${m}/${c}`].nonMonotonic}</td>))}
          </tr>
          <tr>
            <td>steps sRGB-clipped</td>
            {CURVES.flatMap(c => MODELS.map(m => <td key={m + c}>{fmt(results[`${m}/${c}`].clippedSteps / results[`${m}/${c}`].totalSteps * 100, 0)}%</td>))}
          </tr>
          <tr>
            <td>…of which P3 also clips</td>
            {CURVES.flatMap(c => MODELS.map(m => <td key={m + c}>{fmt(results[`${m}/${c}`].clippedP3Steps / results[`${m}/${c}`].totalSteps * 100, 0)}%</td>))}
          </tr>
        </tbody>
      </table>

      <h3>Where anchors land</h3>
      <div className="hist">
        {STEPS.map((s, i) => {
          const max = Math.max(...cur.anchorHistogram)
          return (
            <div key={s}>
              <i style={{ height: `${(cur.anchorHistogram[i] / max) * 60}px` }} />
              <small>{s}</small>
              <small>{cur.anchorHistogram[i]}</small>
            </div>
          )
        })}
      </div>
      <p className="dim">
        Anchor off its step target by up to ×
        {fmt(cur.maxAnchorOffset)}
        {' '}
        contrast. Slug collisions within a combo:
        {' '}
        {cur.slugCollisions}
        .
      </p>

      <h3>
        Export (
        <button type="button" className="link" onClick={() => set({ naming: params.naming === 'role' ? 'colour' : 'role' })}>
          {params.naming === 'role' ? 'role-named' : 'colour-named'}
          {' '}
          ⇄
        </button>
        )
      </h3>
      <pre>{css}</pre>
      <p className="dim">Keys: ←/→ model · ↑/↓ combo · c curve</p>
    </aside>
  )
}
