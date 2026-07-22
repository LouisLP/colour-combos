// The custom-property *names*, and nothing else (ADR 0005 §8).
//
// What is emitted here is exactly what CSS cannot compute: the hue source the
// stylesheet's relative-colour ramp derives every neutral from, and the roles
// whose value is the result of a contrast *search* (ADR 0002 §6). The neutral
// ramp itself is not emitted — it lives in `index.css`, declaratively.

import type { Palette } from './adapt'

/** Suffixes of the three accent ranks, in order. */
const RANKS = ['', '-2', '-3'] as const

/** The three tokens each accent rank carries, named as the adapter names them. */
const ACCENT_TOKENS = [
  (rank: string) => `accent${rank}`,
  (rank: string) => `accent${rank}-text`,
  (rank: string) => `on-accent${rank}`,
]

/**
 * The palette as a custom-property block, for `ThemeStyle` to render into a
 * `<style>` element.
 *
 * Every value is a machine-generated hex produced by the adapter from committed
 * numeric data, so the string is safe by construction — no user input reaches it
 * (ADR 0005 §2).
 */
export function paletteToCss(palette: Palette): string {
  const decls = [
    `--hue-source:${palette.hueSourceColour.hex}`,
    // Zero collapses the whole ramp to true greys, which is both the achromatic
    // combo and the pre-hydration token baseline (ADR 0001 §6).
    `--tint-scale:${palette.tinted ? 1 : 0}`,
    // A clamp result, not a point on the ladder: `--border` pushed until it
    // clears 3:1 on the canvas. It moves in all 696 renderings of the
    // catalogue, so relative colour cannot express it and the runtime owns it.
    `--border-strong:${palette.roles['border-strong'].hex}`,
  ]

  // A 2-colour combo fills every accent slot by repeating a lower rank rather
  // than rendering a role empty (ADR 0002 §3), so no accent token ever falls
  // through to the achromatic baseline while a combo is selected.
  let filled: string[] = []
  for (const rank of RANKS) {
    const present = ACCENT_TOKENS.map(name => palette.roles[name(rank)]?.hex)
    if (present.every(hex => hex !== undefined))
      filled = present as string[]

    ACCENT_TOKENS.forEach((name, i) => decls.push(`--${name(rank)}:${filled[i]}`))
  }

  return `${decls.join(';')};`
}
