<template>
  <div class="digital-invitation-view">
    <!-- 디지털 초대장 페이지 (공개 접근) -->
    <div v-if="invitation" class="invitation-page">
      <div class="invitation-header" :class="`theme-${invitation.theme}`">
        <h1 class="couple-names">{{ invitation.groom_name }} · {{ invitation.bride_name }}</h1>
        <p class="wedding-date">{{ formatDate(invitation.wedding_date) }} {{ invitation.wedding_time || '' }}</p>
      </div>

      <div class="invitation-content">
        <div class="section">
          <h2>💒 예식 안내</h2>
          <p><strong>장소:</strong> {{ invitation.wedding_location }}</p>
          <p v-if="invitation.wedding_location_detail">{{ invitation.wedding_location_detail }}</p>
          <div v-if="invitation.map_url" class="map-link">
            <a :href="invitation.map_url" target="_blank">📍 지도 보기</a>
          </div>
          <div v-if="invitation.parking_info" class="parking-info">
            <p><strong>주차 안내:</strong> {{ invitation.parking_info }}</p>
          </div>
        </div>

        <div class="actions-section">
          <button class="action-btn primary" @click="showRSVPModal = true">
            📝 참석 여부 알려주기
          </button>
          <button class="action-btn secondary" @click="showPaymentModal = true">
            💰 축의금 보내기
          </button>
          <button class="action-btn secondary" @click="showMessageModal = true">
            💌 축하 메시지 남기기
          </button>
        </div>

        <div class="section">
          <h2>💬 축하 메시지</h2>
          <div v-if="guestMessages.length === 0" class="empty-state">
            아직 축하 메시지가 없습니다.
          </div>
          <div v-else class="messages-list">
            <div v-for="msg in guestMessages" :key="msg.id" class="message-item">
              <div class="message-header">
                <strong>{{ msg.guest_name }}</strong>
                <span class="message-date">{{ formatDate(msg.created_at) }}</span>
              </div>
              <p v-if="msg.message">{{ msg.message }}</p>
              <img v-if="msg.image_url" :src="msg.image_url" alt="축하 사진" class="message-image" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RSVP 모달 -->
    <div v-if="showRSVPModal" class="modal-overlay" @click.self="showRSVPModal = false">
      <div class="modal-content">
        <h2>참석 여부 알려주기</h2>
        <form @submit.prevent="submitRSVP">
          <div class="form-group">
            <label>이름 *</label>
            <input v-model="rsvpForm.guest_name" type="text" required />
          </div>
          <div class="form-group">
            <label>전화번호</label>
            <input v-model="rsvpForm.guest_phone" type="tel" />
          </div>
          <div class="form-group">
            <label>이메일</label>
            <input v-model="rsvpForm.guest_email" type="email" />
          </div>
          <div class="form-group">
            <label>참석 여부 *</label>
            <select v-model="rsvpForm.status" required>
              <option value="ATTENDING">참석합니다</option>
              <option value="NOT_ATTENDING">불참합니다</option>
              <option value="MAYBE">미정입니다</option>
            </select>
          </div>
          <div class="form-group">
            <label>
              <input v-model="rsvpForm.plus_one" type="checkbox" />
              동반자와 함께 참석합니다
            </label>
            <input 
              v-if="rsvpForm.plus_one" 
              v-model="rsvpForm.plus_one_name" 
              type="text" 
              placeholder="동반자 이름"
              style="margin-top: 8px;"
            />
          </div>
          <div class="form-group">
            <label>식이 제한사항 (알레르기 등)</label>
            <textarea v-model="rsvpForm.dietary_restrictions" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>특별 요청사항</label>
            <textarea v-model="rsvpForm.special_requests" rows="2"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showRSVPModal = false">취소</button>
            <button type="submit" class="btn-primary" :disabled="submittingRSVP">
              {{ submittingRSVP ? '제출 중...' : '제출' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 결제 모달 -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-content">
        <h2>축의금 보내기</h2>
        <form @submit.prevent="submitPayment">
          <div class="form-group">
            <label>보내는 분 이름 *</label>
            <input v-model="paymentForm.payer_name" type="text" required />
          </div>
          <div class="form-group">
            <label>전화번호</label>
            <input v-model="paymentForm.payer_phone" type="tel" />
          </div>
          <div class="form-group">
            <label>금액 *</label>
            <input v-model.number="paymentForm.amount" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>결제 방법 *</label>
            <select v-model="paymentForm.payment_method" required>
              <option value="BANK_TRANSFER">계좌이체</option>
              <option value="KAKAO_PAY">카카오페이</option>
              <option value="TOSS">토스</option>
              <option value="CREDIT_CARD">신용카드</option>
            </select>
          </div>
          <div class="form-group">
            <label>축하 메시지</label>
            <textarea v-model="paymentForm.payer_message" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showPaymentModal = false">취소</button>
            <button type="submit" class="btn-primary" :disabled="submittingPayment">
              {{ submittingPayment ? '결제 중...' : '결제하기' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 메시지 모달 -->
    <div v-if="showMessageModal" class="modal-overlay" @click.self="showMessageModal = false">
      <div class="modal-content">
        <h2>축하 메시지 남기기</h2>
        <form @submit.prevent="submitMessage">
          <div class="form-group">
            <label>이름 *</label>
            <input v-model="messageForm.guest_name" type="text" required />
          </div>
          <div class="form-group">
            <label>전화번호</label>
            <input v-model="messageForm.guest_phone" type="tel" />
          </div>
          <div class="form-group">
            <label>메시지</label>
            <textarea v-model="messageForm.message" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>사진 업로드</label>
            <input type="file" @change="handleImageUpload" accept="image/*" />
            <img v-if="messageForm.image_url" :src="messageForm.image_url" alt="업로드된 사진" style="max-width: 200px; margin-top: 8px;" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showMessageModal = false">취소</button>
            <button type="submit" class="btn-primary" :disabled="submittingMessage">
              {{ submittingMessage ? '전송 중...' : '전송' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { request } = useApi()
const { showToast } = useToast()

const invitation = ref<any>(null)
const guestMessages = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const showRSVPModal = ref(false)
const showPaymentModal = ref(false)
const showMessageModal = ref(false)

const rsvpForm = ref({
  guest_name: '',
  guest_phone: '',
  guest_email: '',
  status: 'ATTENDING',
  plus_one: false,
  plus_one_name: '',
  dietary_restrictions: '',
  special_requests: ''
})

const paymentForm = ref({
  payer_name: '',
  payer_phone: '',
  amount: 0,
  payment_method: 'BANK_TRANSFER',
  payer_message: ''
})

const messageForm = ref({
  guest_name: '',
  guest_phone: '',
  message: '',
  image_url: ''
})

const submittingRSVP = ref(false)
const submittingPayment = ref(false)
const submittingMessage = ref(false)

async function fetchInvitation() {
  const invitationUrl = route.params.url as string
  if (!invitationUrl) {
    error.value = '초대장 URL이 없습니다.'
    return
  }

  loading.value = true
  error.value = null
  try {
    const res = await request<{
      message: string
      data: any
    }>(`/digital-invitations/${invitationUrl}`, {
      method: 'GET',
    })
    invitation.value = res.data

    // 하객 메시지도 함께 로드
    if (invitation.value.id) {
      await fetchGuestMessages()
    }
  } catch (err: any) {
    console.error('초대장 로드 실패:', err)
    error.value = err?.data?.error || err?.message || '초대장을 불러올 수 없습니다.'
  } finally {
    loading.value = false
  }
}

async function fetchGuestMessages() {
  if (!invitation.value || !invitation.value.id) return

  try {
    const res = await request<{
      message: string
      data: { messages: any[] }
    }>(`/digital-invitations/${invitation.value.id}/guest-messages`, {
      method: 'GET',
    })
    guestMessages.value = res.data.messages || []
  } catch (err: any) {
    console.error('메시지 로드 실패:', err)
  }
}

async function submitRSVP() {
  if (!invitation.value) return

  submittingRSVP.value = true
  try {
    await request(`/digital-invitations/${invitation.value.id}/rsvps`, {
      method: 'POST',
      body: {
        invitation_id: invitation.value.id,
        ...rsvpForm.value
      }
    })
    showToast('참석 여부가 등록되었습니다.', 'success')
    showRSVPModal.value = false
    rsvpForm.value = {
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      status: 'ATTENDING',
      plus_one: false,
      plus_one_name: '',
      dietary_restrictions: '',
      special_requests: ''
    }
  } catch (err: any) {
    console.error('RSVP 제출 실패:', err)
    showToast(err?.data?.error || err?.message || '참석 여부 등록에 실패했습니다.', 'error')
  } finally {
    submittingRSVP.value = false
  }
}

async function submitPayment() {
  if (!invitation.value) return

  submittingPayment.value = true
  try {
    await request(`/digital-invitations/${invitation.value.id}/payments`, {
      method: 'POST',
      body: {
        invitation_id: invitation.value.id,
        ...paymentForm.value
      }
    })
    showToast('축의금 결제가 완료되었습니다.', 'success')
    showPaymentModal.value = false
    paymentForm.value = {
      payer_name: '',
      payer_phone: '',
      amount: 0,
      payment_method: 'BANK_TRANSFER',
      payer_message: ''
    }
  } catch (err: any) {
    console.error('결제 실패:', err)
    showToast(err?.data?.error || err?.message || '결제에 실패했습니다.', 'error')
  } finally {
    submittingPayment.value = false
  }
}

async function submitMessage() {
  if (!invitation.value) return

  submittingMessage.value = true
  try {
    await request(`/digital-invitations/${invitation.value.id}/guest-messages`, {
      method: 'POST',
      body: {
        invitation_id: invitation.value.id,
        ...messageForm.value
      }
    })
    showToast('축하 메시지가 등록되었습니다.', 'success')
    showMessageModal.value = false
    messageForm.value = {
      guest_name: '',
      guest_phone: '',
      message: '',
      image_url: ''
    }
    await fetchGuestMessages()
  } catch (err: any) {
    console.error('메시지 전송 실패:', err)
    showToast(err?.data?.error || err?.message || '메시지 전송에 실패했습니다.', 'error')
  } finally {
    submittingMessage.value = false
  }
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      messageForm.value.image_url = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

onMounted(() => {
  fetchInvitation()
})
</script>

<style scoped>
.digital-invitation-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.invitation-page {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.invitation-header {
  padding: 48px 24px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.couple-names {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 12px;
}

.wedding-date {
  font-size: 18px;
  opacity: 0.9;
}

.invitation-content {
  padding: 32px 24px;
}

.section {
  margin-bottom: 32px;
}

.section h2 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #333;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 32px 0;
}

.action-btn {
  padding: 16px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #333;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.message-date {
  font-size: 12px;
  color: #666;
}

.message-image {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.loading,
.error {
  text-align: center;
  padding: 48px;
  font-size: 18px;
}

/* 모바일 스타일 */
@media (max-width: 768px) {
  .digital-invitation-view {
    padding: 12px;
  }

  .invitation-page {
    max-width: 100%;
    border-radius: 12px;
  }

  .invitation-header {
    padding: 32px 16px;
  }

  .couple-names {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .wedding-date {
    font-size: 14px;
  }

  .invitation-content {
    padding: 20px 16px;
  }

  .section {
    margin-bottom: 24px;
  }

  .section h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .actions-section {
    gap: 10px;
    margin: 24px 0;
  }

  .action-btn {
    padding: 14px;
    font-size: 14px;
  }

  .message-item {
    padding: 12px;
  }

  .modal-content {
    padding: 24px 16px;
    width: 95%;
    max-width: none;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 10px;
    font-size: 14px;
  }

  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    padding: 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .couple-names {
    font-size: 20px;
  }

  .wedding-date {
    font-size: 12px;
  }

  .action-btn {
    padding: 12px;
    font-size: 13px;
  }
}
</style>

