// Scale -> SCSS variables and maps.

import type { EmitOptions } from '../format'
import type { ColourValue, ComboScale } from '../scale'
import { formatColour } from '../format'
import { STEPS } from '../scale'
import { banner, MODES, roleRamps, semanticPairs } from './shared'

/**
 * Variables named like the CSS ones, plus `$cc-ramps` and `$cc-semantic` maps.
 * `$cc-<role>` is `light-dark()`; read `$cc-semantic` for a fixed mode.
 */
export function emitScss(scale: ComboScale, { format = 'hex' }: EmitOptions = {}): string {
  const v = (value: ColourValue) => formatColour(value, format)
  const lines: string[] = [`// ${banner(scale)}`, '', `$cc-canonical-mode: ${scale.canonicalMode};`, '']
  for (const ramp of scale.ramps) {
    lines.push(`// ${ramp.name}: the exact Wada hex is step ${ramp.anchor}`)
    for (const step of STEPS)
      lines.push(`$cc-${ramp.slug}-${step}: ${v(ramp.steps[step])};`)
    lines.push(`$cc-${ramp.slug}: $cc-${ramp.slug}-${ramp.anchor};`, '')
  }
  lines.push('// Neutral, tinted from the combo')
  for (const step of STEPS)
    lines.push(`$cc-neutral-${step}: ${v(scale.neutral.steps[step])};`)
  const roles = roleRamps(scale)
  for (const { name, ramp } of roles) {
    lines.push('', `// ${name}: ${ramp.name}`)
    for (const step of STEPS)
      lines.push(`$cc-${name}-${step}: $cc-${ramp.slug}-${step};`)
  }
  const pairs = semanticPairs(scale)
  lines.push('', '// Semantic roles: light-dark(light, dark)')
  for (const { role, light, dark } of pairs)
    lines.push(`$cc-${role}: light-dark(${v(light)}, ${v(dark)});`)

  const map = (name: string, entries: [key: string, value: string][]) =>
    [`  ${name}: (`, ...entries.map(([k, v]) => `    ${k}: ${v},`), '  ),']
  lines.push(
    '',
    '$cc-ramps: (',
    ...[...scale.ramps.map(r => r.slug), 'neutral', ...roles.map(r => r.name)].flatMap(base =>
      map(`'${base}'`, STEPS.map(s => [String(s), `$cc-${base}-${s}`]))),
    ');',
    '',
    '$cc-semantic: (',
    ...MODES.flatMap(mode => map(mode, pairs.map(p => [`'${p.role}'`, v(p[mode])]))),
    ');',
    '',
  )
  return lines.join('\n')
}
