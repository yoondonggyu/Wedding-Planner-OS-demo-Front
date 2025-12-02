<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

interface Template {
  id: number
  name: string
  style: string
  preview_image_url: string | null
  template_data: any
}

interface Design {
  id: number
  template_id: number | null
  design_data: any
  qr_code_url: string | null
  preview_image_url: string | null
  status: string
  created_at: string | null
}

const authStore = useAuthStore()
const { request } = useApi()
const { showToast } = useToast()

const templates = ref<Template[]>([])
const designs = ref<Design[]>([])
const digitalInvitations = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showStatisticsModal = ref(false)
const statistics = ref<any>(null)

const selectedTemplateId = ref<number | null>(null)
const selectedDesignId = ref<number | null>(null)
const currentDesign = ref<Design | null>(null)

// 디자인 에디터 상태
const showEditor = ref(false)
const designData = ref<any>({
  main_text: '',
  groom_name: '',
  bride_name: '',
  groom_parents: '',
  bride_parents: '',
  wedding_info: '',
  reception_info: '',
  closing_text: '',
  background_color: '#FFFFFF',
  text_color: '#000000',
  font_name: 'Helvetica',
  font_size: 12,
  image_url: null
})

// QR 코드 설정
const qrCodeData = ref({
  digital_invitation_url: '',
  payment_url: '',
  rsvp_url: ''
})

// AI 문구 추천
const showTextRecommendModal = ref(false)
const textRecommendForm = ref({
  groom_name: '',
  bride_name: '',
  wedding_date: '',
  wedding_time: '',
  wedding_location: '',
  style: '',
  additional_info: ''
})
const recommending = ref(false)
const recommendedText = ref<any>(null)

// PDF 생성
const generatingPDF = ref(false)

const canEdit = computed(() => authStore.isAuthenticated)

async function fetchTemplates() {
  loading.value = true
  error.value = null
  try {
    const res = await request<{
      message: string
      data: { templates: Template[] }
    }>('/invitation-templates', {
      method: 'GET',
    })
    templates.value = res.data?.templates ?? []
    
    // 템플릿이 없을 경우 더미 데이터 제공 (데모용)
    if (templates.value.length === 0) {
      templates.value = [
        {
          id: 1,
          name: '클래식 엘레강스',
          style: 'CLASSIC',
          preview_image_url: null,
          template_data: {
            background_color: '#F5F5DC',
            text_color: '#2C2C2C',
            font_name: 'Times New Roman',
            font_size: 14,
            layout: 'centered'
          }
        },
        {
          id: 2,
          name: '모던 미니멀',
          style: 'MODERN',
          preview_image_url: null,
          template_data: {
            background_color: '#FFFFFF',
            text_color: '#1A1A1A',
            font_name: 'Helvetica',
            font_size: 12,
            layout: 'minimal'
          }
        },
        {
          id: 3,
          name: '빈티지 로맨틱',
          style: 'VINTAGE',
          preview_image_url: null,
          template_data: {
            background_color: '#FFF8E7',
            text_color: '#4A4A4A',
            font_name: 'Georgia',
            font_size: 13,
            layout: 'vintage'
          }
        }
      ]
    }
  } catch (err: any) {
    console.error('템플릿 로드 실패:', err)
    // 에러가 발생해도 더미 데이터로 계속 진행
    templates.value = [
      {
        id: 1,
        name: '클래식 엘레강스',
        style: 'CLASSIC',
        preview_image_url: null,
        template_data: {
          background_color: '#F5F5DC',
          text_color: '#2C2C2C',
          font_name: 'Times New Roman',
          font_size: 14,
          layout: 'centered'
        }
      },
      {
        id: 2,
        name: '모던 미니멀',
        style: 'MODERN',
        preview_image_url: null,
        template_data: {
          background_color: '#FFFFFF',
          text_color: '#1A1A1A',
          font_name: 'Helvetica',
          font_size: 12,
          layout: 'minimal'
        }
      }
    ]
    error.value = null // 에러를 표시하지 않고 더미 데이터 사용
  } finally {
    loading.value = false
  }
}

