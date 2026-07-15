import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'booking', component: () => import('@/pages/booking/BookingPage.vue'), meta: { title: '记账' } },
  { path: '/accounts', name: 'accounts', component: () => import('@/pages/accounts/AccountsPage.vue'), meta: { title: '账户' } },
  { path: '/accounts/:id', name: 'accountDetail', component: () => import('@/pages/accounts/AccountDetail.vue'), meta: { title: '账户详情' } },
  { path: '/stats', name: 'stats', component: () => import('@/pages/stats/StatsPage.vue'), meta: { title: '统计' } },
  { path: '/settings', name: 'settings', component: () => import('@/pages/settings/SettingsPage.vue'), meta: { title: '设置' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router