// The site's Japanese accents (ADR 0015): a combo's number in kanji, and a
// one-character name for each hue family. Decoration only — every one sits
// beside its English, never in place of it, and is hidden from assistive tech.

import type { HueFamily } from '../data/hue'

const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/**
 * A number from 1 to 999 in kanji, as it would be written on a page: `十二`,
 * `百十`, `三百四十八`. A leading one is dropped before 十 and 百, as it is in
 * ordinary writing.
 */
export function toKanji(n: number): string {
  const hundreds = Math.floor(n / 100)
  const tens = Math.floor(n / 10) % 10
  const ones = n % 10
  return [
    hundreds === 0 ? '' : `${hundreds === 1 ? '' : DIGITS[hundreds]}百`,
    tens === 0 ? '' : `${tens === 1 ? '' : DIGITS[tens]}十`,
    DIGITS[ones],
  ].join('')
}

/** One character per family: aka, daidai, ki, midori, ao, murasaki, hai (ash). */
export const HUE_KANJI: Record<HueFamily, string> = {
  red: '赤',
  orange: '橙',
  yellow: '黄',
  green: '緑',
  blue: '青',
  purple: '紫',
  neutral: '灰',
}

/** A representative dot for each family's chip. */
export const HUE_DOT: Record<HueFamily, string> = {
  red: '#e33d4a',
  orange: '#f08a2c',
  yellow: '#f5d038',
  green: '#5bb26a',
  blue: '#3f7fd6',
  purple: '#9a5bc9',
  neutral: '#a39e98',
}
