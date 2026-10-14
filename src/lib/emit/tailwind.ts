// Scale -> Tailwind v4 `@theme` block.

import type { ComboScale } from '../scale'
import { STEPS } from '../scale'
import { banner, roleRamps, semanticPairs } from './shared'

/**
 * A Tailwind v4 `@theme` block: `bg-cc-english-red-400`, `text-cc-accent-700`,
 * `bg-cc-canvas`. The `cc-` prefix keeps the `neutral` ramp off Tailwind's own.
 *
 * Every value is a literal, never a `var()` into another theme variable:
 * Tailwind only emits the theme variables a project uses, so an alias could
 * point at one it pruned. The semantic roles are `light-dark()` pairs and
 * follow `color-scheme` (`scheme-dark`).
 */
export function emitTailwind(scale: ComboScale): string {
  const lines: string[] = [`/* ${banner(scale)} */`, '@theme {']
  for (const ramp of scale.ramps) {
    lines.push(`  /* ${ramp.name}: the exact Wada hex is step ${ramp.anchor} */`)
    for (const step of STEPS)
      lines.push(`  --color-cc-${ramp.slug}-${step}: ${ramp.steps[step].hex};`)
    lines.push(`  --color-cc-${ramp.slug}: ${ramp.steps[ramp.anchor].hex};`, '')
  }
  lines.push('  /* Neutral, tinted from the combo */')
  for (const step of STEPS)
    lines.push(`  --color-cc-neutral-${step}: ${scale.neutral.steps[step].hex};`)
  for (const { name, ramp } of roleRamps(scale)) {
    lines.push('', `  /* ${name}: ${ramp.name} */`)
    for (const step of STEPS)
      lines.push(`  --color-cc-${name}-${step}: ${ramp.steps[step].hex};`)
  }
  lines.push('', '  /* Semantic roles: light-dark(light, dark) */')
  for (const { role, light, dark } of semanticPairs(scale))
    lines.push(`  --color-cc-${role}: light-dark(${light.hex}, ${dark.hex});`)
  lines.push('}', '')
  return lines.join('\n')
}
