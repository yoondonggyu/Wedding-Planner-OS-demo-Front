import { createHashRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import App from '@/App'

const HomeView = lazy(() => import('@/pages/HomeView'))
const BoardView = lazy(() => import('@/pages/BoardView'))
const CalendarView = lazy(() => import('@/pages/CalendarView'))
const BudgetView = lazy(() => import('@/pages/BudgetView'))
const ChatView = lazy(() => import('@/pages/ChatView'))
const VoiceView = lazy(() => import('@/pages/VoiceView'))
const VendorView = lazy(() => import('@/pages/VendorView'))
const VendorMessageView = lazy(() => import('@/pages/VendorMessageView'))
const PrivateSpaceView = lazy(() => import('@/pages/PrivateSpaceView'))
const DocumentVaultView = lazy(() => import('@/pages/DocumentVaultView'))
const InvitationView = lazy(() => import('@/pages/InvitationView'))
const DigitalInvitationView = lazy(() => import('@/pages/DigitalInvitationView'))
const ReviewSummaryView = lazy(() => import('@/pages/ReviewSummaryView'))
const ReviewWriteView = lazy(() => import('@/pages/ReviewWriteView'))

const LoadingFallback = () => <div>Loading...</div>

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { 
        path: '/', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HomeView />
          </Suspense>
        )
      },
      { 
        path: '/board', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BoardView />
          </Suspense>
        )
      },
      { 
        path: '/calendar', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CalendarView />
          </Suspense>
        )
      },
      { 
        path: '/budget', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BudgetView />
          </Suspense>
        )
      },
      { 
        path: '/chat', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ChatView />
          </Suspense>
        )
      },
      { 
        path: '/voice', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <VoiceView />
          </Suspense>
        )
      },
      { 
        path: '/vendor', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <VendorView />
          </Suspense>
        )
      },
      { 
        path: '/vendor-message', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <VendorMessageView />
          </Suspense>
        )
      },
      { 
        path: '/private-space', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PrivateSpaceView />
          </Suspense>
        )
      },
      { 
        path: '/document-vault', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DocumentVaultView />
          </Suspense>
        )
      },
      { 
        path: '/invitation-design/*', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <InvitationView />
          </Suspense>
        )
      },
      { 
        path: '/invitation', 
        element: <Navigate to="/invitation-design" replace />
      },
      { 
        path: '/invitation/:url', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DigitalInvitationView />
          </Suspense>
        )
      },
      { 
        path: '/review-summary', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ReviewSummaryView />
          </Suspense>
        )
      },
      { 
        path: '/review-write', 
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ReviewWriteView />
          </Suspense>
        )
      },
    ],
  },
])

export default router

