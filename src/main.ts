import { createApp } from 'vue'
import { createWebHistory, RouterView } from 'vue-router'
import { createHubRouter } from './routing/router'
import './index.css'

/** History base is Vite's `base` (ADR 0004 §9). Tests use a memory history. */
const router = createHubRouter(createWebHistory(import.meta.env.BASE_URL))

createApp(RouterView).use(router).mount('#root')
