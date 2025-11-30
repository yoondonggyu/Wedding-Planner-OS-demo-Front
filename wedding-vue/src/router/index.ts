import { createRouter, createWebHashHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const BoardView = () => import('@/views/BoardView.vue')
const CalendarView = () => import('@/views/CalendarView.vue')
const BudgetView = () => import('@/views/BudgetView.vue')
const ChatView = () => import('@/views/ChatView.vue')
const VoiceView = () => import('@/views/VoiceView.vue')
const VendorView = () => import('@/views/VendorView.vue')

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/board', name: 'board', component: BoardView },
    { path: '/calendar', name: 'calendar', component: CalendarView },
    { path: '/budget', name: 'budget', component: BudgetView },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/voice', name: 'voice', component: VoiceView },
    { path: '/vendor', name: 'vendor', component: VendorView },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

export default router

