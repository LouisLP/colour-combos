// Scale -> Tailwind v4 `@theme` block.

import type { EmitOptions } from '../format'
import type { ColourValue, ComboScale } from '../scale'
import { formatColour } from '../format'
import { STEPS } from '../scale'
import { banner, roleRamps, semanticPairs } from './shared'

/**
 * `bg-cc-english-red-400`, `bg-cc-canvas`, … The `cc-` prefix keeps `neutral`
 * off Tailwind's own. Values are literals, since Tailwind prunes unused theme
 * variables and an alias could point at a pruned one.
 */
export function emitTailwind(scale: ComboScale, { format = 'hex' }: EmitOptions = {}): string {
  const v = (value: ColourValue) => formatColour(value, format)
  const lines: string[] = [`/* ${banner(scale)} */`, '@theme {']
  for (const ramp of scale.ramps) {
    lines.push(`  /* ${ramp.name}: the exact Wada hex is step ${ramp.anchor} */`)
    for (const step of STEPS)
      lines.push(`  --color-cc-${ramp.slug}-${step}: ${v(ramp.steps[step])};`)
    lines.push(`  --color-cc-${ramp.slug}: ${v(ramp.steps[ramp.anchor])};`, '')
  }
  lines.push('  /* Neutral, tinted from the combo */')
  for (const step of STEPS)
    lines.push(`  --color-cc-neutral-${step}: ${v(scale.neutral.steps[step])};`)
  for (const { name, ramp } of roleRamps(scale)) {
    lines.push('', `  /* ${name}: ${ramp.name} */`)
    for (const step of STEPS)
      lines.push(`  --color-cc-${name}-${step}: ${v(ramp.steps[step])};`)
  }
  lines.push('', '  /* Semantic roles: light-dark(light, dark) */')
  for (const { role, light, dark } of semanticPairs(scale))
    lines.push(`  --color-cc-${role}: light-dark(${v(light)}, ${v(dark)});`)
  lines.push('}', '')
  return lines.join('\n')
}
