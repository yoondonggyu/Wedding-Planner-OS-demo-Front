<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderBar from '@/components/layout/HeaderBar.vue'
import LoginModal from '@/components/modals/LoginModal.vue'
import ProfileEditModal from '@/components/modals/ProfileEditModal.vue'
import ContactModal from '@/components/modals/ContactModal.vue'
import LoginRequiredModal from '@/components/modals/LoginRequiredModal.vue'
import Toast from '@/components/common/Toast.vue'
import { useAuthStore } from '@/stores/auth'
import type { SidebarLink } from '@/types/navigation'

const sidebarCollapsed = ref(false)
// 기본 테마를 라이트 모드로 설정 (localStorage에 저장된 테마가 있으면 사용)
const theme = ref<'dark' | 'light'>(
  typeof window !== 'undefined' 
    ? (localStorage.getItem('theme') as 'dark' | 'light' | null) || 'light'
    : 'light'
)
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
])

// 로그인 필요한 메뉴 (주요 기능)
const protectedLinks = ref<SidebarLink[]>([
  { label: '게시판', icon: '📋', route: '/board' },
  { label: '캘린더', icon: '📅', route: '/calendar' },
  { label: '예산서', icon: '💰', route: '/budget' },
  { label: '업체 추천', icon: '💍', route: '/vendor' },
  { label: 'AI 플래너', icon: '🤖', route: '/chat' },
  { label: '음성 비서', icon: '🎤', route: '/voice' },
])

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

const handleToggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  // 테마 변경 시 localStorage에 저장
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', theme.value)
  }
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
  protectedLinks.value = protectedLinks.value.map((link) => {
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
}

const scrollToAnchor = (anchor: string) => {
  const target = document.querySelector(anchor)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const isProtectedRoute = (link: SidebarLink) => {
  return Boolean(link.route && protectedLinks.value.some((item) => item.route === link.route))
}

const promptLoginRequired = (link: SidebarLink) => {
  showLoginRequired.value = true
  pendingProtectedLink.value = link
}

const handleNavigate = async (link: SidebarLink) => {
  if (link.route) {
    if (isProtectedRoute(link) && !isAuthenticated.value) {
      promptLoginRequired(link)
      return
    }
    if (route.path !== link.route) {
      await router.push(link.route)
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
    document.body.dataset.theme = value
    // 테마 변경 시 localStorage에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', value)
    }
  },
  { immediate: true }
)

onMounted(() => {
  document.body.dataset.theme = theme.value
})
</script>

<template>
  <Sidebar
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
          <HeaderBar
            :theme="theme"
            :is-authenticated="isAuthenticated"
            :nickname="currentUser?.nickname"
            :profile-image-url="currentUser?.profileImageUrl"
            @login="authStore.openLoginModal()"
            @logout="authStore.logout()"
            @navigate="(href) => handleNavigate({ href, label: 'anchor', icon: '' })"
            @toggle-theme="handleToggleTheme"
            @open-profile="showProfileModal = true"
            @open-contact="showContactModal = true"
          />
      <main>
        <RouterView />
      </main>
    </div>

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

    <Toast />
  </div>
</template>
