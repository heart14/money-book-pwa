import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'vant/lib/index.css'
import './db'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(() => {
    console.log('Persistent storage granted')
  })
}