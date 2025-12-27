import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import './assets/styles/base.css'

// 기본 테마를 라이트 모드로 설정
if (!document.body.dataset.theme) {
  const savedTheme = localStorage.getItem('theme') || 'light'
  document.body.dataset.theme = savedTheme
} else {
  document.body.dataset.theme = 'light'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

