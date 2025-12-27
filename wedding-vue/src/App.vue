<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderBar from '@/components/layout/HeaderBar.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import MobileMoreMenuModal from '@/components/modals/MobileMoreMenuModal.vue'
import LoginModal from '@/components/modals/LoginModal.vue'
import LandingPage from '@/components/landing/LandingPage.vue'
import ProfileEditModal from '@/components/modals/ProfileEditModal.vue'
import ContactModal from '@/components/modals/ContactModal.vue'
import LoginRequiredModal from '@/components/modals/LoginRequiredModal.vue'
import CoupleInviteModal from '@/components/modals/CoupleInviteModal.vue'
import Toast from '@/components/common/Toast.vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import type { SidebarLink } from '@/types/navigation'

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const isMobile = ref(false)

// 모바일 감지
const checkMobile = () => {
  if (typeof window !== 'undefined') {
    // 개발 중: 항상 모바일 뷰로 표시 (실제 배포 시에는 아래 주석 해제하고 위 줄 주석 처리)
    isMobile.value = true
    // isMobile.value = window.innerWidth <= 768
  }
}

// 모바일 메뉴 토글
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// 모바일 메뉴 닫기
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}
// 테마를 항상 라이트 모드로 고정
const theme = ref<'dark' | 'light'>('light')
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

if (typeof window !== 'undefined') {
  authStore.hydrate()
}

const activeAnchor = ref<string | null>(null)

// 로그인 불필요한 메뉴 (홈 페이지 섹션)
const publicLinks = ref<SidebarLink[]>([
  { label: '홈', icon: '🏠', route: '/', active: true },
  { label: '세부 기능', icon: '⚙️', href: '#features' },
  { label: '업무 흐름', icon: '📊', href: '#flow' },
  { label: '데모', icon: '🎬', href: '#demo' },
  { label: '게시판', icon: '📋', route: '/board' },
])

// 로그인 필요한 메뉴 (주요 기능)
const protectedLinks = computed(() => {
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
  
  // 관리자 권한이 있는 경우 관리자 페이지 링크 추가
  if (currentUser.value?.role === 'SYSTEM_ADMIN' || currentUser.value?.role === 'WEB_ADMIN') {
    links.push({ 
      label: '관리자 페이지', 
      icon: '⚙️', 
      href: 'http://localhost:8101/secret_admin/dashboard',
      external: true 
    })
  }
  
  return links
})

const sidebarLinks = computed(() => [...publicLinks.value, ...protectedLinks.value])

const appShellClass = computed(() => ({
  'app-shell': true,
  'sidebar-collapsed': sidebarCollapsed.value,
}))

const currentUser = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const showLoginModal = computed(() => authStore.loginModalOpen)
const showProfileModal = ref(false)
const showContactModal = ref(false)
const showLoginRequired = ref(false)
const pendingProtectedLink = ref<SidebarLink | null>(null)
const showAIMenu = ref(false)
const showLandingPage = ref(false)

// AI 메뉴 열기 함수
const openAIMenu = () => {
  console.log('=== App.vue openAIMenu 호출됨 ===')
  console.log('현재 showAIMenu 값:', showAIMenu.value)
  showAIMenu.value = true
  console.log('showAIMenu를 true로 설정함:', showAIMenu.value)
  // 강제로 DOM 업데이트
  nextTick(() => {
    console.log('nextTick 후 showAIMenu:', showAIMenu.value)
    const modal = document.querySelector('.ai-menu-modal-overlay')
    console.log('모달 요소 존재 여부:', modal !== null)
    if (modal) {
      console.log('모달 스타일:', window.getComputedStyle(modal).display)
    }
  })
}

// 커플 초대 팝업
const showCoupleInviteModal = ref(false)
const coupleKey = ref<string | null>(null)
const userGender = ref<'BRIDE' | 'GROOM' | null>(null)
const { request } = useApi()

// 테마 토글 기능 제거 (항상 라이트 모드)
const handleToggleTheme = () => {
  // 아무 작업도 하지 않음
}

