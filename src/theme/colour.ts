// Minimal colour maths, no dependency.
// sRGB <-> OKLCh, sRGB gamut mapping, WCAG 2.2 contrast.

export interface Oklch { l: number, c: number, h: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    Number.parseInt(h.slice(0, 2), 16) / 255,
    Number.parseInt(h.slice(2, 4), 16) / 255,
    Number.parseInt(h.slice(4, 6), 16) / 255,
  ]
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  const to = (x: number) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

const toLinear = (x: number) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
const toGamma = (x: number) => x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055

export function rgbToOklch([r, g, b]: [number, number, number]): Oklch {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  const c = Math.hypot(A, B)
  let h = (Math.atan2(B, A) * 180) / Math.PI
  if (h < 0)
    h += 360
  return { l: L, c, h }
}

function oklchToRgbRaw({ l: L, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const A = c * Math.cos(hr)
  const B = c * Math.sin(hr)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3
  return [
    toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ]
}

const inGamut = (rgb: number[]) => rgb.every(x => x >= -0.0005 && x <= 1.0005)

/** Reduce chroma (hue + lightness held) until the colour fits sRGB. */
export function oklchToRgb(col: Oklch): [number, number, number] {
  if (inGamut(oklchToRgbRaw(col)))
    return oklchToRgbRaw(col).map(clamp01) as [number, number, number]
  let lo = 0
  let hi = col.c
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (inGamut(oklchToRgbRaw({ ...col, c: mid })))
      lo = mid
    else hi = mid
  }
  return oklchToRgbRaw({ ...col, c: lo }).map(clamp01) as [number, number, number]
}

export const oklchToHex = (col: Oklch) => rgbToHex(oklchToRgb(col))
export const hexToOklch = (hex: string) => rgbToOklch(hexToRgb(hex))

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export interface ClampResult {
  hex: string
  ratio: number
  /** How far lightness had to move, in OKLCh L units. 0 means untouched. */
  shifted: number
  /** False when the lightness rail was hit before the target was cleared. */
  reached: boolean
}

/**
 * Push lightness toward `direction` (-1 darker, +1 lighter), hue and nominal
 * chroma held, until `col` clears `target` against `against`. Returns the first
 * passing value, or the extreme if the target is unreachable.
 */
export function clampToContrast(
  col: Oklch,
  against: string,
  target: number,
  direction: -1 | 1,
): ClampResult {
  const start = col.l
  const limit = direction === -1 ? 0 : 1
  let best = { hex: oklchToHex(col), ratio: contrast(oklchToHex(col), against), l: start }
  if (best.ratio >= target)
    return { hex: best.hex, ratio: best.ratio, shifted: 0, reached: true }
  const steps = 100
  for (let i = 1; i <= steps; i++) {
    const l = start + ((limit - start) * i) / steps
    const hex = oklchToHex({ ...col, l })
    const ratio = contrast(hex, against)
    if (ratio > best.ratio)
      best = { hex, ratio, l }
    if (ratio >= target)
      return { hex, ratio, shifted: Math.abs(l - start), reached: true }
  }
  return { hex: best.hex, ratio: best.ratio, shifted: Math.abs(best.l - start), reached: false }
}

/** `contrast-color()` fallback: whichever of black/white wins against `bg`. */
export function onColour(bg: string): string {
  return contrast(bg, '#ffffff') >= contrast(bg, '#000000') ? '#ffffff' : '#000000'
}
