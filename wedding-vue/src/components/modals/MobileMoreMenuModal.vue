<script setup lang="ts">
import type { SidebarLink } from '@/types/navigation'

const props = defineProps<{
  show: boolean
  publicLinks: SidebarLink[]
  protectedLinks: SidebarLink[]
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  close: []
  navigate: [link: SidebarLink]
}>()

const handleNavigate = (link: SidebarLink) => {
  emit('navigate', link)
  emit('close')
}
</script>

<template>
  <div v-if="show" class="mobile-more-modal" @click.self="emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>메뉴</h3>
        <button class="close-btn" type="button" @click="emit('close')">✕</button>
      </div>
      
      <div class="menu-sections">
        <!-- 공개 메뉴 -->
        <div v-if="publicLinks.length > 0" class="menu-section">
          <div class="section-title">일반</div>
          <button
            v-for="link in publicLinks"
            :key="link.label"
            class="menu-item"
            type="button"
            @click="handleNavigate(link)"
          >
            <span class="menu-icon">{{ link.icon }}</span>
            <span class="menu-label">{{ link.label }}</span>
            <span class="menu-arrow">›</span>
          </button>
        </div>

        <!-- 보호된 메뉴 -->
        <div v-if="isAuthenticated && protectedLinks.length > 0" class="menu-section">
          <div class="section-title">주요 기능</div>
          <button
            v-for="link in protectedLinks"
            :key="link.label"
            class="menu-item"
            type="button"
            @click="handleNavigate(link)"
          >
            <span class="menu-icon">{{ link.icon }}</span>
            <span class="menu-label">{{ link.label }}</span>
            <span class="menu-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-more-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  width: 100%;
  max-height: 80vh;
  background: var(--card);
  border-radius: 20px 20px 0 0;
  padding: 20px;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

[data-theme="light"] .modal-content {
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .modal-header {
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--soft);
  border: none;
  color: var(--text);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:active {
  transform: scale(0.9);
  background: rgba(139, 92, 246, 0.2);
}

.menu-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 12px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: var(--text);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.menu-item:active {
  background: rgba(139, 92, 246, 0.1);
  transform: scale(0.98);
}

.menu-icon {
  font-size: 24px;
  width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
  font-weight: 500;
}

.menu-arrow {
  color: var(--muted);
  font-size: 20px;
  flex-shrink: 0;
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

