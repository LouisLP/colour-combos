// The combo page's code blocks: one tab per export format, each the exact text
// the package ships (ADR 0013 §1). Nothing here writes a colour — every block is
// an emitter's output, and the snippet above it is how to import that file.

import type { ColourFormat } from '../lib/format'
import type { ComboScale } from '../lib/scale'
import type { CodeLang } from './highlight'
import { emitCss, emitJs, emitScss, emitTailwind, emitTokens, PACKAGE_NAME } from '../lib/emit'

export interface CodeTab {
  id: 'css' | 'tailwind' | 'scss' | 'json' | 'js'
  label: string
  /** The Shiki grammar. Tailwind's `@theme` is CSS, and JS reads fine as TS. */
  lang: CodeLang
  /** The emitter's exported name, for the note under a non-hex block. */
  emitter: string
  /** Whether the value-format toggle reaches this block. */
  formatted: boolean
  /** The block: an emitter's output, byte for byte. */
  code: (scale: ComboScale, format: ColourFormat) => string
  /** How to import the package's copy of the file. */
  install: (id: number) => string
}

export const CODE_TABS: readonly CodeTab[] = [
  {
    id: 'css',
    emitter: 'emitCss',
    label: 'CSS',
    lang: 'css',
    formatted: true,
    code: (scale, format) => emitCss(scale, { format }),
    install: id => `import '${PACKAGE_NAME}/${id}.css'`,
  },
  {
    id: 'tailwind',
    emitter: 'emitTailwind',
    label: 'Tailwind',
    lang: 'css',
    formatted: true,
    code: (scale, format) => emitTailwind(scale, { format }),
    install: id => `@import '${PACKAGE_NAME}/tailwind/${id}.css';`,
  },
  {
    id: 'scss',
    emitter: 'emitScss',
    label: 'SCSS',
    lang: 'scss',
    formatted: true,
    code: (scale, format) => emitScss(scale, { format }),
    install: id => `@use 'pkg:${PACKAGE_NAME}/${id}.scss' as cc;`,
  },
  // Hex whatever the toggle says: token tools read hex (ADR 0013 §2).
  {
    id: 'json',
    emitter: 'emitTokens',
    label: 'JSON',
    lang: 'json',
    formatted: false,
    code: scale => emitTokens(scale),
    install: id => `import tokens from '${PACKAGE_NAME}/${id}.json' with { type: 'json' }`,
  },
  // The scale object carries all three notations on every colour already.
  {
    id: 'js',
    emitter: 'emitJs',
    label: 'JS',
    lang: 'ts',
    formatted: false,
    code: scale => emitJs(scale),
    install: id => `import scale from '${PACKAGE_NAME}/${id}'`,
  },
]
