import { createRouter, createWebHashHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const BoardView = () => import('@/views/BoardView.vue')
const CalendarView = () => import('@/views/CalendarView.vue')
const BudgetView = () => import('@/views/BudgetView.vue')
const ChatView = () => import('@/views/ChatView.vue')
const VoiceView = () => import('@/views/VoiceView.vue')
const VendorView = () => import('@/views/VendorView.vue')
const VendorMessageView = () => import('@/views/VendorMessageView.vue')
const PrivateSpaceView = () => import('@/views/PrivateSpaceView.vue')
const DocumentVaultView = () => import('@/views/DocumentVaultView.vue')
const InvitationDesignView = () => import('@/views/InvitationDesignView.vue')
const DigitalInvitationView = () => import('@/views/DigitalInvitationView.vue')
const ReviewSummaryView = () => import('@/views/ReviewSummaryView.vue')
const ReviewWriteView = () => import('@/views/ReviewWriteView.vue')

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
    { path: '/vendor-message', name: 'vendor-message', component: VendorMessageView },
    { path: '/private-space', name: 'private-space', component: PrivateSpaceView },
    { path: '/document-vault', name: 'document-vault', component: DocumentVaultView },
    { path: '/invitation-design', name: 'invitation-design', component: InvitationDesignView },
    { path: '/invitation/:url', name: 'digital-invitation', component: DigitalInvitationView },
    { path: '/review-summary', name: 'review-summary', component: ReviewSummaryView },
    { path: '/review-write', name: 'review-write', component: ReviewWriteView },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

export default router

