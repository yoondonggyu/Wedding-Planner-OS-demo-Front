<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { SidebarLink } from '@/types/navigation'

const props = defineProps<{
  publicLinks: SidebarLink[]
  protectedLinks: SidebarLink[]
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  navigate: [link: SidebarLink]
  openMoreMenu: []
  openAIMenu: []
}>()

const route = useRoute()

// 모바일에서 표시할 주요 메뉴: 홈 / 게시판 / AI / 업체 예약 / 추천 업체
const mobileMenuItems = computed(() => {
  return [
    { label: '홈', icon: '🏠', route: '/' },
    { label: '게시판', icon: '📋', route: '/board' },
    { label: 'AI', icon: '🤖', route: '/ai', isAIMenu: true },
    { label: '업체 예약', icon: '📅', route: '/vendor-message' },
    { label: '추천 업체', icon: '💍', route: '/vendor' },
  ]
})

const isActive = (link: SidebarLink) => {
  if (link.route) {
    // AI 메뉴는 서브메뉴 경로들도 활성화로 처리
    if ((link as any).isAIMenu) {
      return ['/invitation-design', '/chat', '/document-vault'].includes(route.path)
    }
    // 업체 예약은 /vendor-message 경로
    if (link.route === '/vendor-message') {
      return route.path === '/vendor-message'
    }
    return route.path === link.route
  }
  return false
}

const handleClick = (link: SidebarLink) => {
  console.log('메뉴 클릭:', link.label, link)
  if ((link as any).isAIMenu) {
    // AI 메뉴 클릭 시 서브메뉴 표시
    console.log('AI 메뉴 클릭됨 - 서브메뉴 열기')
    console.log('emit 호출 전')
    emit('openAIMenu')
    emit('open-ai-menu') // kebab-case도 시도
    console.log('emit 호출 후')
  } else if (link.isMoreMenu) {
    emit('openMoreMenu')
  } else {
    emit('navigate', link)
  }
}
</script>

<template>
  <nav class="mobile-bottom-nav">
    <button
      v-for="item in mobileMenuItems"
      :key="item.label"
      :class="['nav-item', { active: isActive(item) }]"
      type="button"
      @click="handleClick(item)"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--card);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 0 max(12px, env(safe-area-inset-bottom)); /* 패딩 증가 */
  z-index: 100;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

[data-theme="light"] .mobile-bottom-nav {
  border-top-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px; /* 간격 증가 */
  padding: 12px 16px; /* 패딩 증가 */
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 13px; /* 폰트 크기 증가 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px; /* 최소 너비 증가 */
  flex: 1;
  border-radius: 10px;
}

.nav-item:active {
  transform: scale(0.95);
  background: rgba(139, 92, 246, 0.1);
}

.nav-item.active {
  color: var(--accent);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-icon {
  font-size: 28px; /* 아이콘 크기 증가 */
  line-height: 1;
  transition: transform 0.2s ease;
  display: block;
}

.nav-label {
  font-size: 13px; /* 레이블 크기 증가 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 500;
}

/* 터치 최적화 */
@media (hover: none) and (pointer: coarse) {
  .nav-item {
    min-height: 64px; /* 높이 증가 */
    padding: 12px 16px; /* 패딩 증가 */
  }
}

/* 작은 화면에서도 레이블 유지 (크기만 조정) */
@media (max-width: 360px) {
  .nav-label {
    font-size: 11px; /* 작은 화면에서도 표시 */
  }
  
  .nav-icon {
    font-size: 26px; /* 아이콘 크기 유지 */
  }
  
  .nav-item {
    min-height: 60px; /* 높이 유지 */
    padding: 10px 12px;
  }
}
</style>

