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
}>()

const route = useRoute()

// 모바일에서 표시할 주요 메뉴 (최대 5개)
const mobileMenuItems = computed(() => {
  const items: SidebarLink[] = []
  
  // 로그인 불필요한 메뉴 중 홈만
  const homeLink = props.publicLinks.find(link => link.route === '/')
  if (homeLink) {
    items.push(homeLink)
  }
  
  // 로그인 필요한 메뉴 중 주요 기능만 선택
  if (props.isAuthenticated) {
    const priorityLinks = [
      { label: '캘린더', icon: '📅', route: '/calendar' },
      { label: '예산서', icon: '💰', route: '/budget' },
      { label: 'AI 플래너', icon: '🤖', route: '/chat' },
    ]
    
    priorityLinks.forEach(priority => {
      const link = props.protectedLinks.find(l => l.route === priority.route)
      if (link) {
        items.push(link)
      }
    })
    
    // 더 보기 메뉴
    items.push({ 
      label: '더보기', 
      icon: '☰', 
      route: '/more',
      isMoreMenu: true 
    })
  } else {
    // 로그인 안 된 경우
    items.push(
      { label: '게시판', icon: '📋', route: '/board' },
      { label: '로그인', icon: '🔐', route: '/login', isLogin: true }
    )
  }
  
  return items.slice(0, 5) // 최대 5개
})

const isActive = (link: SidebarLink) => {
  if (link.route) {
    return route.path === link.route
  }
  return false
}

const handleClick = (link: SidebarLink) => {
  if (link.isMoreMenu) {
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