async function fetchDesigns() {
  if (!canEdit.value) return
  
  try {
    const res = await request<{
      message: string
      data: { designs: Design[] }
    }>('/invitation-designs', {
      method: 'GET',
    })
    designs.value = res.data?.designs ?? []
  } catch (err: any) {
    console.error('디자인 목록 로드 실패:', err)
  }
}

function selectTemplate(templateId: number) {
  selectedTemplateId.value = templateId
  const template = templates.value.find(t => t.id === templateId)
  if (template) {
    // 템플릿 데이터로 초기화
    designData.value = {
      ...designData.value,
      ...template.template_data
    }
    showEditor.value = true
  }
}

function startNewDesign() {
  selectedTemplateId.value = null
  selectedDesignId.value = null
  currentDesign.value = null
  designData.value = {
    main_text: '',
    groom_name: '',
    bride_name: '',
    groom_parents: '',
    bride_parents: '',
    wedding_info: '',
    reception_info: '',
    closing_text: '',
    background_color: '#FFFFFF',
    text_color: '#000000',
    font_name: 'Helvetica',
    font_size: 12,
    image_url: null
  }
  qrCodeData.value = {
    digital_invitation_url: '',
    payment_url: '',
    rsvp_url: ''
  }
  showEditor.value = true
}

async function saveDesign() {
  if (!canEdit.value) {
    showToast('로그인이 필요합니다.', 'error')
    return
  }

  try {
    const payload: any = {
      template_id: selectedTemplateId.value,
      design_data: designData.value
    }

    if (qrCodeData.value.digital_invitation_url || qrCodeData.value.payment_url || qrCodeData.value.rsvp_url) {
      payload.qr_code_data = qrCodeData.value
    }

    if (selectedDesignId.value) {
      // 수정
      await request(`/invitation-designs/${selectedDesignId.value}`, {
        method: 'PUT',
        body: payload
      })
      showToast('디자인이 저장되었습니다.', 'success')
    } else {
      // 생성
      const res = await request<{
        message: string
        data: { id: number }
      }>('/invitation-designs', {
        method: 'POST',
        body: payload
      })
      selectedDesignId.value = res.data?.id
      showToast('디자인이 생성되었습니다.', 'success')
    }

    await fetchDesigns()
  } catch (err: any) {
    console.error('디자인 저장 실패:', err)
    showToast(err?.data?.error || err?.message || '디자인 저장에 실패했습니다.', 'error')
  }
}

async function recommendText() {
  if (!textRecommendForm.value.groom_name || !textRecommendForm.value.bride_name || !textRecommendForm.value.wedding_date) {
    showToast('신랑 이름, 신부 이름, 예식일을 입력해주세요.', 'error')
    return
  }

  recommending.value = true
  try {
    const res = await request<{
      message: string
      data: any
    }>('/invitation-text-recommend', {
      method: 'POST',
      body: textRecommendForm.value
    })
    recommendedText.value = res.data
    showToast('문구 추천이 완료되었습니다.', 'success')
  } catch (err: any) {
    console.error('문구 추천 실패:', err)
    // AI 기능이 아직 구현되지 않은 경우 기본 문구 제공
    recommendedText.value = {
      main_text: `${textRecommendForm.value.groom_name} · ${textRecommendForm.value.bride_name} 두 사람이 하나가 되어\n새로운 인생을 시작합니다.`,
      groom_parents: '신랑 부모님',
      bride_parents: '신부 부모님',
      wedding_info: `${textRecommendForm.value.wedding_date} ${textRecommendForm.value.wedding_time || ''} ${textRecommendForm.value.wedding_location || ''}`,
      reception_info: textRecommendForm.value.wedding_location || '',
      closing_text: '바쁘시겠지만 참석해 주시면 감사하겠습니다.'
    }
    showToast('기본 문구가 생성되었습니다. (AI 기능 준비 중)', 'success')
  } finally {
    recommending.value = false
  }
}

