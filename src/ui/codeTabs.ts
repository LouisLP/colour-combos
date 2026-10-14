// One tab per export format, each the exact text the package ships (ADR 0013 §1).

import type { ExportFormat } from '../lib/emit'
import type { ComboScale } from '../lib/scale'
import type { CodeLang } from './highlight'
import { EXPORT_FORMATS, importStatementFor } from '../lib/emit'

export interface CodeTab {
  id: ExportFormat['id']
  label: string
  /** The Shiki grammar. */
  lang: CodeLang
  /** The block: an emitter's output, byte for byte. */
  code: (scale: ComboScale) => string
  /** How to import the package's copy of the file. */
  install: (id: number) => string
}

/** Tailwind's `@theme` is CSS, and JS reads fine as TS. */
const TAB: Record<ExportFormat['id'], Pick<CodeTab, 'label' | 'lang'>> = {
  css: { label: 'CSS', lang: 'css' },
  tailwind: { label: 'Tailwind', lang: 'css' },
  scss: { label: 'SCSS', lang: 'scss' },
  json: { label: 'JSON', lang: 'json' },
  js: { label: 'JS', lang: 'ts' },
}

export const CODE_TABS: readonly CodeTab[] = EXPORT_FORMATS.map(format => ({
  id: format.id,
  ...TAB[format.id],
  code: format.emit,
  install: id => importStatementFor(format, id),
}))
