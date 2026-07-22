# Scrape target audit & combo data schema

Research for [#2](https://github.com/LouisLP/colour-combos/issues/2) (part of [#1](https://github.com/LouisLP/colour-combos/issues/1)). Investigated 2026-07-22 against live pages and primary sources.

## TL;DR

**Do not scrape `wada-sanzo-colors.com`.** Its Terms of Service explicitly prohibit automated scraping, extraction of the colour data for redistribution, and building "competing color palette products" from it — which is exactly what this project is. The site is a commercial product (Stripe, Free/Pro tiers, paid Seasons collection).

**Use `mattdesl/dictionary-of-colour-combinations` instead** (MIT). It is a clean, complete digitisation of the same public-domain source, includes name + hex + rgb + **lab** + cmyk per colour, and matches the site's data almost exactly (323/348 combos byte-identical in hex; mean per-channel delta 0.5/255).

**Cost of the switch: 348 combos instead of 360.** The 12 extras (ids 349–360) are the site's own additions and are not in any open dataset. Recommend v1 ships 348 and the map's "~360 classic combos" is restated as **348**.

---

## 1. Scrape target audit — what the site actually exposes

Findings from `curl` against the live pages (no JS execution needed; Next.js App Router, server-rendered).

### `/combinations/classic/all` (1.1 MB, single page, no pagination)

- Exactly **360** combos, ids **1–360**, contiguous, no gaps.
- Each card is `<a href="/combination/classic/{id}">` containing one `<div style="background-color:#rrggbb">` per colour.
- **1081 swatches, 159 unique hex values.**
- Size distribution: **120×2, 120×3, 119×4, 1×5**.
- Colour **names are not on the index page** — hex only. Names require the detail pages.

### `/combination/classic/{id}`

- Per colour, the SSR markup gives:
  - **hex** — from the inline `style="background-color:#d96629"`
  - **name** — `<p class="CombinationDetail_colorName__…">English Red</p>`
  - **slug** — from `href="/color-detail/english-red"`
- The `<title>` redundantly lists the names: `Combination 1: English Red, Cerulean Blue | Wada Sanzo Colors`.
- **RGB and LAB are NOT in the markup.** The page renders three buttons labelled `HEX` / `RGB` / `LAB` — these are copy-to-clipboard controls; the numeric values are computed client-side. Same on `/color-detail/{slug}`. So the issue's premise that LAB is "exposed in the markup" is **false** — a scraper would have to either execute JS or hit the API.
- The Next.js flight payload on a combo page is only ~15 KB and carries no colour data.

### Answers to the issue's factual questions

| Question | Answer |
|---|---|
| How many combos really? | **360** on this site. The book itself / open datasets have **348**. |
| Is HEX reliably extractable for every colour of every combo? | **Yes** — 1081/1081 swatches carry an inline hex. |
| Is combo size derivable? | **Yes** — count swatches per card. But it is **2/3/4/5**, not 2/3/4. |
| RGB? | Not in markup; trivially derived from hex anyway. |
| LAB? | **Not in markup.** Client-side only. Would need JS execution or the disallowed API. |

### The 5-colour combo

`/combination/classic/250` is genuinely five colours — *Pyrite Yellow, Peach Red, Artemisia Green, Sea Green, Nile Blue* (`#cab356 #f15a30 #709390 #00b49b #bce4e5`). The open datasets have the same combo with **four** (no Artemisia Green). Whichever source is chosen, **the schema must not hard-code a 2–4 union type.**

---

## 2. Legal — why scraping is off the table

`robots.txt` is permissive for `/combination*` and `/combinations*` (it only disallows `/api/`, `/profile`, `/favorites`, `/unlock-validation`). **robots.txt is not the binding constraint here — the ToS is.**

From [`/terms`](https://www.wada-sanzo-colors.com/terms) (effective 2026-05-18), §7 *License Grant* — "You may not":

> - Resell, redistribute, or share the color palettes with others
> - Claim the palettes as your own original work
> - **Create competing color palette products or services using this data**
> - **Reverse-engineer or extract the color data for redistribution**
> - **Use automated tools to scrape or download the content**
> - Reproduce, duplicate, or copy the compiled dataset for any purpose other than personal use

And §13 *Prohibited Conduct*: "Use automated tools to scrape data".

All four bolded clauses are hit by the plan in #1 (scrape → commit JSON → publicly deployed combo-browsing site). This is not a rate-limit question to be solved with polite delays; the activity itself is prohibited.

### The important nuance — the underlying data is public domain

§8 of the same ToS concedes the provenance:

> The color palettes are derived from Haishoku Soukan, Haishoku Soukan B-hen, Gohyaku-sen Shinsaku Zuanshu and related works by Wada Sanzo, published in 1933–1937. These original publications entered the public domain in Japan on December 31, 2017 (50 years after the author's death in 1967) and are in the public domain in the United States. The source materials are digitized by the National Diet Library (and other libraries) and released as public domain on Wikimedia Commons.

They claim rights only over "our specific digital compilation, conversion process, and platform organization". So: **the Wada colours are free; *their particular digitisation* is what's restricted.** Take the same public-domain data from a source that licenses it to us, and there is no conflict.

**Rate limits:** not measured — deliberately, since we are not scraping. The audit above cost 5 page fetches.

---

## 3. The recommended source

### `mattdesl/dictionary-of-colour-combinations` — **MIT**, 481★

Single file: [`colors.json`](https://raw.githubusercontent.com/mattdesl/dictionary-of-colour-combinations/master/colors.json). **159 colours**, 159 unique hexes. Colour-keyed, with combos as an inverted index:

```json
{
  "name": "Hermosa Pink",
  "combinations": [176, 227, 273],
  "swatch": 0,
  "cmyk": [0, 30, 6, 0],
  "lab": [83.427, 22.136, 1.638],
  "rgb": [249, 193, 206],
  "hex": "#f9c1ce"
}
```

Inverting `combinations` yields **348 combos, ids 1–348**, sizes **120×2, 120×3, 108×4** — no degenerate singletons, no 5s.

**The LAB is real reference data, not a re-derivation of the hex.** Converting hex→Lab(D65) and comparing to the stored values gives a median component delta of 1.73 and a max of 19.6 — i.e. the `lab` came from the CMYK swatches through an ICC profile (the repo ships `sRGB IEC61966-2.1.icc` and `U.S. Web Coated (SWOP) v2.icc` and an `augment_sanzo.py`), and the `hex` is the sRGB rendering of it. Worth keeping both.

### Fidelity vs. the site

Comparing ids 1–348, dataset vs. scraped site markup:

- **347/348** combos same size (only #250 differs — site has 5, dataset 4).
- **323/348** byte-identical hex sequences.
- Across all size-matched colours: **mean per-channel delta 0.5/255**, max 26, only **1.8%** of channels off by more than 16.

Divergences are a handful of individual colours with slightly different CMYK→sRGB conversions — e.g. Citrine `#b09f36` (dataset) vs `#a49531` (site), Diamine Green `#1a7444` vs `#008842`. Neither is "wrong"; they are different renderings of the same printed swatch. Note also minor name spelling drift: dataset "Cerulian Blue" / "Artemesia Green" vs site "Cerulean Blue" / "Artemisia Green" — we may want a small normalisation pass.

### Rejected alternative: `dblodorn/sanzo-wada` (MIT, 319★)

Same lineage but dirtier: `apps/sanzo-wada-alpha/assets/colors.json` has **157** colours, **no `lab` field**, and inverting its index yields 10 combos with only a single colour. `mattdesl` is the cleaned, LAB-augmented descendant. Use it instead.

---

## 4. Schema decision

Store **combo-keyed** (the app's primary access pattern is "give me combo N"), with colours denormalised inline. The upstream colour-keyed shape is inverted once at build time.

```ts
/** A single Wada colour, denormalised into each combo that uses it. */
export interface ComboColour {
  /** Stable 1-based index into the 159-colour classic palette. */
  readonly index: number
  /** e.g. "Hermosa Pink" */
  readonly name: string
  /** URL-safe form of `name`, e.g. "hermosa-pink". */
  readonly slug: string
  /** Lowercase 7-char sRGB hex, e.g. "#f9c1ce". Always present. */
  readonly hex: `#${string}`
  readonly rgb: readonly [r: number, g: number, b: number]
  /** CIELAB from the source CMYK via ICC — not derived from `hex`. */
  readonly lab: readonly [l: number, a: number, b: number]
  readonly cmyk: readonly [c: number, m: number, y: number, k: number]
}

export interface Combo {
  /** 1-based, matches the source dataset's combination id. Stable — used in share URLs. */
  readonly id: number
  /** Derived: `colours.length`. Do NOT type as 2 | 3 | 4. */
  readonly size: number
  readonly colours: readonly ComboColour[]
}

export interface ComboDataset {
  readonly combos: readonly Combo[]
  /** The 159 unique colours, for the palette/filter views. */
  readonly colours: readonly ComboColour[]
  readonly attribution: string
  readonly source: { readonly name: string, readonly url: string, readonly licence: 'MIT' }
}
```

Notes on the decisions:

- **`size` is `number`, not `2 | 3 | 4`.** Combo #250 already proves the union would be wrong, and a narrow literal type would make the dataset unswappable if we later add the site's 12 extras or the Seasons volume. Filter UI can still offer 2/3/4 as buckets.
- **No `sourceUrl` per combo.** The issue proposed one, but the data no longer comes from a per-combo page — there is nothing meaningful to link to per combo. A single dataset-level `source` replaces it. (If we ever want a "see this combo elsewhere" link, `https://www.wada-sanzo-colors.com/combination/classic/{id}` is valid for ids 1–348 and points at the same combo — linking is fine, copying is not.)
- **Attribution is dataset-level, not per combo** — it is identical for all 348.
- **`hex` is the render-critical field** and is guaranteed non-null; `lab` is what the theming work in #1 will actually want for contrast/lightness reasoning, so it is worth carrying even though it looks redundant next to `rgb`.
- Kept `cmyk` because it is free and is the most faithful record of the printed original.

### Where it lives, and how it is produced

```
scripts/build-combos.ts        # one-off-ish: reads vendored upstream → emits the JSON
src/data/combos.json           # generated, COMMITTED
src/data/combos.ts             # typed re-export: `import combos from './combos.json'`
src/data/README.md             # provenance + regeneration instructions
```

**Commit the generated JSON.** Reasons: the upstream is a static historical dataset that will never change; the full 348 combos denormalised minifies to **153 KB** of JSON (measured, and 17 KB gzipped — well under any bundling concern, and trivially code-splittable); it keeps the build hermetic with no network dependency in CI; and it makes the data reviewable in diffs. The script is checked in so the derivation is reproducible and auditable, but it is **not** wired into `npm run build` — it is run manually and its output reviewed.

Prefer **vendoring** upstream `colors.json` into `scripts/vendor/` (with its MIT `LICENSE.md`) over an npm dependency, so the build has no runtime fetch and the exact bytes we derived from are pinned in git.

### Attribution string to display

MIT requires the copyright notice be reproduced. Suggested footer/about text:

> Colours from Sanzo Wada's *A Dictionary of Color Combinations* (1933–1937), public domain. Data via [dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations) by Matt DesLauriers (MIT). Source volumes digitised by the National Diet Library.

Plus the full MIT text in `src/data/README.md` (or a `THIRD-PARTY-LICENSES` file).

---

## 5. Consequences for the map (#1)

1. **"~360 classic combos" → 348.** Worth an explicit call, since it changes grid counts and any copy that names a number.
2. **Sourcing approach changes from "scrape" to "vendor an MIT dataset."** This removes the scraper from the build plan entirely — issue #1's phrasing "data scraped from wada-sanzo-colors.com" should be amended. It also removes rate-limiting, retry, and HTML-parsing-fragility risk from the project.
3. **`size` must stay open.** Don't let a 2|3|4 union in.
4. **The 12 extra combos are not obtainable** under acceptable terms. If they turn out to matter, the route is the public-domain scans on Wikimedia Commons / NDL, not the site.
5. **LAB is available**, which unblocks the contrast/adaptation-model work in #1 without needing a colour-conversion step first.

## Open questions

- Do we want the name-spelling normalisation ("Cerulian" → "Cerulean")? The dataset's spellings are arguably the book's; the site's are modernised. Low stakes, but pick one before slugs get baked into share URLs.
- Seasons collection (vol. 2) is out of scope for v1 — worth noting no comparable open dataset was found for it, so that scope boundary may be permanent rather than a deferral.

## Sources

- `https://www.wada-sanzo-colors.com/combinations/classic/all`, `/combination/classic/{1,250}`, `/color-detail/english-red`, `/robots.txt`, `/terms` — fetched 2026-07-22
- `https://github.com/mattdesl/dictionary-of-colour-combinations` (MIT, © 2020 Matt DesLauriers)
- `https://github.com/dblodorn/sanzo-wada` (MIT)