function applyRecommendedText() {
  if (recommendedText.value) {
    designData.value.main_text = recommendedText.value.main_text || ''
    designData.value.groom_parents = recommendedText.value.groom_parents || ''
    designData.value.bride_parents = recommendedText.value.bride_parents || ''
    designData.value.wedding_info = recommendedText.value.wedding_info || ''
    designData.value.reception_info = recommendedText.value.reception_info || ''
    designData.value.closing_text = recommendedText.value.closing_text || ''
    showTextRecommendModal.value = false
    showToast('추천 문구가 적용되었습니다.', 'success')
  }
}

async function createDigitalInvitation() {
  if (!selectedDesignId.value) {
    showToast('먼저 디자인을 저장해주세요.', 'error')
    return
  }

  if (!designData.value.groom_name || !designData.value.bride_name) {
    showToast('신랑 이름과 신부 이름을 입력해주세요.', 'error')
    return
  }

  try {
    // 디지털 초대장 생성
    const weddingDate = designData.value.wedding_date || textRecommendForm.value.wedding_date
    if (!weddingDate) {
      showToast('예식일을 입력해주세요.', 'error')
      return
    }

    const res = await request<{
      message: string
      data: {
        id: number
        invitation_url: string
        full_url: string
      }
    }>('/digital-invitations', {
      method: 'POST',
      body: {
        invitation_design_id: selectedDesignId.value,
        theme: 'CLASSIC', // 기본값, 나중에 선택 가능하도록
        groom_name: designData.value.groom_name,
        bride_name: designData.value.bride_name,
        wedding_date: weddingDate,
        wedding_time: designData.value.wedding_time || textRecommendForm.value.wedding_time,
        wedding_location: designData.value.wedding_info || textRecommendForm.value.wedding_location || '',
        wedding_location_detail: designData.value.reception_info,
        invitation_data: designData.value
      }
    })

    // QR 코드 데이터 업데이트
    qrCodeData.value.digital_invitation_url = res.data.full_url
    qrCodeData.value.payment_url = `${res.data.full_url}/payment`
    qrCodeData.value.rsvp_url = `${res.data.full_url}/rsvp`

    // 디자인 업데이트
    await request(`/invitation-designs/${selectedDesignId.value}`, {
      method: 'PUT',
      body: {
        design_data: designData.value,
        qr_code_data: qrCodeData.value
      }
    })

    showToast(`디지털 초대장이 생성되었습니다! URL: ${res.data.full_url}`, 'success')
  } catch (err: any) {
    console.error('디지털 초대장 생성 실패:', err)
    showToast(err?.data?.error || err?.message || '디지털 초대장 생성에 실패했습니다.', 'error')
  }
}

async function generatePDF() {
  if (!selectedDesignId.value) {
    showToast('먼저 디자인을 저장해주세요.', 'error')
    return
  }

  generatingPDF.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8101'}/api/invitation-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.accessToken}`
      },
      body: JSON.stringify({
        design_id: selectedDesignId.value,
        paper_size: 'A5',
        dpi: 300
      })
    })

    if (!res.ok) {
      throw new Error('PDF 생성 실패')
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invitation_${selectedDesignId.value}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    showToast('PDF가 다운로드되었습니다.', 'success')
  } catch (err: any) {
    console.error('PDF 생성 실패:', err)
    showToast('PDF 생성에 실패했습니다.', 'error')
  } finally {
    generatingPDF.value = false
  }
}

async function fetchMyDigitalInvitations() {
  if (!canEdit.value) return

  try {
    const res = await request<{
      message: string
      data: { invitations: any[] }
    }>('/digital-invitations/my', {
      method: 'GET',
    })
    digitalInvitations.value = res.data?.invitations ?? []
  } catch (err: any) {
    console.error('디지털 초대장 목록 로드 실패:', err)
  }
}

