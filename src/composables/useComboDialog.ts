import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { COMBO_COUNT, getCombo } from '../data/combos'
import { toHubQuery } from '../routing/search'
import { useHubSearch } from './useHubSearch'

/**
 * Whether we pushed the open dialog. If so, closing goes Back, so Back after
 * closing doesn't reopen it. A shared link has no entry of ours, so it replaces.
 */
let pushed = false

/** The details dialog, driven by `?c=` (ADR 0015). Opening is a navigation. */
export function useComboDialog() {
  const router = useRouter()
  const search = useHubSearch()

  const combo = computed(() => search.value.c === undefined ? undefined : getCombo(search.value.c))

  // Closed some other way, so the next close isn't ours to undo.
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

  /** Step through the catalogue, wrapping. Replaces, so it's still one entry. */
  function step(delta: 1 | -1) {
    const c = search.value.c
    if (c === undefined)
      return
    const next = ((c - 1 + delta + COMBO_COUNT) % COMBO_COUNT) + 1
    void router.replace({ query: toHubQuery({ ...search.value, c: next }) })
  }

  return { combo, open, close, step }
}
