import { defineComponent, h } from 'vue'
import { useSelectedCombo } from '../composables/useSelectedCombo'
import { adapt, comboMode } from '../theme/adapt'
import { paletteToCss } from '../theme/tokens'

/**
 * The palette, *rendered* rather than written (ADR 0005 §2). The style lands in
 * the same patch as the tree that consumes it, so there is no window in which
 * markup exists under the wrong palette, and nothing here touches the DOM.
 *
 * A render function rather than an SFC: Vue's template compiler drops a
 * `<style>` tag in a template, since there it is almost always a mistake. Here
 * it is the whole point.
 *
 * This is the only caller of `adapt()` in the app. No `computed`: the adapter
 * memoises by `id:mode`, so after the first render for a pair this is a map
 * lookup (ADR 0005 §3).
 *
 * Mode is combo-owned (ADR 0008): the selected combo decides light or dark, so
 * `color-scheme` is emitted here alongside the palette rather than primed by a
 * head script. It rides in the same `:root` block, wins over the
 * `color-scheme: light dark` baseline in `index.css` by source order, and feeds
 * every `light-dark()` in the ramp. Nothing is knowable before this style
 * exists — the bare `/` picks its random combo in JS — so the achromatic token
 * baseline renders under that mode-agnostic scheme until the first render.
 */
export default defineComponent({
  name: 'ThemeStyle',
  setup() {
    const combo = useSelectedCombo()

    return () => {
      const mode = comboMode(combo.value)
      return h('style', `:root{color-scheme:${mode};${paletteToCss(adapt(combo.value, mode))}}`)
    }
  },
})
