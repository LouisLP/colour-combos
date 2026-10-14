// Scale -> W3C Design Tokens (DTCG) JSON, readable by Style Dictionary and
// Tokens Studio.

import type { ComboScale, Step } from '../scale'
import { STEPS } from '../scale'
import { banner, MODES, PACKAGE_NAME, roleRamps, semanticPairs } from './shared'

/** Reverse-domain key for our `$extensions`. */
export const TOKENS_EXTENSION = `io.github.louislp.${PACKAGE_NAME}`

interface Token { $value: string }
type Group = Record<string, Token>

function steps(value: (step: Step) => string): Group {
  return Object.fromEntries(STEPS.map(step => [step, { $value: value(step) }]))
}

/**
 * Tokens sit under `cc`, so flattened names match the CSS. Role ramps are
 * aliases; anchors and canonical mode go in `$extensions`. Hex strings, because
 * that's what today's tools read.
 */
export function emitTokens(scale: ComboScale): string {
  const cc: Record<string, unknown> = { $type: 'color' }
  for (const ramp of scale.ramps) {
    cc[ramp.slug] = {
      $extensions: { [TOKENS_EXTENSION]: { name: ramp.name, anchor: ramp.anchor } },
      ...steps(step => ramp.steps[step].hex),
    }
  }
  cc.neutral = steps(step => scale.neutral.steps[step].hex)
  for (const { name, ramp } of roleRamps(scale))
    cc[name] = steps(step => `{cc.${ramp.slug}.${step}}`)
  const pairs = semanticPairs(scale)
  cc.semantic = Object.fromEntries(MODES.map(mode =>
    [mode, Object.fromEntries(pairs.map(p => [p.role, { $value: p[mode].hex }]))]))

  const doc = {
    $description: banner(scale),
    $extensions: { [TOKENS_EXTENSION]: { id: scale.id, canonicalMode: scale.canonicalMode } },
    cc,
  }
  return `${JSON.stringify(doc, null, 2)}\n`
}