async function viewStatistics(invitationId: number) {
  try {
    const res = await request<{
      message: string
      data: any
    }>(`/digital-invitations/${invitationId}/statistics`, {
      method: 'GET',
    })
    statistics.value = res.data
    showStatisticsModal.value = true
  } catch (err: any) {
    console.error('통계 로드 실패:', err)
    showToast(err?.data?.error || err?.message || '통계를 불러올 수 없습니다.', 'error')
  }
}

onMounted(() => {
  fetchTemplates()
  if (canEdit.value) {
    fetchDesigns()
    fetchMyDigitalInvitations()
  }
})
</script>

<template>
  <div class="invitation-design-view">
    <div class="header">
      <h1>💌 청첩장 디자인</h1>
      <p class="description">템플릿을 선택하고 문구를 편집하여 나만의 청첩장을 만들어보세요.</p>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="content">
      <!-- 템플릿 선택 섹션 -->
      <div v-if="!showEditor" class="templates-section">
        <div class="section-header">
          <h2>템플릿 선택</h2>
          <button v-if="canEdit" class="btn-primary" @click="startNewDesign">
            <span>➕</span>
            <span>새 디자인 시작</span>
          </button>
        </div>

        <div class="templates-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            @click="selectTemplate(template.id)"
          >
            <div class="template-preview">
              <img
                v-if="template.preview_image_url"
                :src="template.preview_image_url"
                :alt="template.name"
              />
              <div v-else class="template-placeholder">{{ template.name }}</div>
            </div>
            <div class="template-info">
              <h3>{{ template.name }}</h3>
              <span class="template-style">{{ template.style }}</span>
            </div>
          </div>
        </div>

        <!-- 내 디자인 목록 -->
        <div v-if="canEdit && designs.length > 0" class="my-designs-section">
          <div class="section-header">
            <h2>내 디자인</h2>
            <button class="btn-secondary" @click="fetchMyDigitalInvitations">
              📱 디지털 초대장 관리
            </button>
          </div>
          <div class="designs-grid">
            <div
              v-for="design in designs"
              :key="design.id"
              class="design-card"
              @click="selectedDesignId = design.id; currentDesign = design; showEditor = true"
            >
              <div class="design-preview">
                <img
                  v-if="design.preview_image_url"
                  :src="design.preview_image_url"
                  alt="디자인 미리보기"
                />
                <div v-else class="design-placeholder">디자인 {{ design.id }}</div>
              </div>
              <div class="design-info">
                <span class="design-status">{{ design.status }}</span>
                <span class="design-date">{{ design.created_at ? new Date(design.created_at).toLocaleDateString('ko-KR') : '' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 디지털 초대장 목록 -->
        <div v-if="canEdit && digitalInvitations.length > 0" class="digital-invitations-section">
          <h2>디지털 초대장</h2>
          <div class="invitations-list">
            <div
              v-for="inv in digitalInvitations"
              :key="inv.id"
              class="invitation-card"
            >
              <div class="invitation-info">
                <h3>{{ inv.groom_name }} · {{ inv.bride_name }}</h3>
                <p>{{ inv.wedding_date ? new Date(inv.wedding_date).toLocaleDateString('ko-KR') : '' }}</p>
                <a :href="inv.full_url" target="_blank" class="invitation-link">{{ inv.full_url }}</a>
                <div class="invitation-stats">
                  <span>👁️ {{ inv.view_count }}회 조회</span>
                </div>
              </div>
              <div class="invitation-actions">
                <button class="btn-secondary" @click="viewStatistics(inv.id)">📊 통계 보기</button>
                <a :href="inv.full_url" target="_blank" class="btn-primary">🔗 열기</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 디자인 에디터 -->
      <div v-else class="editor-section">
        <div class="editor-header">
          <button class="btn-secondary" @click="showEditor = false">
            ← 목록으로
          </button>
          <div class="editor-actions">
            <button class="btn-secondary" @click="showTextRecommendModal = true">
              🤖 AI 문구 추천
            </button>
            <button class="btn-primary" @click="saveDesign">
              💾 저장
            </button>
            <button
              v-if="selectedDesignId"
              class="btn-primary"
              @click="generatePDF"
              :disabled="generatingPDF"
            >
              {{ generatingPDF ? '생성 중...' : '📄 PDF 다운로드' }}
            </button>
          </div>
        </div>

        <div class="editor-content">
          <div class="editor-panel">
            <h3>디자인 설정</h3>

            <div class="form-group">
              <label>신랑 이름</label>
              <input v-model="designData.groom_name" type="text" placeholder="신랑 이름" />
            </div>

            <div class="form-group">
              <label>신부 이름</label>
              <input v-model="designData.bride_name" type="text" placeholder="신부 이름" />
            </div>

            <div class="form-group">
              <label>주요 문구</label>
              <textarea
                v-model="designData.main_text"
                rows="4"
                placeholder="두 사람이 하나가 되어..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>신랑 부모님</label>
              <input v-model="designData.groom_parents" type="text" placeholder="신랑 부모님 성함" />
            </div>

            <div class="form-group">
              <label>신부 부모님</label>
              <input v-model="designData.bride_parents" type="text" placeholder="신부 부모님 성함" />
            </div>

            <div class="form-group">
              <label>예식 정보</label>
              <textarea
                v-model="designData.wedding_info"
                rows="3"
                placeholder="예식일, 시간, 장소"
              ></textarea>
            </div>

            <div class="form-group">
              <label>식장 정보</label>
              <textarea
                v-model="designData.reception_info"
                rows="2"
                placeholder="식장 정보 (선택)"
              ></textarea>
            </div>

            <div class="form-group">
              <label>마무리 문구</label>
              <textarea
                v-model="designData.closing_text"
                rows="2"
                placeholder="바쁘시겠지만 참석해 주시면..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>배경색</label>
              <input v-model="designData.background_color" type="color" />
            </div>

            <div class="form-group">
              <label>텍스트 색상</label>
              <input v-model="designData.text_color" type="color" />
            </div>

            <h3 style="margin-top: 24px;">QR 코드 설정</h3>

            <div class="form-group">
              <label>디지털 초대장 URL</label>
              <div style="display: flex; gap: 8px;">
                <input
                  v-model="qrCodeData.digital_invitation_url"
                  type="url"
                  placeholder="자동 생성 또는 직접 입력"
                  style="flex: 1;"
                />
                <button 
                  v-if="selectedDesignId && designData.groom_name && designData.bride_name && designData.wedding_date"
                  type="button"
                  class="btn-secondary"
                  @click="createDigitalInvitation"
                  style="white-space: nowrap;"
                >
                  📱 디지털 초대장 생성
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>축의금 결제 URL</label>
              <input
                v-model="qrCodeData.payment_url"
                type="url"
                placeholder="https://..."
              />
            </div>

            <div class="form-group">
              <label>RSVP URL</label>
              <input
                v-model="qrCodeData.rsvp_url"
                type="url"
                placeholder="https://..."
              />
            </div>

            <div v-if="qrCodeData.digital_invitation_url || qrCodeData.payment_url || qrCodeData.rsvp_url" class="qr-preview">
              <img v-if="currentDesign?.qr_code_url" :src="currentDesign.qr_code_url" alt="QR 코드" />
              <div v-else style="padding: 20px; text-align: center; background: rgba(0,0,0,0.1); border-radius: 8px; color: var(--muted); font-size: 12px">
                <div style="font-size: 32px; margin-bottom: 8px">📱</div>
                <div>QR 코드는 저장 후 생성됩니다.</div>
                <div style="margin-top: 8px; font-size: 11px">디자인을 저장하면 QR 코드가 자동으로 생성됩니다.</div>
              </div>
            </div>
          </div>

          <div class="preview-panel">
            <h3>미리보기</h3>
            <div
              class="preview-card"
              :style="{
                backgroundColor: designData.background_color,
                color: designData.text_color,
                fontFamily: designData.font_name,
                fontSize: `${designData.font_size}px`
              }"
            >
              <div class="preview-content">
                <p v-if="designData.main_text" class="main-text">{{ designData.main_text }}</p>
                <p v-if="designData.groom_name && designData.bride_name" class="names">
                  {{ designData.groom_name }} · {{ designData.bride_name }}
                </p>
                <p v-if="designData.wedding_info" class="wedding-info">{{ designData.wedding_info }}</p>
                <p v-if="designData.reception_info" class="reception-info">{{ designData.reception_info }}</p>
                <p v-if="designData.closing_text" class="closing-text">{{ designData.closing_text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 통계 모달 -->
    <div v-if="showStatisticsModal && statistics" class="modal-overlay" @click.self="showStatisticsModal = false">
      <div class="modal-content" style="max-width: 700px;">
        <h2>📊 초대장 통계</h2>
        <div class="statistics-grid">
          <div class="stat-card">
            <div class="stat-label">조회수</div>
            <div class="stat-value">{{ statistics.view_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">총 RSVP</div>
            <div class="stat-value">{{ statistics.total_rsvps }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">참석 예정</div>
            <div class="stat-value">{{ statistics.attending_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">총 인원</div>
            <div class="stat-value">{{ statistics.total_guests }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">완료된 결제</div>
            <div class="stat-value">{{ statistics.completed_payments }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">총 축의금</div>
            <div class="stat-value">{{ statistics.total_amount?.toLocaleString() }}원</div>
          </div>
        </div>
        <div class="statistics-details">
          <h3>RSVP 상세</h3>
          <ul>
            <li>참석: {{ statistics.attending_count }}명</li>
            <li>불참: {{ statistics.not_attending_count }}명</li>
            <li>미정: {{ statistics.maybe_count }}명</li>
            <li>미응답: {{ statistics.pending_rsvps }}명</li>
          </ul>
          <h3 style="margin-top: 24px;">기타</h3>
          <ul>
            <li>축하 메시지: {{ statistics.guest_messages_count }}개</li>
          </ul>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showStatisticsModal = false">닫기</button>
        </div>
      </div>
    </div>

    <!-- AI 문구 추천 모달 -->
    <div v-if="showTextRecommendModal" class="modal-overlay" @click.self="showTextRecommendModal = false">
      <div class="modal-content">
        <h2>AI 문구 추천</h2>
        <div class="modal-form">
          <div class="form-group">
            <label>신랑 이름 *</label>
            <input v-model="textRecommendForm.groom_name" type="text" required />
          </div>
          <div class="form-group">
            <label>신부 이름 *</label>
            <input v-model="textRecommendForm.bride_name" type="text" required />
          </div>
          <div class="form-group">
            <label>예식일 (YYYY-MM-DD) *</label>
            <input v-model="textRecommendForm.wedding_date" type="date" required />
          </div>
          <div class="form-group">
            <label>예식 시간 (HH:MM)</label>
            <input v-model="textRecommendForm.wedding_time" type="time" />
          </div>
          <div class="form-group">
            <label>예식 장소</label>
            <input v-model="textRecommendForm.wedding_location" type="text" />
          </div>
          <div class="form-group">
            <label>스타일</label>
            <select v-model="textRecommendForm.style">
              <option value="">선택 안 함</option>
              <option value="CLASSIC">클래식</option>
              <option value="MODERN">모던</option>
              <option value="VINTAGE">빈티지</option>
              <option value="MINIMAL">미니멀</option>
              <option value="LUXURY">럭셔리</option>
              <option value="NATURE">자연스러운</option>
              <option value="ROMANTIC">로맨틱</option>
            </select>
          </div>
          <div class="form-group">
            <label>추가 정보</label>
            <textarea v-model="textRecommendForm.additional_info" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showTextRecommendModal = false">취소</button>
          <button class="btn-primary" @click="recommendText" :disabled="recommending">
            {{ recommending ? '추천 중...' : '문구 추천' }}
          </button>
        </div>

        <div v-if="recommendedText" class="recommended-text">
          <h3>추천 문구</h3>
          <div class="recommended-content">
            <p><strong>주요 문구:</strong> {{ recommendedText.main_text }}</p>
            <p><strong>신랑 부모님:</strong> {{ recommendedText.groom_parents }}</p>
            <p><strong>신부 부모님:</strong> {{ recommendedText.bride_parents }}</p>
            <p><strong>예식 정보:</strong> {{ recommendedText.wedding_info }}</p>
            <p><strong>식장 정보:</strong> {{ recommendedText.reception_info }}</p>
            <p><strong>마무리 문구:</strong> {{ recommendedText.closing_text }}</p>
          </div>
          <button class="btn-primary" @click="applyRecommendedText">적용하기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invitation-design-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 32px;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.description {
  color: var(--muted, #666);
  font-size: 16px;
}

.loading, .error {
  text-align: center;
  padding: 48px;
  font-size: 18px;
}

.templates-section {
  margin-top: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.template-card {
  border: 1px solid var(--line, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-preview {
  aspect-ratio: 3/4;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-placeholder {
  padding: 24px;
  text-align: center;
  color: #999;
}

.template-info {
  padding: 16px;
}

.template-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.template-style {
  font-size: 14px;
  color: var(--muted, #666);
}

.my-designs-section {
  margin-top: 48px;
}

.designs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.design-card {
  border: 1px solid var(--line, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.design-preview {
  aspect-ratio: 3/4;
  background: #f5f5f5;
}

.design-info {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.editor-section {
  margin-top: 24px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line, #e0e0e0);
}

.editor-actions {
  display: flex;
  gap: 12px;
}

.editor-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

.editor-panel {
  background: var(--card, #fff);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--line, #e0e0e0);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--line, #e0e0e0);
  border-radius: 4px;
  font-size: 14px;
}

.form-group input[type="color"] {
  height: 40px;
  padding: 4px;
}

.preview-panel {
  background: var(--card, #fff);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--line, #e0e0e0);
}

.preview-card {
  aspect-ratio: 3/4;
  padding: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-content {
  text-align: center;
  width: 100%;
}

.main-text {
  font-size: 1.2em;
  margin-bottom: 24px;
  white-space: pre-line;
}

.names {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 32px;
}

.wedding-info,
.reception-info,
.closing-text {
  margin-bottom: 16px;
  white-space: pre-line;
}

.qr-preview {
  margin-top: 16px;
  text-align: center;
}

.qr-preview img {
  max-width: 150px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: var(--accent, #22d3ee);
  color: white;
}

.btn-secondary {
  background: var(--soft, #f5f5f5);
  color: var(--text, #333);
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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-form {
  margin: 24px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.recommended-text {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line, #e0e0e0);
}

.recommended-content {
  margin: 16px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
}

.recommended-content p {
  margin: 8px 0;
}

.digital-invitations-section {
  margin-top: 48px;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.invitation-card {
  border: 1px solid var(--line, #e0e0e0);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invitation-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.invitation-link {
  display: block;
  color: var(--accent, #22d3ee);
  font-size: 12px;
  margin: 8px 0;
  word-break: break-all;
}

.invitation-stats {
  font-size: 12px;
  color: var(--muted, #666);
}

.invitation-actions {
  display: flex;
  gap: 8px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 24px 0;
}

.stat-card {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.statistics-details {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line, #e0e0e0);
}

.statistics-details h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.statistics-details ul {
  list-style: none;
  padding: 0;
}

.statistics-details li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
</style>

