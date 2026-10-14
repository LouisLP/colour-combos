import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { COMBO_COUNT, getCombo } from '../data/combos'
import { toHubQuery } from '../routing/search'
import { useHubSearch } from './useHubSearch'

/**
 * Whether the open dialog was pushed by a click here. If so, closing it is
 * Back — the history entry goes away again and Back after closing leaves the
 * site rather than reopening it. A dialog that arrived on a shared link has no
 * entry of ours behind it, so closing replaces. Module-level: there is one
 * dialog and one history.
 */
let pushed = false

/**
 * The details dialog (ADR 0015), driven by `?c=`. Opening it is a navigation, so
 * a dialog is shareable and Back closes it; the grid behind it reads only `q` and
 * `hue`, so it does not re-render.
 */
export function useComboDialog() {
  const router = useRouter()
  const search = useHubSearch()

  const combo = computed(() => search.value.c === undefined ? undefined : getCombo(search.value.c))

  // Back (or anything else) closed it: the next close is no longer ours to undo.
  watch(() => search.value.c, (c) => {
    if (c === undefined)
      pushed = false
  })

  function open(id: number) {
    pushed = true
    void router.push({ query: toHubQuery({ ...search.value, c: id }) })
  }

  function close() {
    if (search.value.c === undefined)
      return
    if (pushed) {
      pushed = false
      router.back()
    }
    else {
      void router.replace({ query: toHubQuery({ ...search.value, c: undefined }) })
    }
  }

  /** Step through the catalogue, wrapping at both ends. Replaces: one dialog, one entry. */
  function step(delta: 1 | -1) {
    const c = search.value.c
    if (c === undefined)
      return
    const next = ((c - 1 + delta + COMBO_COUNT) % COMBO_COUNT) + 1
    void router.replace({ query: toHubQuery({ ...search.value, c: next }) })
  }

  return { combo, open, close, step }
}
