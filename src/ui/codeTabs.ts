// The dialog's code blocks: one tab per export format, each the exact text the
// package ships (ADR 0013 §1). Nothing here writes a colour — every block is an
// emitter's output, and the snippet above it is how to import that file.

import type { ComboScale } from '../lib/scale'
import type { CodeLang } from './highlight'
import { emitCss, emitJs, emitScss, emitTailwind, emitTokens, PACKAGE_NAME } from '../lib/emit'

export interface CodeTab {
  id: 'css' | 'tailwind' | 'scss' | 'json' | 'js'
  label: string
  /** The Shiki grammar. Tailwind's `@theme` is CSS, and JS reads fine as TS. */
  lang: CodeLang
  /** The block: an emitter's output, byte for byte. */
  code: (scale: ComboScale) => string
  /** How to import the package's copy of the file. */
  install: (id: number) => string
}

export const CODE_TABS: readonly CodeTab[] = [
  {
    id: 'css',
    label: 'CSS',
    lang: 'css',
    code: scale => emitCss(scale),
    install: id => `import '${PACKAGE_NAME}/${id}.css'`,
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    lang: 'css',
    code: scale => emitTailwind(scale),
    install: id => `@import '${PACKAGE_NAME}/tailwind/${id}.css';`,
  },
  {
    id: 'scss',
    label: 'SCSS',
    lang: 'scss',
    code: scale => emitScss(scale),
    install: id => `@use 'pkg:${PACKAGE_NAME}/${id}.scss' as cc;`,
  },
  {
    id: 'json',
    label: 'JSON',
    lang: 'json',
    code: scale => emitTokens(scale),
    install: id => `import tokens from '${PACKAGE_NAME}/${id}.json' with { type: 'json' }`,
  },
  {
    id: 'js',
    label: 'JS',
    lang: 'ts',
    code: scale => emitJs(scale),
    install: id => `import scale from '${PACKAGE_NAME}/${id}'`,
  },
]