const recomputeActiveLinks = () => {
  publicLinks.value = publicLinks.value.map((link) => {
    if (link.route) {
      return { ...link, active: link.route === route.path }
    }
    if (link.href) {
      return {
        ...link,
        active: route.path === '/' && activeAnchor.value === link.href,
      }
    }
    return link
  })
  // protectedLinks는 computed이므로 직접 수정하지 않음
}

const scrollToAnchor = (anchor: string) => {
  const target = document.querySelector(anchor)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const isProtectedRoute = (link: SidebarLink) => {
  // 모든 라우트를 공개로 설정 (로그인 없이 접근 가능)
  return false
}

const promptLoginRequired = (link: SidebarLink) => {
  showLoginRequired.value = true
  pendingProtectedLink.value = link
}

// 모바일에서 네비게이션 시 메뉴 닫기
const handleNavigate = async (link: SidebarLink) => {
  if (isMobile.value) {
    closeMobileMenu()
  }
  // 외부 링크인 경우 새 창에서 열기
  if (link.external && link.href) {
    // 관리자 페이지인 경우 토큰을 쿼리 파라미터로 전달
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
    // 로그인 체크 제거 - 모든 라우트 접근 허용
    
    // "우리만의 공간" 메뉴 클릭 시 커플 연결 상태 확인
    if (link.route === '/private-space' && isAuthenticated.value) {
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
          // 커플이 연결된 경우 페이지 이동
          if (route.path !== link.route) {
            await router.push(link.route)
          }
        } else {
          // 커플이 연결되지 않은 경우 커플 키 조회 후 모달 표시
          const myKey = await request<{
            message: string
            data: {
              couple_key?: string
              gender?: string
              is_connected?: boolean
            }
          }>('/couple/my-key')
          
          if (myKey.data?.couple_key && myKey.data?.gender) {
            coupleKey.value = myKey.data.couple_key
            userGender.value = myKey.data.gender as 'BRIDE' | 'GROOM'
            showCoupleInviteModal.value = true
          } else {
            alert('커플 기능을 사용하려면 회원가입 시 성별을 선택해주세요.')
          }
          return // 페이지 이동하지 않음
        }
      } catch (error) {
        console.error('커플 연결 상태 확인 실패:', error)
        // 오류 발생 시에도 페이지 이동 (컴포넌트에서 다시 확인)
        if (route.path !== link.route) {
          await router.push(link.route)
        }
      }
    } else {
      // 다른 메뉴는 그대로 이동
      if (route.path !== link.route) {
        await router.push(link.route)
      }
    }
    
    activeAnchor.value = null
    recomputeActiveLinks()
    return
  }

  if (link.href) {
    if (route.path !== '/') {
      await router.push('/')
    }
    activeAnchor.value = link.href
    await nextTick()
    scrollToAnchor(link.href)
    recomputeActiveLinks()
  }
}

const handleLoginPromptCancel = () => {
  showLoginRequired.value = false
  pendingProtectedLink.value = null
}

const handleLoginPromptConfirm = () => {
  showLoginRequired.value = false
  authStore.openLoginModal()
}

watch(
  () => isAuthenticated.value,
  (loggedIn) => {
  if (loggedIn && pendingProtectedLink.value) {
    const link = pendingProtectedLink.value
    pendingProtectedLink.value = null
    showLoginRequired.value = false
    handleNavigate(link)
  }
  }
)

watch(
  () => route.path,
  () => {
    if (route.path !== '/') {
      activeAnchor.value = null
    }
    recomputeActiveLinks()
  },
  { immediate: true }
)

watch(
  theme,
  (value) => {
    // 항상 라이트 모드로 설정
    document.body.dataset.theme = 'light'
  },
  { immediate: true }
)

