import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import '@/components/layout/Sidebar.css'
import HeaderBar from '@/components/layout/HeaderBar'
import '@/components/layout/HeaderBar.css'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import '@/components/layout/MobileBottomNav.css'
import MobileMoreMenuModal from '@/components/modals/MobileMoreMenuModal'
import '@/components/modals/MobileMoreMenuModal.css'
import LoginModal from '@/components/modals/LoginModal'
import '@/components/modals/LoginModal.css'
import LandingPage from '@/components/landing/LandingPage'
import '@/components/landing/LandingPage.css'
import ProfileEditModal from '@/components/modals/ProfileEditModal'
import '@/components/modals/ProfileEditModal.css'
import ContactModal from '@/components/modals/ContactModal'
import '@/components/modals/ContactModal.css'
import LoginRequiredModal from '@/components/modals/LoginRequiredModal'
import '@/components/modals/LoginRequiredModal.css'
import CoupleInviteModal from '@/components/modals/CoupleInviteModal'
import '@/components/modals/CoupleInviteModal.css'
import Toast from '@/components/common/Toast'
import '@/components/common/Toast.css'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import type { SidebarLink } from '@/types/navigation'
import './App.css'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true) // 개발 중: 항상 모바일 뷰
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showLoginRequired, setShowLoginRequired] = useState(false)
  const [pendingProtectedLink, setPendingProtectedLink] = useState<SidebarLink | null>(null)
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [showLandingPage, setShowLandingPage] = useState(false)
  const [showCoupleInviteModal, setShowCoupleInviteModal] = useState(false)
  const [coupleKey, setCoupleKey] = useState<string | null>(null)
  const [userGender, setUserGender] = useState<'BRIDE' | 'GROOM' | null>(null)
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)

  const authStore = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { request } = useApi()

  // 모바일 감지
  const checkMobile = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(true) // 개발 중: 항상 모바일 뷰
      // setIsMobile(window.innerWidth <= 768) // 실제 배포 시 사용
    }
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  // 모바일 메뉴 토글
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => {
      const newValue = !prev
      if (newValue) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return newValue
    })
  }, [])

  // 모바일 메뉴 닫기
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
    document.body.style.overflow = ''
  }, [])

  // 테마는 항상 라이트 모드
  useEffect(() => {
    document.body.dataset.theme = 'light'
  }, [])

  // 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      authStore.hydrate()
      
      // 랜딩 페이지 표시 여부 확인
      // URL에 ?landing=true 파라미터가 있으면 강제로 표시
      const urlParams = new URLSearchParams(window.location.search)
      const forceLanding = urlParams.get('landing') === 'true'
      
      if (forceLanding) {
        setShowLandingPage(true)
      } else {
        const hasSeenLanding = localStorage.getItem('has_seen_landing')
        if (!hasSeenLanding && !authStore.isAuthenticated) {
          setShowLandingPage(true)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 한 번만 실행

  // 로그인 불필요한 메뉴
  const publicLinks = useMemo<SidebarLink[]>(() => [
    { label: '홈', icon: '🏠', route: '/', active: location.pathname === '/' },
    { label: '세부 기능', icon: '⚙️', href: '#features' },
    { label: '업무 흐름', icon: '📊', href: '#flow' },
    { label: '데모', icon: '🎬', href: '#demo' },
    { label: '게시판', icon: '📋', route: '/board' },
  ], [location.pathname])

  // 로그인 필요한 메뉴
  const protectedLinks = useMemo(() => {
    const links: SidebarLink[] = [
      { label: '우리만의 공간', icon: '💑', route: '/private-space' },
      { label: '문서 보관함', icon: '📁', route: '/document-vault' },
      { label: '캘린더', icon: '📅', route: '/calendar' },
      { label: '예산서', icon: '💰', route: '/budget' },
      { label: '업체 추천', icon: '💍', route: '/vendor' },
      { label: '제휴 업체 메시지', icon: '💬', route: '/vendor-message' },
      { label: '청첩장 디자인', icon: '💌', route: '/invitation-design' },
      { label: 'AI 플래너', icon: '🤖', route: '/chat' },
      { label: '음성 비서', icon: '🎤', route: '/voice' },
    ]
    
    if (authStore.user?.role === 'SYSTEM_ADMIN' || authStore.user?.role === 'WEB_ADMIN') {
      links.push({
        label: '관리자 페이지',
        icon: '⚙️',
        href: 'http://localhost:8101/secret_admin/dashboard',
        external: true,
      })
    }
    
    return links
  }, [authStore.user?.role])

  const sidebarLinks = useMemo(() => [...publicLinks, ...protectedLinks], [publicLinks, protectedLinks])

  const scrollToAnchor = useCallback((anchor: string) => {
    const target = document.querySelector(anchor)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleNavigate = useCallback(async (link: SidebarLink) => {
    if (isMobile) {
      closeMobileMenu()
    }

    if (link.external && link.href) {
      if (link.href.includes('/secret_admin/')) {
        const token = authStore.accessToken
        const url = token ? `${link.href}?token=${encodeURIComponent(token)}` : link.href
        window.open(url, '_blank')
      } else {
        window.open(link.href, '_blank')
      }
      return
    }

    if (link.route) {
      if (link.route === '/private-space' && authStore.isAuthenticated) {
        try {
          const coupleInfo = await request<{
            message: string
            data: {
              is_connected?: boolean
              couple_key?: string
              gender?: string
            }
          }>('/couple/info')

          if (coupleInfo.message === 'couple_info_retrieved' && coupleInfo.data?.is_connected) {
            if (location.pathname !== link.route) {
              navigate(link.route)
            }
          } else {
            const myKey = await request<{
              message: string
              data: {
                couple_key?: string
                gender?: string
                is_connected?: boolean
              }
            }>('/couple/my-key')

            if (myKey.data?.couple_key && myKey.data?.gender) {
              setCoupleKey(myKey.data.couple_key)
              setUserGender(myKey.data.gender as 'BRIDE' | 'GROOM')
              setShowCoupleInviteModal(true)
            } else {
              alert('커플 기능을 사용하려면 회원가입 시 성별을 선택해주세요.')
            }
            return
          }
        } catch (error) {
          console.error('커플 연결 상태 확인 실패:', error)
          if (location.pathname !== link.route) {
            navigate(link.route)
          }
        }
      } else {
        if (location.pathname !== link.route) {
          navigate(link.route)
        }
      }
      setActiveAnchor(null)
      return
    }

    if (link.href) {
      if (location.pathname !== '/') {
        navigate('/')
      }
      setActiveAnchor(link.href)
      setTimeout(() => {
        scrollToAnchor(link.href!)
      }, 100)
    }
  }, [isMobile, closeMobileMenu, authStore.isAuthenticated, authStore.accessToken, location.pathname, navigate, request, scrollToAnchor])

  const closeLandingPage = useCallback(() => {
    setShowLandingPage(false)
    localStorage.setItem('has_seen_landing', 'true')
  }, [])

  useEffect(() => {
    if (authStore.isAuthenticated && pendingProtectedLink) {
      const link = pendingProtectedLink
      setPendingProtectedLink(null)
      setShowLoginRequired(false)
      handleNavigate(link)
    }
  }, [authStore.isAuthenticated, pendingProtectedLink, handleNavigate])

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveAnchor(null)
    }
  }, [location.pathname])

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {showLandingPage && <LandingPage onClose={closeLandingPage} />}

      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          publicLinks={publicLinks}
          protectedLinks={protectedLinks}
          currentUser={authStore.user}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={handleNavigate}
          onOpenProfile={() => setShowProfileModal(true)}
        />
      )}

      <div className="main-content">
        <HeaderBar
          theme="light"
          isAuthenticated={authStore.isAuthenticated}
          nickname={authStore.user?.nickname}
          profileImageUrl={authStore.user?.profileImageUrl}
          onLogin={() => authStore.openLoginModal()}
          onLogout={() => authStore.logout()}
          onNavigate={(href) => handleNavigate({ href, label: 'anchor', icon: '' })}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenContact={() => setShowContactModal(true)}
        />

        <main className={isMobile ? 'mobile-main' : ''}>
          <Outlet />
        </main>
      </div>

      {isMobile && (
        <MobileBottomNav
          publicLinks={publicLinks}
          protectedLinks={protectedLinks}
          currentUser={authStore.user}
          onNavigate={handleNavigate}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenAIMenu={() => setShowAIMenu(true)}
        />
      )}

      <MobileMoreMenuModal
        isOpen={mobileMenuOpen}
        publicLinks={publicLinks}
        protectedLinks={protectedLinks}
        isAuthenticated={authStore.isAuthenticated}
        onClose={closeMobileMenu}
        onNavigate={handleNavigate}
        onOpenProfile={() => {
          setShowProfileModal(true)
          closeMobileMenu()
        }}
      />

      <LoginModal
        isOpen={authStore.loginModalOpen}
        onClose={() => authStore.closeLoginModal()}
      />

      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      <LoginRequiredModal
        isOpen={showLoginRequired}
        onCancel={() => {
          setShowLoginRequired(false)
          setPendingProtectedLink(null)
        }}
        onConfirm={() => {
          setShowLoginRequired(false)
          authStore.openLoginModal()
        }}
      />

      <CoupleInviteModal
        isOpen={showCoupleInviteModal}
        onClose={() => setShowCoupleInviteModal(false)}
        coupleKey={coupleKey}
        userGender={userGender}
      />

      {/* AI 서브메뉴 모달 */}
      {showAIMenu && (
        <div className="ai-menu-modal-overlay" onClick={() => setShowAIMenu(false)} style={{ display: 'flex', visibility: 'visible', opacity: 1 }}>
          <div className="ai-menu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-menu-header">
              <h3>AI 기능</h3>
              <button className="close-btn" onClick={() => setShowAIMenu(false)}>×</button>
            </div>
            <div className="ai-menu-items">
              <button
                className="ai-menu-item"
                onClick={() => {
                  handleNavigate({ label: '문서 관리 AI', icon: '📁', route: '/document-vault' })
                  setShowAIMenu(false)
                }}
              >
                <span className="ai-menu-icon">📁</span>
                <div className="ai-menu-content">
                  <div className="ai-menu-title">문서 관리 AI</div>
                  <div className="ai-menu-desc">VLLM, OCR로 문서 자동 관리</div>
                </div>
              </button>
              <button
                className="ai-menu-item"
                onClick={() => {
                  handleNavigate({ label: '대화형 AI 비서', icon: '🤖', route: '/chat' })
                  setShowAIMenu(false)
                }}
              >
                <span className="ai-menu-icon">🤖</span>
                <div className="ai-menu-content">
                  <div className="ai-menu-title">대화형 AI 비서</div>
                  <div className="ai-menu-desc">LLM 기반 웨딩 플래너</div>
                </div>
              </button>
              <button
                className="ai-menu-item"
                onClick={() => {
                  handleNavigate({ label: '청첩장 만들기', icon: '💌', route: '/invitation-design' })
                  setShowAIMenu(false)
                }}
              >
                <span className="ai-menu-icon">💌</span>
                <div className="ai-menu-content">
                  <div className="ai-menu-title">청첩장 만들기</div>
                  <div className="ai-menu-desc">AI로 나만의 청첩장 디자인</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast />
    </div>
  )
}

export default App

