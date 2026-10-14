// Scale -> SCSS variables and maps.

import type { ComboScale } from '../scale'
import { STEPS } from '../scale'
import { banner, MODES, roleRamps, semanticPairs } from './shared'

/**
 * SCSS variables named as the CSS custom properties are (`$cc-english-red-400`,
 * `$cc-accent-500`, `$cc-canvas`), plus maps for looping: `$cc-ramps` by ramp
 * then step, and `$cc-semantic` by mode then role.
 *
 * `$cc-<role>` is a `light-dark()` pair, which Sass passes through as plain
 * CSS. For a value fixed at compile time, read `$cc-semantic` instead.
 */
export function emitScss(scale: ComboScale): string {
  const lines: string[] = [`// ${banner(scale)}`, '', `$cc-canonical-mode: ${scale.canonicalMode};`, '']
  for (const ramp of scale.ramps) {
    lines.push(`// ${ramp.name}: the exact Wada hex is step ${ramp.anchor}`)
    for (const step of STEPS)
      lines.push(`$cc-${ramp.slug}-${step}: ${ramp.steps[step].hex};`)
    lines.push(`$cc-${ramp.slug}: $cc-${ramp.slug}-${ramp.anchor};`, '')
  }
  lines.push('// Neutral, tinted from the combo')
  for (const step of STEPS)
    lines.push(`$cc-neutral-${step}: ${scale.neutral.steps[step].hex};`)
  const roles = roleRamps(scale)
  for (const { name, ramp } of roles) {
    lines.push('', `// ${name}: ${ramp.name}`)
    for (const step of STEPS)
      lines.push(`$cc-${name}-${step}: $cc-${ramp.slug}-${step};`)
  }
  const pairs = semanticPairs(scale)
  lines.push('', '// Semantic roles: light-dark(light, dark)')
  for (const { role, light, dark } of pairs)
    lines.push(`$cc-${role}: light-dark(${light.hex}, ${dark.hex});`)

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
    ...MODES.flatMap(mode => map(mode, pairs.map(p => [`'${p.role}'`, p[mode].hex]))),
    ');',
    '',
  )
  return lines.join('\n')
}
