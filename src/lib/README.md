# colour-combos

Colour scales for the 348 combinations in Sanzo Wada's *A Dictionary of Color
Combinations*, one combo at a time, in the formats people build with.

Browse them at **[louislp.github.io/colour-combos](https://louislp.github.io/colour-combos/)**
and note the number of the one you want.

```sh
npm install colour-combos
```

## What a scale is

Every combo exports the same shape:

- **A ramp per colour.** Eleven steps, `50` to `950`, named after the Wada colour:
  `english-red-50` … `english-red-950`. One step holds the exact Wada hex,
  and the unsuffixed name (`english-red`) points at it.
- **A neutral ramp** tinted from the combo: `neutral-50` … `neutral-950`.
- **Role ramps** that alias the colour ramps by rank: `accent-*` is the
  combo's strongest colour, then `accent-2-*`, up to `accent-4-*`.
- **Semantic roles** for both light and dark: `canvas`, `surface`,
  `surface-muted`, `ink`, `ink-muted`, `border`, `border-strong`, and
  `accent`, `accent-text` and `on-accent` for each of up to three accents. Each
  combo has a canonical mode (the one the site shows it in), but both are
  exported.

Steps are placed by luminance, so contrast follows from distance alone, in
every ramp:

| Pairing | Contrast |
| --- | --- |
| any two steps 500 or more apart (`600` on `100`, `300` on `800`) | ≥ 4.5:1 |
| any two steps 400 or more apart | ≥ 3:1 |

Colour-named variables mean the same thing in every combo, so importing two
combos never gives one name two values. Role-named ones (`accent-*`,
`neutral-*`, the semantic roles) belong to whichever combo you import last.

## CSS custom properties

```css
@import 'colour-combos/42.css';

body {
  background: var(--cc-canvas);
  color: var(--cc-ink);
}
.button {
  background: var(--cc-accent);
  color: var(--cc-on-accent);
}
.tag {
  background: var(--cc-accent-100);
  color: var(--cc-accent-600);
}
```

The semantic roles are `light-dark()` pairs, so they follow `color-scheme`.
Set it on the page, or on any subtree with `data-theme`:

```html
<html style="color-scheme: light dark">
<section data-theme="dark">…</section>
```

## Tailwind v4

```css
@import 'tailwindcss';
@import 'colour-combos/tailwind/42.css';
```

```html
<body class="bg-cc-canvas text-cc-ink">
  <button class="bg-cc-accent text-cc-on-accent">Save</button>
  <span class="bg-cc-accent-100 text-cc-accent-600">New</span>
</body>
```

Every name carries a `cc-` prefix, so the combo's `neutral` ramp does not
replace Tailwind's. The semantic colours switch with `scheme-light` and
`scheme-dark`.

## SCSS

```scss
@use 'pkg:colour-combos/42.scss' as cc;
@use 'sass:map';

.button {
  background: cc.$cc-accent-500;
}
.card {
  // A fixed mode at compile time…
  background: map.get(cc.$cc-semantic, dark, 'surface');
  // …or both, as light-dark().
  color: cc.$cc-ink;
}
@each $step, $value in map.get(cc.$cc-ramps, 'neutral') {
  .bg-neutral-#{$step} {
    background: $value;
  }
}
```

`pkg:` URLs need Sass's Node package importer (`NodePackageImporter`). Without
it, use the path: `node_modules/colour-combos/scss/42.scss`.

## Design tokens (JSON)

`colour-combos/42.json` is in the W3C Design Tokens format, with hex values,
so Style Dictionary and Tokens Studio for Figma read it as is.

```js
import tokens from 'colour-combos/42.json' with { type: 'json' }

tokens.cc['accent'][500].$value // '{cc.yellow-ocher.500}', an alias
tokens.cc.semantic.dark.canvas.$value // '#…'
```

Each colour ramp's anchor step and the combo's canonical mode are under
`$extensions["io.github.louislp.colour-combos"]`.

## JavaScript and TypeScript

One combo, without the rest of the catalogue:

```ts
import scale from 'colour-combos/42'

scale.canonicalMode // 'light'
scale.ramps[0].steps[500].hex // '#…'
scale.ramps[0].anchor // the step holding the exact Wada hex
scale.semantic.dark.ink.oklch // [l, c, h]
```

Every colour carries `hex`, `oklch` and `rgb`.

The main entry has the whole catalogue, the scale engine and every format as a
function, for building your own output:

```ts
import { buildScale, COMBOS, emitCss, emitTokens, requireCombo } from 'colour-combos'

const scale = buildScale(requireCombo(42))
const css = emitCss(scale) // the same text as colour-combos/42.css
```

`emitTailwind`, `emitScss`, `emitTs` and `emitJs` are there too. They are what
generated the files above, and what the site shows in its code blocks.

The files are hex. `emitCss`, `emitTailwind` and `emitScss` take a `format` to
spell every colour as `oklch()` or `rgb()` instead; the names don't change:

```ts
emitCss(scale, { format: 'oklch' }) // --cc-english-red-500: oklch(… … …);
formatColour(scale.semantic.dark.ink, 'rgb') // 'rgb(… … …)'
```

## Credits

Colours from Sanzo Wada's *A Dictionary of Color Combinations* (1933–1937),
public domain; data via
[dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations)
by Matt DesLauriers (MIT). See `THIRD-PARTY-LICENSES.md`.

The package itself is MIT; see `LICENSE`.