// 커플 정보 확인 및 초대 팝업 표시
async function checkCoupleStatus() {
  if (!isAuthenticated.value || !currentUser.value?.id) {
    return
  }

  // 오늘 하루 그만 보기 체크
  const hiddenDate = localStorage.getItem('couple_invite_hidden_date')
  if (hiddenDate === new Date().toDateString()) {
    return
  }

  try {
    // 커플 정보 조회
    const coupleInfo = await request<{
      message: string
      data: {
        is_connected?: boolean
        couple_id?: number
        couple_key?: string
        partner?: {
          id: number
          nickname: string
        } | null
      } | null
    }>('/couple/info')

    // 연결되지 않은 경우 (not_in_couple 메시지이거나 is_connected가 false인 경우)
    if (coupleInfo.message === 'not_in_couple' || !coupleInfo.data?.is_connected) {
      // 커플 키 조회
      const myKey = await request<{
        message: string
        data: {
          couple_key?: string
          gender?: string
          is_connected?: boolean
        }
      }>('/couple/my-key')

      if (myKey.data?.couple_key && myKey.data?.gender && !myKey.data?.is_connected) {
        coupleKey.value = myKey.data.couple_key
        userGender.value = myKey.data.gender as 'BRIDE' | 'GROOM'
        showCoupleInviteModal.value = true
      }
    }
  } catch (error) {
    // 커플 정보가 없거나 오류가 발생해도 무시 (팝업을 강제로 표시하지 않음)
    console.log('커플 정보 확인 실패:', error)
  }
}

function handleCoupleConnected() {
  showCoupleInviteModal.value = false
  // 커플 연결 후 상태 다시 확인
  setTimeout(() => {
    checkCoupleStatus()
    // 우리만의 공간 페이지에 있는 경우 새로고침
    if (route.path === '/private-space') {
      window.location.reload()
    }
  }, 500)
}

// 로그인 상태 변경 감지
watch(
  () => isAuthenticated.value,
  (isAuth) => {
    if (isAuth) {
      // 로그인 후 약간의 지연을 두고 커플 상태 확인
      setTimeout(() => {
        checkCoupleStatus()
      }, 1000)
    } else {
      showCoupleInviteModal.value = false
    }
  },
  { immediate: true }
)

// 랜딩 페이지 닫기
const closeLandingPage = () => {
  showLandingPage.value = false
  localStorage.setItem('has_seen_landing', 'true')
}

onMounted(() => {
  document.body.dataset.theme = 'light'
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 랜딩 페이지 표시 여부 확인
  const hasSeenLanding = localStorage.getItem('has_seen_landing')
  if (!hasSeenLanding && !isAuthenticated.value) {
    showLandingPage.value = true
  }
  
  // 초기 로드 시에도 확인
  if (isAuthenticated.value) {
    setTimeout(() => {
      checkCoupleStatus()
    }, 1000)
  }
  })
</script>

