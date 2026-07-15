import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/booking' },
    {
      path: '/booking',
      name: 'booking',
      component: () => import('@/pages/booking/BookingPage.vue'),
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/pages/transactions/TransactionsPage.vue'),
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('@/pages/accounts/AccountsPage.vue'),
    },
    {
      path: '/accounts/:id',
      name: 'account-detail',
      component: () => import('@/pages/accounts/AccountDetailPage.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/pages/stats/StatsPage.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/settings/SettingsPage.vue'),
    },
  ],
})

export default router