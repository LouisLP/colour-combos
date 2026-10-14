// Every export format the package ships: its emitter, where its file lives, the
// specifier that loads it, and how to import it. The build, the smoke test and
// the dialog all read this, so they can't disagree (ADR 0013).

import type { ComboScale } from '../scale'
import { emitCss } from './css'
import { emitDts, emitJs } from './module'
import { emitScss } from './scss'
import { PACKAGE_NAME } from './shared'
import { emitTailwind } from './tailwind'
import { emitTokens } from './tokens'

type Emit = (scale: ComboScale) => string

export interface ExportFormat {
  id: 'css' | 'tailwind' | 'scss' | 'json' | 'js'
  /** The public subpath; `*` is the combo id. */
  subpath: string
  /** The file in the package that subpath maps to. */
  file: string
  emit: Emit
  /** A declaration file shipped beside it. */
  types?: { file: string, emit: Emit }
  /** The import statement, given the full specifier. */
  importStatement: (specifier: string) => string
}

export const EXPORT_FORMATS: readonly ExportFormat[] = [
  {
    id: 'css',
    subpath: '*.css',
    file: 'css/*.css',
    emit: emitCss,
    importStatement: s => `import '${s}'`,
  },
  {
    id: 'tailwind',
    subpath: 'tailwind/*.css',
    file: 'tailwind/*.css',
    emit: emitTailwind,
    importStatement: s => `@import '${s}';`,
  },
  {
    id: 'scss',
    subpath: '*.scss',
    file: 'scss/*.scss',
    emit: emitScss,
    importStatement: s => `@use 'pkg:${s}' as cc;`,
  },
  {
    id: 'json',
    subpath: '*.json',
    file: 'tokens/*.json',
    emit: emitTokens,
    importStatement: s => `import tokens from '${s}' with { type: 'json' }`,
  },
  {
    id: 'js',
    subpath: '*',
    file: 'scales/*.js',
    emit: emitJs,
    types: { file: 'scales/*.d.ts', emit: emitDts },
    importStatement: s => `import scale from '${s}'`,
  },
]

/** The specifier that loads one combo in a format: `japanese-colour-combos/42.css`. */
export const specifierFor = (format: ExportFormat, id: number) => `${PACKAGE_NAME}/${format.subpath.replace('*', String(id))}`

/** How to import one combo in a format. */
export const importStatementFor = (format: ExportFormat, id: number) => format.importStatement(specifierFor(format, id))
