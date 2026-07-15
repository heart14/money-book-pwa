import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'uno.css'
import './styles/main.css'
import router from './router'
import { seedData } from '@/db/seed'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

navigator.storage?.persist()

// 首次启动时导入预设账户和分类
seedData()