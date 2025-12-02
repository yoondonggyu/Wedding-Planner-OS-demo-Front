<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toastMessage, toastVisible, toastType } = useToast()
</script>

<template>
  <Transition name="toast">
    <div
      v-if="toastVisible"
      class="toast"
      :class="`toast-${toastType}`"
    >
      <span class="toast-icon">
        <span v-if="toastType === 'success'">✅</span>
        <span v-else-if="toastType === 'error'">❌</span>
        <span v-else-if="toastType === 'warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </span>
      <span class="toast-message">{{ toastMessage }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(0);
  padding: 12px 20px;
  border-radius: 12px;
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  max-width: 90vw;
  text-align: center;
}

.toast-success {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
}

.toast-error {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.toast-warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fde68a;
}

.toast-info {
  background: var(--card);
  border-color: rgba(255, 255, 255, 0.12);
  color: var(--text);
}

.toast-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>



