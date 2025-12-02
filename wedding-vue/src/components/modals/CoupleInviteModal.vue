<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="couple-invite-modal" @click.stop>
      <div class="modal-header">
        <h3>💕 {{ partnerGenderLabel }} 초대하기</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="modal-body">
        <p class="invite-description">
          {{ partnerGenderLabel }}을 초대하여 커플 기능을 사용해보세요!
        </p>
        
        <div class="invite-section">
          <label>초대 링크</label>
          <div class="link-box">
            <code class="invite-link">{{ inviteLink }}</code>
            <button class="btn-copy" @click="copyLink">
              복사
            </button>
          </div>
        </div>
        
        <div class="invite-section">
          <label>또는 커플 키</label>
          <div class="link-box">
            <code class="couple-key">{{ coupleKey }}</code>
            <button class="btn-copy" @click="copyKey">
              복사
            </button>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="enter-code-section">
          <h4>내 반쪽 코드 입력하기</h4>
          <p class="enter-code-description">
            상대방의 코드를 입력하면 서로 매칭됩니다. 상대방도 당신의 코드를 입력해야 연결이 완료됩니다.
          </p>
          <div class="code-input-box">
            <input
              v-model="partnerCodeInput"
              type="text"
              placeholder="상대방의 코드를 입력하세요"
              class="code-input"
              maxlength="8"
              @input="partnerCodeInput = partnerCodeInput.toUpperCase()"
            />
            <button 
              class="btn-connect" 
              @click="enterPartnerCode"
              :disabled="!partnerCodeInput.trim() || isConnecting"
            >
              {{ isConnecting ? '연결 중...' : '입력하기' }}
            </button>
          </div>
          <div v-if="connectionMessage" :class="['connection-message', connectionMessageType]">
            {{ connectionMessage }}
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="hideToday">
            오늘 하루 그만 보기
          </button>
          <button class="btn-primary" @click="handleClose">
            확인
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '@/composables/useApi'

const props = defineProps<{
  show: boolean
  coupleKey: string | null
  gender: 'BRIDE' | 'GROOM' | null
}>()

const emit = defineEmits<{
  close: []
  connected: []
}>()

const { request } = useApi()
const partnerCodeInput = ref('')
const isConnecting = ref(false)
const connectionMessage = ref('')
const connectionMessageType = ref<'success' | 'error' | 'info'>('info')

const partnerGenderLabel = computed(() => {
  if (props.gender === 'BRIDE') return '신랑'
  if (props.gender === 'GROOM') return '신부'
  return '파트너'
})

const inviteLink = computed(() => {
  if (!props.coupleKey) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}?invite=${props.coupleKey}`
})

function copyLink() {
  if (inviteLink.value) {
    navigator.clipboard.writeText(inviteLink.value)
    alert('초대 링크가 복사되었습니다!')
  }
}

function copyKey() {
  if (props.coupleKey) {
    navigator.clipboard.writeText(props.coupleKey)
    alert('커플 키가 복사되었습니다!')
  }
}

function hideToday() {
  const today = new Date().toDateString()
  localStorage.setItem('couple_invite_hidden_date', today)
  handleClose()
}

async function enterPartnerCode() {
  if (!partnerCodeInput.value.trim()) {
    return
  }

  isConnecting.value = true
  connectionMessage.value = ''
  
  try {
    const response = await request<{
      message: string
      data: {
        couple_id?: number
        partner_id?: number
        partner_nickname?: string
        connected_at?: string
        message?: string
        waiting_for_partner?: boolean
      }
    }>('/couple/connect', {
      method: 'POST',
      body: {
        partner_couple_key: partnerCodeInput.value.trim().toUpperCase()
      }
    })

    if (response.message === 'couple_connected') {
      connectionMessage.value = `🎉 ${response.data.partner_nickname}님과 연결되었습니다!`
      connectionMessageType.value = 'success'
      setTimeout(() => {
        emit('connected')
        handleClose()
      }, 2000)
    } else if (response.message === 'couple_pending') {
      connectionMessage.value = '⏳ 상대방이 아직 코드를 입력하지 않았습니다. 상대방도 코드를 입력하면 연결됩니다.'
      connectionMessageType.value = 'info'
      partnerCodeInput.value = ''
    } else {
      connectionMessage.value = response.data?.message || '연결에 실패했습니다.'
      connectionMessageType.value = 'error'
    }
  } catch (error: any) {
    console.error('커플 연결 오류:', error)
    
    // 네트워크 오류 처리
    if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
      connectionMessage.value = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
    } else if (error?.data?.error) {
      connectionMessage.value = error.data.error
    } else if (error?.data?.message) {
      connectionMessage.value = error.data.message
    } else if (error?.message) {
      connectionMessage.value = error.message
    } else {
      connectionMessage.value = '연결 중 오류가 발생했습니다.'
    }
    
    connectionMessageType.value = 'error'
  } finally {
    isConnecting.value = false
  }
}

function handleClose() {
  partnerCodeInput.value = ''
  connectionMessage.value = ''
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.couple-invite-modal {
  background: var(--card, #ffffff);
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text, #333);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text, #666);
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

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text, #333);
}

.modal-body {
  padding: 24px;
}

.invite-description {
  margin: 0 0 24px 0;
  color: var(--muted, #666);
  font-size: 14px;
  line-height: 1.6;
}

.invite-section {
  margin-bottom: 20px;
}

.invite-section label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #333);
}

.link-box {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: var(--soft, #f5f5f5);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.invite-link,
.couple-key {
  flex: 1;
  font-size: 14px;
  word-break: break-all;
  color: var(--text, #333);
  font-family: 'Courier New', monospace;
  padding: 4px 0;
}

.couple-key {
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.btn-copy {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-secondary {
  flex: 1;
  padding: 12px;
  background: var(--soft, #f5f5f5);
  color: var(--text, #666);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--soft, #e5e5e5);
}

.btn-primary {
  flex: 1;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 24px 0;
}

.enter-code-section {
  margin-bottom: 24px;
}

.enter-code-section h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text, #333);
}

.enter-code-description {
  margin: 0 0 16px 0;
  color: var(--muted, #666);
  font-size: 13px;
  line-height: 1.5;
}

.code-input-box {
  display: flex;
  gap: 8px;
  align-items: center;
}

.code-input {
  flex: 1;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 16px;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  color: var(--text, #333);
}

.code-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-connect {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-connect:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
}

.btn-connect:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.connection-message {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.connection-message.success {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.connection-message.error {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.connection-message.info {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
  border: 1px solid rgba(33, 150, 243, 0.3);
}
</style>

