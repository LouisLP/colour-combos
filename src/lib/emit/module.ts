// Scale -> a TypeScript or JavaScript module whose default export is the scale.

import type { ComboScale } from '../scale'
import { banner, PACKAGE_NAME } from './shared'

type Literal = string | number | readonly Literal[] | { readonly [key: string]: Literal }

const isPrimitive = (v: Literal) => typeof v !== 'object'
const isLeaf = (v: Literal) => isPrimitive(v) || (Array.isArray(v) && v.every(isPrimitive))
/** Holds only leaves, so it fits on one line. */
const isFlat = (v: Literal) => Array.isArray(v) ? v.every(isPrimitive) : Object.values(v).every(isLeaf)

const quote = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
const key = (k: string) => /^(?:[a-z_$][\w$]*|\d+)$/i.test(k) ? k : quote(k)

/**
 * Source text for a value, formatted the way the repo's lint would: a colour
 * value fits on one line, anything holding one is broken across lines.
 */
function literal(v: Literal, indent = ''): string {
  if (typeof v === 'string')
    return quote(v)
  if (typeof v === 'number')
    return String(v)
  const inner = `${indent}  `
  if (Array.isArray(v)) {
    return isFlat(v)
      ? `[${v.map(x => literal(x)).join(', ')}]`
      : `[\n${v.map(x => `${inner}${literal(x, inner)},`).join('\n')}\n${indent}]`
  }
  const entries = Object.entries(v as Record<string, Literal>)
  return isFlat(v)
    ? `{ ${entries.map(([k, x]) => `${key(k)}: ${literal(x)}`).join(', ')} }`
    : `{\n${entries.map(([k, x]) => `${inner}${key(k)}: ${literal(x, inner)},`).join('\n')}\n${indent}}`
}

const body = (scale: ComboScale) => literal(scale as unknown as Literal)

/** A TypeScript module, typed against the library's `ComboScale`. */
export function emitTs(scale: ComboScale): string {
  return [
    `// ${banner(scale)}`,
    `import type { ComboScale } from '${PACKAGE_NAME}'`,
    '',
    `const scale: ComboScale = ${body(scale)}`,
    '',
    'export default scale',
    '',
  ].join('\n')
}

/** The declaration file shipped beside each `scales/<id>.js`. */
export function emitDts(scale: ComboScale): string {
  return `// ${PACKAGE_NAME} · Wada No. ${scale.id}\nimport type { ComboScale } from '../index.js'\n\ndeclare const scale: ComboScale\nexport default scale\n`
}

/** The same module as JavaScript, typed through JSDoc. */
export function emitJs(scale: ComboScale): string {
  return [
    `// ${banner(scale)}`,
    '',
    `/** @type {import('${PACKAGE_NAME}').ComboScale} */`,
    `const scale = ${body(scale)}`,
    '',
    'export default scale',
    '',
  ].join('\n')
}
