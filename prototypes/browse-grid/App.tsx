// PROTOTYPE — throwaway. Answers issue #13: what does the browse surface
// actually look like?
//
// Three radically different browse surfaces on one route, switchable via
// ?variant=A|B|C. Also ?c= (selected combo), ?q=, ?size=, ?fav=1,
// ?mode=light|dark, ?cv=0 (disable content-visibility).
//
// The page is themed by ?c through the ADR 0002 variant-C adaptation model —
// the recursion the issue asks about is real here, not simulated.
//
// The dark pill at the bottom and the panel behind `?` are prototype chrome,
// not part of any design being evaluated.

import type { Mode } from '../adaptation-model/adapt.ts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { derive } from '../adaptation-model/adapt.ts'
import { combos, favourites, filterCombos, useFavourites, useParams, useRenderMeter } from './state.ts'
import VariantA, { NAME as NAME_A } from './VariantA.tsx'
import VariantB, { NAME as NAME_B } from './VariantB.tsx'
import VariantC, { NAME as NAME_C } from './VariantC.tsx'

const VARIANTS = {
  A: { name: NAME_A, Component: VariantA },
  B: { name: NAME_B, Component: VariantB },
  C: { name: NAME_C, Component: VariantC },
}
type Key = keyof typeof VARIANTS
const keys = Object.keys(VARIANTS) as Key[]

const STRESS = ['b', 'bl', 'blu', 'blue', 'blu', 'bl', 'b', '', 'r', 'ro', 'rose', '']

export default function App() {
  const [params, setParams] = useParams()
  const { index: favs } = useFavourites()

  // Local echo of `q` so typing is instant; the URL is written debounced and
  // with replaceState, per #5's history table.
  const [q, setQ] = useState(params.q)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setParams({ q }, 'replace'), 250)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  // Back/forward changed the URL under us — adopt it.
  useEffect(() => {
    if (params.q !== q && document.activeElement?.tagName !== 'INPUT')
      setQ(params.q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q])

  const variant = (keys.includes(params.variant as Key) ? params.variant : 'A') as Key
  const combo = combos.find(c => c.id === params.c) ?? combos[0]

  const source = params.fav ? combos.filter(c => favs.has(c.id)) : combos
  const list = useMemo(() => filterCombos(source, q, params.size), [source, q, params.size])

  const palette = useMemo(() => derive(combo, 'C', params.mode), [combo, params.mode])
  const vars = Object.fromEntries(Object.entries(palette.roles).map(([k, v]) => [`--${k}`, v.hex]))

  const meter = useRenderMeter(`${variant}|${list.length}|${q}|${params.mode}|${params.cv}`)
  const [stress, setStress] = useState<string>('')
  const [chrome, setChrome] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.matches('input, textarea, [contenteditable]'))
        return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const d = e.key === 'ArrowRight' ? 1 : -1
        setParams({ variant: keys[(keys.indexOf(variant) + d + keys.length) % keys.length] }, 'replace')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /** Measure, don't assume: 12 successive filter passes over the live grid. */
  async function runStress() {
    setStress('running…')
    const commits: number[] = []
    const frames: number[] = []
    for (const term of STRESS) {
      const t0 = performance.now()
      flushSync(() => setQ(term))
      commits.push(performance.now() - t0)
      await new Promise<void>(r => requestAnimationFrame(() => r()))
      frames.push(performance.now() - t0)
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const max = (xs: number[]) => Math.max(...xs)
    setStress(
      `commit mean ${mean(commits).toFixed(1)}ms / max ${max(commits).toFixed(1)}ms · `
      + `to-paint mean ${mean(frames).toFixed(1)}ms / max ${max(frames).toFixed(1)}ms`,
    )
  }

  const { Component, name } = VARIANTS[variant]

  return (
    <>
      <div
        className={`stage${params.cv ? ' cv' : ''}`}
        style={{ ...vars, colorScheme: params.mode } as React.CSSProperties}
      >
        <Component
          list={list}
          all={params.fav ? source : combos}
          selected={combo.id}
          onSelect={id => setParams({ c: id }, 'push')}
          favs={favs}
          onFav={id => favourites.toggle(id)}
          q={q}
          onQ={setQ}
          size={params.size}
          onSize={s => setParams({ size: s }, 'push')}
          fav={params.fav}
          onFavFilter={on => setParams({ fav: on }, 'push')}
        />
      </div>

      <div className="switcher">
        <button type="button" onClick={() => setParams({ variant: keys[(keys.indexOf(variant) - 1 + keys.length) % keys.length] }, 'replace')}>←</button>
        <span className="label">
          <b>{variant}</b>
          {` — ${name}`}
        </span>
        <button type="button" onClick={() => setParams({ variant: keys[(keys.indexOf(variant) + 1) % keys.length] }, 'replace')}>→</button>
        <span className="sep" />
        <button type="button" title="Toggle light/dark" onClick={() => setParams({ mode: (params.mode === 'light' ? 'dark' : 'light') as Mode }, 'replace')}>
          {params.mode === 'light' ? '☾' : '☀'}
        </button>
        <button type="button" title="Random combo" onClick={() => setParams({ c: combos[Math.floor(Math.random() * combos.length)].id }, 'push')}>?</button>
        <span className="sep" />
        <span className="stat">
          {`${list.length} · ${meter.frame.toFixed(1)}ms · ${meter.nodes} nodes`}
        </span>
        <button type="button" title="Measurement panel" onClick={() => setChrome(!chrome)}>{chrome ? '×' : 'ⓘ'}</button>
      </div>

      {chrome && (
        <aside className="probe">
          <h3>{`Variant ${variant} — ${name}`}</h3>
          <p>{`combo #${combo.id} · ${combo.size} colours · ${params.mode}`}</p>

          <h3>Last render</h3>
          <table>
            <tbody>
              <tr>
                <td>rendered</td>
                <td>{`${list.length} / ${combos.length}`}</td>
              </tr>
              <tr>
                <td>React commit + layout</td>
                <td>{`${meter.commit.toFixed(1)} ms`}</td>
              </tr>
              <tr>
                <td>through to paint</td>
                <td>{`${meter.frame.toFixed(1)} ms`}</td>
              </tr>
              <tr>
                <td>DOM nodes (whole doc)</td>
                <td>{meter.nodes}</td>
              </tr>
            </tbody>
          </table>

          <h3>Virtualisation question</h3>
          <p>
            {`content-visibility: auto is ${params.cv ? 'ON' : 'OFF'} for the grid container.`}
          </p>
          <button type="button" className="probe-btn" onClick={() => setParams({ cv: !params.cv }, 'replace')}>
            {params.cv ? 'Turn it off' : 'Turn it on'}
          </button>
          <button type="button" className="probe-btn" onClick={runStress}>Run 12-pass filter stress</button>
          <p className="probe-out">{stress || 'no stress run yet'}</p>

          <h3>Params (#5 contract)</h3>
          <p className="probe-out">
            {`c=${params.c} q=${params.q || '∅'} size=${params.size ?? '∅'} fav=${params.fav ? 1 : 0}`}
          </p>
          <p>select → push · type → replace (250 ms) · toggle → push</p>

          <h3>Keys</h3>
          <p>← → variant</p>
        </aside>
      )}
    </>
  )
}
