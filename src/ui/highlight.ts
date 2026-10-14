// Syntax highlighting for the dialog's code blocks. Shiki, fine-grained: the
// core, the JavaScript regex engine (no WASM), four grammars and one theme.
// Never imported statically — `CodeBlocks` loads this module with a dynamic
// `import()`, so none of it is in the initial bundle.

import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

export type CodeLang = 'css' | 'scss' | 'json' | 'ts'

/**
 * The site is dark only (ADR 0015), so one theme. Every token colour it puts on
 * our emitters' output clears 4.5:1 on its background; `highlight.test.ts`
 * checks it.
 */
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

/**
 * The code as highlighted HTML. Its text content is `code`, byte for byte:
 * Shiki escapes it and wraps it, and adds nothing.
 */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  return (await load()).codeToHtml(code, { lang, theme: THEME })
}
