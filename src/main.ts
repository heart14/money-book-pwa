import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'uno.css'
import './styles/main.css'
import router from './router'
import { seedData } from '@/db/seed'
import '@/utils/echarts-setup'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

navigator.storage?.persist()

// 首次启动时导入预设账户和分类
seedData().then(() => {
  console.log('[钱书] 预设数据初始化完成')
}).catch((err) => {
  console.error('[钱书] 预设数据初始化失败:', err)
})