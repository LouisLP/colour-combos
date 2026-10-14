// Scale -> CSS custom properties (ADR 0012 §8).

import type { EmitOptions } from '../format'
import type { ColourValue, ComboScale } from '../scale'
import { formatColour } from '../format'
import { STEPS } from '../scale'
import { banner, roleRamps, semanticPairs } from './shared'

/**
 * Colour ramps, the neutral ramp, role ramps as aliases, and semantic roles as
 * `light-dark()`, which resolves where used, so `[data-theme]` subtrees flip.
 */
export function emitCss(scale: ComboScale, { format = 'hex' }: EmitOptions = {}): string {
  const v = (value: ColourValue) => formatColour(value, format)
  const lines: string[] = [`/* ${banner(scale)} */`, ':root {']
  for (const ramp of scale.ramps) {
    lines.push(`  /* ${ramp.name}: the exact Wada hex is step ${ramp.anchor} */`)
    for (const step of STEPS)
      lines.push(`  --cc-${ramp.slug}-${step}: ${v(ramp.steps[step])};`)
    lines.push(`  --cc-${ramp.slug}: var(--cc-${ramp.slug}-${ramp.anchor});`, '')
  }
  lines.push('  /* Neutral, tinted from the combo */')
  for (const step of STEPS)
    lines.push(`  --cc-neutral-${step}: ${v(scale.neutral.steps[step])};`)
  for (const { name, ramp } of roleRamps(scale)) {
    lines.push('', `  /* ${name}: ${ramp.name} */`)
    for (const step of STEPS)
      lines.push(`  --cc-${name}-${step}: var(--cc-${ramp.slug}-${step});`)
  }
  lines.push('', '  /* Semantic roles: light-dark(light, dark) */')
  for (const { role, light, dark } of semanticPairs(scale))
    lines.push(`  --cc-${role}: light-dark(${v(light)}, ${v(dark)});`)
  lines.push(
    '}',
    '',
    `[data-theme='light'] { color-scheme: light; }`,
    `[data-theme='dark'] { color-scheme: dark; }`,
    '',
  )
  return lines.join('\n')
}
