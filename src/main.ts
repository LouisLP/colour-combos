import { createApp } from 'vue'
import { createWebHistory, RouterView } from 'vue-router'
import { createHubRouter } from './routing/router'
import './index.css'

/**
 * The history base is Vite's `base`, so the app is mounted wherever it is
 * served from — `/colour-combos/` on a GitHub project page, `/` anywhere else —
 * and every `<RouterLink>` and every match resolves against the same prefix the
 * assets do (ADR 0004 §9). Tests build their own router on a memory history,
 * which is why the history is chosen here and not in the factory.
 */
const router = createHubRouter(createWebHistory(import.meta.env.BASE_URL))

createApp(RouterView).use(router).mount('#root')
