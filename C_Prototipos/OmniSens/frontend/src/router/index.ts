import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import DeviceManagerView from '../views/DeviceManagerView.vue'
import RulesEngineView from '../views/RulesEngineView.vue'
import BillingView from '../views/BillingView.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginView },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: 'dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: DashboardView },
      { path: 'analytics', name: 'Analytics', component: AnalyticsView },
      { path: 'devices', name: 'Devices', component: DeviceManagerView },
      { path: 'rules', name: 'Rules', component: RulesEngineView },
      { path: 'billing', name: 'Billing', component: BillingView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated()) {
    next('/')
  } else {
    next()
  }
})

export default router
