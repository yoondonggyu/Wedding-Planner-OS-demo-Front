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
  logout: []
  'open-profile': []
  'open-contact': []
}>()
</script>

<template>
  <header>
    <div class="container nav">
      <div class="brand" style="display: flex; align-items: center; gap: 12px">
        <img :src="logoImage" alt="PromiseMarry Lab Logo" class="logo-image" />
        <strong>PromiseMarry Lab</strong>
      </div>
      <div class="header-actions">
        <button
          v-if="showContactButton"
          class="btn mobile-hide"
          type="button"
          @click="emit('open-contact')"
        >
          <span class="btn-text">✉️ 문의하기</span>
        </button>
        <div class="action-group">
          <button
            v-if="!isAuthenticated"
            class="btn primary"
            type="button"
            @click="emit('login')"
          >
            로그인
          </button>
          <div v-else class="user-section">
            <button
              type="button"
              class="profile-btn"
              @click="emit('open-profile')"
            >
              <img
                v-if="profileImageUrl"
                :src="profileImageUrl"
                alt="프로필"
                class="profile-image"
              />
              <span v-else class="profile-icon">👤</span>
              <span class="profile-name">{{ nickname }}님</span>
            </button>
            <button class="btn logout-btn" type="button" @click="emit('logout')">
              <span class="btn-text">로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.profile-btn {
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
}

.profile-btn:hover {
  background: var(--soft);
}

.profile-image {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-icon {
  font-size: 20px;
}

.profile-name {
  font-size: 14px;
}

@media (max-width: 768px) {
  .mobile-hide {
    display: none;
  }

  .btn .btn-text {
    display: inline;
  }

  .nav {
    padding: 12px 0;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .brand {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand strong {
    font-size: 20px !important;
    font-weight: 700;
  }
  
  .logo-image {
    width: 64px !important;
    height: 64px !important;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .action-group {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .theme-btn,
  .logout-btn {
    width: 100%;
    font-size: 15px;
    padding: 12px 16px;
    min-height: 48px;
  }

  .user-section {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .profile-btn {
    width: 100%;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--soft);
    border-radius: 8px;
    align-items: center;
    justify-content: center;
  }

  .profile-image {
    width: 48px !important;
    height: 48px !important;
  }

  .profile-icon {
    font-size: 32px;
  }

  .profile-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }

  .btn {
    font-size: 15px;
    padding: 12px 16px;
    min-height: 48px;
  }
}

@media (max-width: 480px) {
  .brand strong {
    font-size: 18px !important;
  }

  .logo-image {
    width: 56px !important;
    height: 56px !important;
  }

  .btn {
    padding: 10px 14px;
    font-size: 14px;
    min-height: 44px;
  }

  .profile-image {
    width: 40px !important;
    height: 40px !important;
  }

  .profile-icon {
    font-size: 28px;
  }

  .profile-name {
    font-size: 15px;
  }
}
</style>

