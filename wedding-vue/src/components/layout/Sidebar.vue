<script setup lang="ts">
import { ref } from 'vue'
import type { SidebarLink } from '@/types/navigation'
import logoImage from '@/assets/logo.png'

const props = defineProps<{
  collapsed: boolean
  publicLinks: SidebarLink[]
  protectedLinks: SidebarLink[]
  currentUser?: { nickname: string; profileImageUrl?: string | null } | null
}>()

const emit = defineEmits<{
  toggle: []
  navigate: [link: SidebarLink]
}>()

const isHoveringButton = ref(false)

function handleButtonMouseEnter() {
  isHoveringButton.value = true
}

function handleButtonMouseLeave() {
  isHoveringButton.value = false
}
</script>

<template>
  <aside :class="['sidebar', { collapsed, 'button-hover': isHoveringButton && collapsed }]">
    <div class="sidebar-header">
      <img :src="logoImage" alt="Wedding OS Logo" class="logo-image" />
      <strong>AI Wedding Planner</strong>
      <button
        class="sidebar-expand-btn"
        type="button"
        :aria-label="collapsed ? '사이드바 펼치기' : '사이드바 접기'"
        :title="collapsed ? '사이드바 펼치기' : '사이드바 접기'"
        @click="emit('toggle')"
        @mouseenter="handleButtonMouseEnter"
        @mouseleave="handleButtonMouseLeave"
      >
        <span class="arrow" aria-hidden="true">{{ collapsed ? '»' : '«' }}</span>
      </button>
    </div>

    <nav class="sidebar-menu">
      <!-- 로그인 불필요한 메뉴 -->
      <button
        v-for="item in props.publicLinks"
        :key="item.label"
        class="sidebar-menu-item"
        :class="{ active: item.active }"
        type="button"
        @click="emit('navigate', item)"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="text">{{ item.label }}</span>
      </button>
    </nav>

    <!-- 구분선: 로그인 불필요 메뉴와 로그인 필요 메뉴 사이 -->
    <div class="sidebar-divider"></div>

    <!-- 로그인 필요한 메뉴 -->
    <nav class="sidebar-menu">
      <div class="sidebar-section-title">주요 기능</div>
      <button
        v-for="item in props.protectedLinks"
        :key="item.label"
        class="sidebar-menu-item"
        :class="{ active: item.active }"
        type="button"
        @click="emit('navigate', item)"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="text">{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-menu" style="margin-top: auto; padding-top: 0">
      <button
        v-if="currentUser"
        class="sidebar-menu-item"
        type="button"
        style="cursor: pointer"
        @click="emit('open-profile')"
      >
        <span class="icon" style="display: flex; align-items: center; justify-content: center">
          <img
            v-if="currentUser.profileImageUrl"
            :src="currentUser.profileImageUrl"
            alt="프로필"
            style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover"
          />
          <span v-else>👤</span>
        </span>
        <span class="text">{{ currentUser.nickname }}님</span>
      </button>
    </div>
  </aside>
</template>

