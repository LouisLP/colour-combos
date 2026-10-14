// Syntax highlighting for the combo page's code blocks. Shiki, fine-grained:
// the core, the JavaScript regex engine (no WASM), four grammars and two
// themes. Never imported statically — `CodeBlocks` loads this module with a
// dynamic `import()`, so none of it is in the initial bundle.

import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

export type CodeLang = 'css' | 'scss' | 'json' | 'ts'

/**
 * GitHub's default pair. Both clear 4.5:1 for every token colour they put on
 * our emitters' output against their own background; `highlight.test.ts`
 * checks it, since a block is part of the page's AA promise.
 */
export const THEMES = { light: 'github-light-default', dark: 'github-dark-default' } as const

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
    themes: [
      import('shiki/themes/github-light-default.mjs'),
      import('shiki/themes/github-dark-default.mjs'),
    ],
  })
  return highlighter
}

/**
 * The code as highlighted HTML, carrying both themes as custom properties
 * (`--shiki-light`, `--shiki-dark`, and their `-bg`) rather than one colour, so
 * the stylesheet picks with `light-dark()` and the block follows the combo's
 * mode without highlighting twice.
 *
 * The text content of the result is `code`, byte for byte: Shiki escapes it and
 * wraps it, and adds nothing.
 */
export async function highlight(code: string, lang: CodeLang): Promise<string> {
  return (await load()).codeToHtml(code, { lang, themes: THEMES, defaultColor: false })
}
