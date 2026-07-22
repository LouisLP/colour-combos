import { useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { useHubSearch } from '../hooks/useHubSearch'

/**
 * The longest rejected `c` worth echoing back. `?c=` accepts anything, so the
 * value is unbounded user input; past a couple of dozen characters it stops
 * being recognisable as "what I typed" and starts being a layout problem.
 */
const MAX_ECHO = 24

/**
 * The "Combo 999 not found — showing 71" notice of ADR 0004 §8.
 *
 * The rejected value is read from typed location state rather than the URL: the
 * root route already `replaceState`d the resolved combo in, so the URL no longer
 * has it. Location state survives that replace but not a reload, which is right
 * — it is a transient explanation of what just happened, not a fact about the
 * app (ADR 0005 §7).
 *
 * Without this a mistyped or stale shared link is silently swallowed: the
 * recipient lands on a random combo that looks exactly like a normal first
 * visit, and the link's author is never told their link is dead.
 */
export function NotFoundNotice() {
  const rejected = useRouterState({ select: s => s.location.state.notFoundCombo })
  const { c } = useHubSearch()

  // The dismissed *value*, not a boolean: a second bad link arriving in the same
  // document is a second thing to explain, and a boolean would swallow it.
  const [dismissed, setDismissed] = useState<string>()

  if (rejected === undefined || rejected === dismissed)
    return null

  const echo = rejected.length > MAX_ECHO
    ? `${rejected.slice(0, MAX_ECHO)}…`
    : rejected

  return (
    <div className="notice" role="status">
      <p>
        {`Combo ${echo} not found — showing ${c}.`}
      </p>
      <button
        type="button"
        className="notice-dismiss"
        aria-label="Dismiss"
        onClick={() => setDismissed(rejected)}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  )
}