<template>
  <!-- 랜딩 페이지 -->
  <LandingPage v-if="showLandingPage" @close="closeLandingPage" />

  <!-- 모바일에서는 사이드바 숨김, 데스크톱에서만 표시 -->
  <Sidebar
    v-if="!isMobile"
    :collapsed="sidebarCollapsed"
    :public-links="publicLinks"
    :protected-links="protectedLinks"
    :current-user="currentUser"
    @toggle="sidebarCollapsed = !sidebarCollapsed"
    @navigate="handleNavigate"
    @open-profile="showProfileModal = true"
  />

  <div :class="appShellClass">
    <div class="main-content">
      <!-- 모바일 헤더 -->
      <HeaderBar
        v-if="isMobile"
        :theme="theme"
        :is-authenticated="isAuthenticated"
        :nickname="currentUser?.nickname"
        :profile-image-url="currentUser?.profileImageUrl"
        @login="authStore.openLoginModal()"
        @logout="authStore.logout()"
        @navigate="(href) => handleNavigate({ href, label: 'anchor', icon: '' })"
        @open-profile="showProfileModal = true"
        @open-contact="showContactModal = true"
      />
      
      <!-- 데스크톱 헤더 -->
      <HeaderBar
        v-else
        :theme="theme"
        :is-authenticated="isAuthenticated"
        :nickname="currentUser?.nickname"
        :profile-image-url="currentUser?.profileImageUrl"
        @login="authStore.openLoginModal()"
        @logout="authStore.logout()"
        @navigate="(href) => handleNavigate({ href, label: 'anchor', icon: '' })"
        @open-profile="showProfileModal = true"
        @open-contact="showContactModal = true"
      />
      
      <main :class="{ 'mobile-main': isMobile }">
        <RouterView />
      </main>
    </div>

    <!-- 모바일 하단 네비게이션 (개발 중: 항상 표시) -->
    <MobileBottomNav
      :public-links="publicLinks"
      :protected-links="protectedLinks"
      :is-authenticated="isAuthenticated"
      @navigate="handleNavigate"
      @open-more-menu="mobileMenuOpen = true"
      @openAIMenu="openAIMenu"
      @open-ai-menu="openAIMenu"
    />

    <!-- 모바일 더보기 메뉴 모달 -->
    <MobileMoreMenuModal
      v-if="isMobile"
      :show="mobileMenuOpen"
      :public-links="publicLinks"
      :protected-links="protectedLinks"
      :is-authenticated="isAuthenticated"
      @close="closeMobileMenu"
      @navigate="handleNavigate"
    />

    <LoginModal
      v-if="showLoginModal"
      @close="authStore.closeLoginModal()"
    />

    <ProfileEditModal
      v-if="showProfileModal && isAuthenticated"
      @close="showProfileModal = false"
    />

    <ContactModal
      v-if="showContactModal"
      @close="showContactModal = false"
    />

    <LoginRequiredModal
      v-if="showLoginRequired"
      @cancel="handleLoginPromptCancel"
      @login="handleLoginPromptConfirm"
    />

    <CoupleInviteModal
      v-if="showCoupleInviteModal"
      :show="showCoupleInviteModal"
      :couple-key="coupleKey"
      :gender="userGender"
      @close="showCoupleInviteModal = false"
      @connected="handleCoupleConnected"
    />

    <!-- AI 서브메뉴 모달 -->
    <Teleport to="body">
      <div v-show="showAIMenu" v-if="showAIMenu" class="ai-menu-modal-overlay" @click="showAIMenu = false" style="display: flex !important; visibility: visible !important; opacity: 1 !important;">
        <div class="ai-menu-modal" @click.stop>
          <div class="ai-menu-header">
            <h3>AI 기능</h3>
            <button class="close-btn" @click="showAIMenu = false">×</button>
          </div>
          <div class="ai-menu-items">
            <button
              class="ai-menu-item"
              @click="handleNavigate({ label: '문서 관리 AI', icon: '📁', route: '/document-vault' }); showAIMenu = false"
            >
              <span class="ai-menu-icon">📁</span>
              <div class="ai-menu-content">
                <div class="ai-menu-title">문서 관리 AI</div>
                <div class="ai-menu-desc">VLLM, OCR로 문서 자동 관리</div>
              </div>
            </button>
            <button
              class="ai-menu-item"
              @click="handleNavigate({ label: '대화형 AI 비서', icon: '🤖', route: '/chat' }); showAIMenu = false"
            >
              <span class="ai-menu-icon">🤖</span>
              <div class="ai-menu-content">
                <div class="ai-menu-title">대화형 AI 비서</div>
                <div class="ai-menu-desc">LLM 기반 웨딩 플래너</div>
              </div>
            </button>
            <button
              class="ai-menu-item"
              @click="handleNavigate({ label: '청첩장 만들기', icon: '💌', route: '/invitation-design' }); showAIMenu = false"
            >
              <span class="ai-menu-icon">💌</span>
              <div class="ai-menu-content">
                <div class="ai-menu-title">청첩장 만들기</div>
                <div class="ai-menu-desc">AI로 나만의 청첩장 디자인</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Toast />
  </div>
</template>

<style scoped>
.mobile-main {
  padding-bottom: 90px; /* 하단 네비게이션 공간 확보 (크기 증가에 맞춰) */
}

@media (max-width: 768px) {
  .mobile-main {
    padding-bottom: max(90px, calc(90px + env(safe-area-inset-bottom)));
  }
  
  /* 모바일에서 전체적인 패딩 증가 */
  main {
    padding: 20px 16px; /* 패딩 증가 */
  }
}

/* AI 메뉴 모달 스타일 */
.ai-menu-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.ai-menu-modal {
  background: var(--card);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  padding: 24px;
  animation: slideUp 0.3s ease;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
}

.ai-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.ai-menu-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.ai-menu-header .close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: var(--muted);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.ai-menu-header .close-btn:hover {
  background: var(--soft);
  color: var(--text);
}

.ai-menu-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.ai-menu-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.ai-menu-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.ai-menu-content {
  flex: 1;
}

.ai-menu-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.ai-menu-desc {
  font-size: 13px;
  color: var(--muted);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
