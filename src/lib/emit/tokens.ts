// Scale -> W3C Design Tokens (DTCG) JSON, readable by Style Dictionary and
// Tokens Studio.

import type { ComboScale, Step } from '../scale'
import { STEPS } from '../scale'
import { banner, MODES, PACKAGE_NAME, roleRamps, semanticPairs } from './shared'

/** Reverse-domain key for the scale's own metadata, as the format asks of vendor extensions. */
export const TOKENS_EXTENSION = `io.github.louislp.${PACKAGE_NAME}`

interface Token { $value: string }
type Group = Record<string, Token>

function steps(value: (step: Step) => string): Group {
  return Object.fromEntries(STEPS.map(step => [step, { $value: value(step) }]))
}

/**
 * Every token sits under `cc`, so a flattening tool names them as the CSS does
 * (`cc-english-red-400`, `cc-accent-500`, `cc-semantic-light-canvas`). Role
 * ramps are aliases (`{cc.english-red.400}`); a colour's anchor step and the
 * combo's canonical mode live in `$extensions`, since a group cannot also be a
 * token.
 *
 * Values are hex strings rather than the format's newer colour objects: that
 * is what the tools in use today read.
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
