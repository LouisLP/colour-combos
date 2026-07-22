import { useMode } from '../hooks/useMode'
import { toggle } from '../state/mode'

/**
 * Two states, not three: "follow the system" is reachable until you press this,
 * and not after (ADR 0005 §4). Pressing it is a discrete event, so React commits
 * the new accents in the same frame the CSS neutrals flip via `light-dark()`.
 */
export function ModeToggle() {
  const mode = useMode()
  const next = mode === 'dark' ? 'light' : 'dark'

  return (
    <button type="button" className="mode-toggle" onClick={toggle}>
      {/* The icon names the mode you are moving to, so it agrees with the label. */}
      <span aria-hidden="true">{next === 'dark' ? '☾' : '☀'}</span>
      <span className="sr-only">{`Switch to ${next} mode`}</span>
    </button>
  )
}
