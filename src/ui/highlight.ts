// Shiki for the dialog's code blocks: core, JS regex engine (no WASM), four
// grammars, one theme. Only loaded by dynamic `import()`.

import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

export type CodeLang = 'css' | 'scss' | 'json' | 'ts'

/** One dark theme. `highlight.test.ts` checks its tokens clear 4.5:1. */
export const THEME = 'github-dark-default'

let highlighter: Promise<HighlighterCore> | undefined

function load(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [
      import('shiki/langs/css.mjs'),
      import('shiki/langs/scss.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/typescript.mjs'),
    ],
    themes: [import('shiki/themes/github-dark-default.mjs')],
  })
  return highlighter
}

/** Highlighted HTML whose text content is `code`, byte for byte. */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  return (await load()).codeToHtml(code, { lang, theme: THEME })
}
