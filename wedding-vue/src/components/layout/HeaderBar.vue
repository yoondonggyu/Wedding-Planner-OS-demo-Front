<script setup lang="ts">
import logoImage from '@/assets/logo.png'

const { theme, isAuthenticated, nickname, profileImageUrl, showContactButton = true } = defineProps<{
  theme: 'dark' | 'light'
  isAuthenticated: boolean
  nickname?: string
  profileImageUrl?: string | null
  showContactButton?: boolean
}>()

const emit = defineEmits<{
  login: []
  navigate: [href: string]
  'toggle-theme': []
  logout: []
  'open-profile': []
  'open-contact': []
}>()
</script>

<template>
  <header>
    <div class="container nav">
      <div class="brand" style="display: flex; align-items: center; gap: 12px">
        <img :src="logoImage" alt="Wedding OS Logo" class="logo-image" />
        <strong>AI Wedding Planner OS</strong>
      </div>
      <div style="display: flex; gap: 12px; align-items: center">
        <button class="btn" type="button" @click="emit('navigate', '#demo')">
          📺 데모 보기
        </button>
        <button
          v-if="showContactButton"
          class="btn"
          type="button"
          @click="emit('open-contact')"
        >
          ✉️ 문의하기
        </button>
            <button class="btn" type="button" @click="emit('toggle-theme')">
              {{ theme === 'dark' ? '☀️ Light' : '🌙 Dark' }}
            </button>
        <button
          v-if="!isAuthenticated"
          class="btn primary"
          type="button"
          @click="emit('login')"
        >
          로그인
        </button>
        <div v-else style="display: flex; gap: 8px; align-items: center">
          <button
            type="button"
            style="
              font-size: 14px;
              color: var(--muted);
              background: transparent;
              border: none;
              cursor: pointer;
              padding: 4px 8px;
              border-radius: 6px;
              transition: background 0.2s ease;
              display: flex;
              align-items: center;
              gap: 8px;
            "
            @click="emit('open-profile')"
            @mouseenter="(e) => (e.currentTarget.style.background = 'var(--soft)')"
            @mouseleave="(e) => (e.currentTarget.style.background = 'transparent')"
          >
            <img
              v-if="profileImageUrl"
              :src="profileImageUrl"
              alt="프로필"
              style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover"
            />
            <span v-else>👤</span>
            <span>{{ nickname }}님</span>
          </button>
          <button class="btn" type="button" @click="emit('logout')">로그아웃</button>
        </div>
      </div>
    </div>
  </header>
</template>

