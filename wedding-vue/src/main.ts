import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/styles/base.css'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

// 기본 테마를 라이트 모드로 설정 (localStorage에 저장된 테마가 있으면 사용)
if (!document.body.dataset.theme) {
  const savedTheme = localStorage.getItem('theme') || 'light'
  document.body.dataset.theme = savedTheme
}

app.use(pinia)
app.use(router)
app.mount('#app')
