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
      path: '/stats',
      name: 'stats',
      component: () => import('@/pages/stats/StatsPage.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/settings/SettingsPage.vue'),
    },
    {
      // 独立预览：iOS26 液态玻璃视觉 demo（自包含，不并入业务）
      path: '/glass',
      name: 'glass',
      component: () => import('@/pages/glass/GlassDemoPage.vue'),
    },
    {
      // 沙盒：钱书新视觉「墨色账本」设计预览（记账/明细/统计/账户/设置 + 深浅切换）。不并入业务。
      path: '/style-lab',
      name: 'style-lab',
      component: () => import('@/pages/glass/RedesignPreview.vue'),
    },
  ],
})

export default router