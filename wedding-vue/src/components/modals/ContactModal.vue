<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

const emit = defineEmits<{
  close: []
}>()

const name = ref('')
const email = ref('')
const message = ref('')
const isSubmitting = ref(false)

const { showToast } = useToast()

function resetForm() {
  name.value = ''
  email.value = ''
  message.value = ''
}

async function handleSubmit() {
  if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
    showToast('모든 필드를 입력해주세요.', 'warn')
    return
  }

  isSubmitting.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    showToast('문의가 전송되었습니다. 감사합니다!', 'success')
    emit('close')
    resetForm()
  } catch (error) {
    console.error('문의 전송 오류:', error)
    showToast('문의 전송 중 오류가 발생했습니다.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  emit('close')
  resetForm()
}
</script>

<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-card">
      <header class="modal-header">
        <div>
          <p class="modal-label">CONTACT</p>
          <h3>문의하기</h3>
        </div>
        <button class="icon-btn" type="button" @click="handleClose" aria-label="닫기">
          ✕
        </button>
      </header>

      <p class="description">
        테스트 유저, 제휴, 제품 문의 등 무엇이든 남겨주세요. 1 영업일 내 회신 드립니다.
      </p>

      <form @submit.prevent="handleSubmit" class="contact-form">
        <label>
          <span>이름</span>
          <input v-model="name" type="text" placeholder="이름을 입력하세요" required />
        </label>

        <label>
          <span>이메일</span>
          <input v-model="email" type="email" placeholder="example@email.com" required />
        </label>

        <label>
          <span>문의 내용</span>
          <textarea
            v-model="message"
            rows="5"
            placeholder="문의/협업 내용을 입력해주세요"
            required
          ></textarea>
        </label>

        <div class="actions">
          <button class="btn" type="button" @click="() => {
            name.value = '김웨딩';
            email.value = 'wedding@example.com';
            message.value = 'AI 일정 추천 베타 테스트 참여를 희망합니다.';
          }">
            샘플 채우기
          </button>
          <button class="btn primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '전송 중...' : '문의하기' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
  padding: 24px;
  backdrop-filter: blur(4px);
}

.modal-card {
  width: min(520px, 100%);
  background: var(--card);
  border-radius: 18px;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.modal-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 4px;
}

.description {
  margin: 16px 0 24px;
  color: var(--muted);
  line-height: 1.6;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
}

input,
textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text);
  font-size: 14px;
  transition: border 0.2s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 139, 92, 246), 0.25);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.icon-btn {
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  width: 36px;
  height: 36px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

@media (max-width: 600px) {
  .modal-card {
    padding: 22px;
  }

  .actions {
    flex-direction: column;
  }
}
</style>

