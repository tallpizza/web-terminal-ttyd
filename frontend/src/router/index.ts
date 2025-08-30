import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: 'Web Terminal'
    }
  },
  {
    path: '/sessions',
    name: 'sessions',
    component: () => import('../views/SessionsView.vue'),
    meta: {
      title: 'Sessions - Web Terminal'
    }
  },
  {
    path: '/session/:id',
    name: 'session',
    component: () => import('../views/SessionView.vue'),
    meta: {
      title: 'Terminal Session'
    },
    props: true
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      title: 'Settings - Web Terminal'
    }
  },
  {
    path: '/keyboard',
    name: 'keyboard',
    component: () => import('../views/KeyboardView.vue'),
    meta: {
      title: 'Virtual Keyboard - Web Terminal'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: '404 - Not Found'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Update page title on route change
router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || 'Web Terminal'
  next()
})

export default router