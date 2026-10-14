<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useHubSearch } from '../composables/useHubSearch'
import { carryHubSearch, COMBO_ROUTE, toHubQuery } from '../routing/search'
import ComboIdentity from './ComboIdentity.vue'
import FavoritesLink from './FavoritesLink.vue'
import LiveAnnouncer from './LiveAnnouncer.vue'
import NotFoundNotice from './NotFoundNotice.vue'
import SiteFooter from './SiteFooter.vue'
import ThemeStyle from './ThemeStyle'

/**
 * The one layout both routes share (ADR 0004 §2). Every link carries the search
 * params across, so the selected combo, query and filter survive the move
 * between `/` and `/favorites`.
 *
 * The header carries the site identity — a wordmark in `--ink` and the nav — over
 * T2's 4px accent rule (ADR 0009). The identity band sits just below, inside
 * `main` so it can butt flush under that rule (ADR 0010).
 */
const search = useHubSearch()
const route = useRoute()
</script>

<template>
  <ThemeStyle />
  <header class="site-header">
    <div class="site-header-inner">
      <!-- Identity, in `--ink`: the serif mark plus a quiet provenance line.
           Links home, carrying the search params like every other link. -->
      <RouterLink :to="{ path: '/', query: toHubQuery(carryHubSearch(search)) }" class="wordmark">
        <span class="wordmark-mark">Colour Combos</span>
        <span class="wordmark-sub">Sanzo Wada · 1933</span>
      </RouterLink>
      <nav class="site-nav" aria-label="Primary">
        <RouterLink :to="{ path: '/', query: toHubQuery(carryHubSearch(search)) }">
          Browse
        </RouterLink>
        <FavoritesLink />
      </nav>
    </div>
  </header>
  <main>
    <!-- The active combo, shown large and raw (ADR 0009, refined in ADR 0010).
         Shared chrome, so it lives here above both routes rather than inside a
         page, and reads the combo from the URL like everything else. The
         combo page has a bigger header of its own, so it stands down there. -->
    <ComboIdentity v-if="route.name !== COMBO_ROUTE" />
    <!-- Above the outlet, not inside a page: the resolution it explains
         happened in the router guard, and it has to survive the move between
         `/` and `/favorites` that a bad link's recipient might make. -->
    <NotFoundNotice />
    <RouterView />
  </main>
  <SiteFooter />
  <!-- The one live region: copies and stars made from the keyboard speak here
       (ADR 0014 §5). -->
  <LiveAnnouncer />
</template>

<style scoped>
/* The site chrome shares one 78rem measure with `main` and the footer, so the
   wordmark, the nav, the band, the grid and the credit all hang off the same
   left edge (ADR 0010).

   A bold 4px `--accent` rule across the very top edge carries the combo's colour
   into the chrome before any content is read (T2, ADR 0009). It is a boundary,
   not text, and `--accent` clears 3:1 on `--surface` by contract, so it stays a
   legal decorative edge in every rendering. */
.site-header {
  background: var(--surface);
  border-block-start: 4px solid var(--accent);
  border-block-end: 1px solid var(--border);
  transition:
    background-color var(--dur-theme) var(--ease),
    border-color var(--dur-theme) var(--ease),
    color var(--dur-theme) var(--ease);
}

.site-header-inner,
main {
  inline-size: 100%;
  max-inline-size: 78rem;
  margin-inline: auto;
}

.site-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
}

/* The wordmark is the site's identity: the serif mark is the one editorial
   voice, the sub a quiet dataset-provenance line. It stays in `--ink` — identity,
   not the active combo — so the accent keeps meaning exactly one thing across the
   chrome: the combo (the top rule, the band eyebrow, the current-route
   underline) (ADR 0010 §4). */
.wordmark {
  display: inline-flex;
  flex-direction: column;
  gap: 0.1rem;
  color: var(--ink);
  text-decoration: none;
  line-height: 1.05;
}

.wordmark-mark {
  font-family: var(--serif);
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.wordmark-sub {
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.site-nav {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  font-size: var(--text-sm);
}

/* `FavoritesLink`'s root `<a>` inherits this component's scope, so one rule
   covers both nav links. */
.site-nav a {
  color: var(--ink);
  text-decoration: none;
  padding-block: 0.2rem;
  border-block-end: 2px solid transparent;
  transition: border-color var(--dur-fast) var(--ease);
}

/* The active route wears the accent as an underline (T2, ADR 0009 §2). It is an
   accent boundary and clears 3:1 on `--surface` by contract, so the marker is
   AA-safe in every combo. */
.site-nav a[aria-current='page'] {
  border-block-end-color: var(--accent);
}

@media (hover: hover) {
  .site-nav a:hover:not([aria-current='page']) {
    border-block-end-color: var(--border-strong);
  }
}

main {
  flex: 1;
  padding: var(--space-xl) var(--space-lg) 7rem;
}
</style>
