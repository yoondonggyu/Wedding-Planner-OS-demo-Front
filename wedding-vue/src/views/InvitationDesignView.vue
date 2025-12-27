<script setup lang="ts">
import { computed, onMounted, ref, nextTick, watch } from 'vue'
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
const showLandingPage = ref(true) // 랜딩 페이지 표시 여부
const initializing = ref(false) // 초기화 중 여부

const selectedTemplateId = ref<number | null>(null)
const selectedDesignId = ref<number | null>(null)
const currentDesign = ref<Design | null>(null)

// 디자인 에디터 상태
const showEditor = ref(false)
const designData = ref<any>({
  main_text: '',
  groom_name: '',
  bride_name: '',
  groom_father_name: '',
  groom_mother_name: '',
  bride_father_name: '',
  bride_mother_name: '',
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
  groom_father_name: '',
  groom_mother_name: '',
  bride_father_name: '',
  bride_mother_name: '',
  wedding_date: '',
  wedding_time: '',
  wedding_location: '',
  style: '',
  additional_info: ''
})
const recommending = ref(false)
const recommendedTextOptions = ref<any[]>([])
const selectedTextOptionIndex = ref<number>(0)
const locationInputRef = ref<HTMLInputElement | null>(null)

// 5가지 톤 제안
const showToneModal = ref(false)
const tonesGenerated = ref(false)
const generatedTones = ref<any[]>([])
const selectedTone = ref<any>(null)

// 이미지 생성
const showImageModal = ref(false)
const imageGenerating = ref(false)
const generatedImage = ref('')
const imagePrompt = ref('')
const imageModel = ref('sdxl') // 'sdxl', 'flux', 'gemini'

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
    groom_father_name: '',
    groom_mother_name: '',
    bride_father_name: '',
    bride_mother_name: '',
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
      data: { options: any[] }
    }>('/invitation-text-recommend', {
      method: 'POST',
      body: textRecommendForm.value
    })
    
    // options 배열이 있는 경우
    if (res.data?.options && Array.isArray(res.data.options)) {
      recommendedTextOptions.value = res.data.options
      selectedTextOptionIndex.value = 0
      showToast(`${res.data.options.length}개의 문구 옵션이 생성되었습니다.`, { type: 'success' })
    } else {
      // 하위 호환성: 단일 옵션인 경우 배열로 변환
      recommendedTextOptions.value = [res.data]
      selectedTextOptionIndex.value = 0
      showToast('문구 추천이 완료되었습니다.', { type: 'success' })
    }
  } catch (err: any) {
    console.error('문구 추천 실패:', err)
    // 기본 문구 옵션 제공
    recommendedTextOptions.value = [{
      main_text: `${textRecommendForm.value.groom_name} · ${textRecommendForm.value.bride_name} 두 사람이 하나가 되어\n새로운 인생을 시작합니다.`,
      groom_father: '',
      groom_mother: '',
      bride_father: '',
      bride_mother: '',
      wedding_info: `${textRecommendForm.value.wedding_date}\n${textRecommendForm.value.wedding_time || ''}\n${textRecommendForm.value.wedding_location || ''}`,
      reception_info: textRecommendForm.value.wedding_location || '',
      closing_text: '바쁘시겠지만 참석해 주시면 감사하겠습니다.'
    }]
    selectedTextOptionIndex.value = 0
    showToast('기본 문구가 생성되었습니다.', { type: 'success' })
  } finally {
    recommending.value = false
  }
}

// 5가지 톤 생성
async function generateTones() {
  if (!textRecommendForm.value.groom_name || !textRecommendForm.value.bride_name || !textRecommendForm.value.wedding_date) {
    showToast('신랑 이름, 신부 이름, 예식일을 입력해주세요.', 'error')
    return
  }

  recommending.value = true
  try {
    const res = await request<{
      message: string
      data: { tones: any[] }
    }>('/invitation-tones', {
      method: 'POST',
      body: textRecommendForm.value
    })
    
    if (res.data?.tones && Array.isArray(res.data.tones)) {
      generatedTones.value = res.data.tones
      tonesGenerated.value = true
      showToast(`${res.data.tones.length}가지 톤이 생성되었습니다.`, { type: 'success' })
      showToneModal.value = true
    } else {
      throw new Error('톤 데이터가 없습니다')
    }
  } catch (err: any) {
    console.error('톤 생성 실패:', err)
    showToast(err?.data?.error || '톤 생성에 실패했습니다.', 'error')
  } finally {
    recommending.value = false
  }
}

function selectTone(tone: any) {
  selectedTone.value = tone
  designData.value.main_text = tone.main_text || ''
  designData.value.wedding_info = tone.wedding_info || ''
  designData.value.closing_text = tone.closing || ''
  showToneModal.value = false
  showToast(`${tone.description} 톤이 적용되었습니다.`, { type: 'success' })
}

// 이미지 생성
async function generateInvitationImage() {
  if (!imagePrompt.value) {
    showToast('이미지 설명을 입력해주세요.', 'error')
    return
  }

  if (!selectedDesignId.value) {
    showToast('먼저 디자인을 저장해주세요.', 'error')
    return
  }

  imageGenerating.value = true
  try {
    const res = await request<{
      message: string
      data: { image_b64: string }
    }>('/invitation-image-generate', {
      method: 'POST',
      body: {
        design_id: selectedDesignId.value,
        selected_tone: selectedTone.value?.tone || 'polite',
        selected_text: designData.value.main_text || '',
        prompt: imagePrompt.value,
        model_type: imageModel.value === 'gemini' ? 'pro' : 'free'
      }
    })
    
    if (res.data?.image_b64) {
      generatedImage.value = res.data.image_b64
      designData.value.image_url = res.data.image_b64
      showToast('이미지가 생성되었습니다!', { type: 'success' })
    }
  } catch (err: any) {
    console.error('이미지 생성 실패:', err)
    showToast(err?.data?.error || '이미지 생성에 실패했습니다.', 'error')
  } finally {
    imageGenerating.value = false
  }
}

// PDF 생성
const generatingPDF = ref(false)

// 날짜 입력 처리 함수들 (CalendarView에서 가져옴)
function handleDateKeydown(event: KeyboardEvent, field: 'wedding_date') {
  const input = event.target as HTMLInputElement
  
  // 백스페이스, 삭제, 화살표 키 등은 허용
  if ([' Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(event.key)) {
    return
  }
  
  // Ctrl/Cmd + A, C, V, X 등은 허용
  if (event.ctrlKey || event.metaKey) {
    return
  }
  
  // 숫자만 허용
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
    return
  }
  
  const currentValue = input.value.replace(/\D/g, '') // 숫자만 추출
  const newValue = currentValue + event.key
  
  // 최대 8자리까지만 허용
  if (newValue.length > 8) {
    event.preventDefault()
    return
  }
  
  // 연도 4자리 입력 완료 시 자동으로 하이픈 추가
  if (newValue.length === 4) {
    event.preventDefault()
    const formatted = newValue + '-'
    textRecommendForm.value.wedding_date = formatted
    nextTick(() => {
      input.value = formatted
      const position = 5
      input.setSelectionRange(position, position)
    })
    return
  }
  
  // 월 2자리 입력 완료 시 자동으로 하이픈 추가
  if (newValue.length === 6) {
    event.preventDefault()
    const formatted = newValue.slice(0, 4) + '-' + newValue.slice(4, 6) + '-'
    textRecommendForm.value.wedding_date = formatted
    nextTick(() => {
      input.value = formatted
      const position = formatted.length
      input.setSelectionRange(position, position)
    })
    return
  }
  
  // 일반 입력 시 포맷팅만 적용
  event.preventDefault()
  const formatted = formatDateValue(newValue)
  textRecommendForm.value.wedding_date = formatted
  nextTick(() => {
    input.value = formatted
    const position = formatted.length
    input.setSelectionRange(position, position)
  })
}

function formatDateValue(digits: string): string {
  if (digits.length <= 4) {
    return digits
  } else if (digits.length <= 6) {
    return digits.slice(0, 4) + '-' + digits.slice(4, 6)
  } else {
    return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8)
  }
}

function handleDateInput(event: Event, field: 'wedding_date') {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // 이미 올바른 형식이면 그대로 사용
  if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    textRecommendForm.value.wedding_date = value
    return
  }
  
  // 숫자만 추출하여 포맷팅
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const formatted = formatDateValue(digits)
  textRecommendForm.value.wedding_date = formatted
  
  nextTick(() => {
    if (input.value !== formatted) {
      input.value = formatted
    }
  })
}

function handleDatePaste(event: ClipboardEvent, field: 'wedding_date') {
  event.preventDefault()
  const input = event.target as HTMLInputElement
  const pastedText = event.clipboardData?.getData('text') || ''
  const digits = pastedText.replace(/\D/g, '').slice(0, 8)
  const formatted = formatDateValue(digits)
  
  textRecommendForm.value.wedding_date = formatted
  
  nextTick(() => {
    input.value = formatted
    input.setSelectionRange(formatted.length, formatted.length)
  })
}


function applyRecommendedText() {
  if (recommendedTextOptions.value.length > 0 && selectedTextOptionIndex.value >= 0) {
    const selectedOption = recommendedTextOptions.value[selectedTextOptionIndex.value]
    if (selectedOption) {
      designData.value.main_text = selectedOption.main_text || ''
      designData.value.groom_father = selectedOption.groom_father || ''
      designData.value.groom_mother = selectedOption.groom_mother || ''
      designData.value.bride_father = selectedOption.bride_father || ''
      designData.value.bride_mother = selectedOption.bride_mother || ''
      designData.value.wedding_info = selectedOption.wedding_info || ''
      designData.value.reception_info = selectedOption.reception_info || ''
      designData.value.closing_text = selectedOption.closing_text || ''
      showTextRecommendModal.value = false
      showToast('추천 문구가 적용되었습니다.', { type: 'success' })
    }
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


// 초기화 API 호출 (FE의 /api/invitations/init)
async function initInvitation() {
  initializing.value = true
  error.value = null
  
  try {
    // 백엔드 서버가 없을 경우를 대비해 try-catch로 처리
    await request('/invitations/init', {
      method: 'GET',
    })
    console.log('초기화 완료')
  } catch (err: any) {
    console.log('초기화 API 호출 실패 (데모 모드로 진행):', err)
    // API 호출 실패해도 계속 진행 (데모 모드)
  } finally {
    initializing.value = false
  }
}

// 시작하기 버튼 클릭
async function handleStart() {
  if (initializing.value) return
  
  await initInvitation()
  showLandingPage.value = false
  await fetchTemplates()
  if (canEdit.value) {
    fetchDesigns()
    fetchMyDigitalInvitations()
  }
}

// 기능 미리보기 스크롤
function scrollToFeatures() {
  showLandingPage.value = false
  nextTick(() => {
    const featuresSection = document.querySelector('.templates-section')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

onMounted(() => {
  // 랜딩 페이지를 이미 본 경우 바로 로드
  const hasSeenLanding = localStorage.getItem('has_seen_invitation_landing')
  if (hasSeenLanding) {
    showLandingPage.value = false
    fetchTemplates()
    if (canEdit.value) {
      fetchDesigns()
      fetchMyDigitalInvitations()
    }
  }
})
</script>

<template>
  <div class="invitation-design-view">
    <!-- 랜딩 페이지 -->
    <div v-if="showLandingPage" class="landing-page">
      <div class="landing-bg" aria-hidden="true">
        <span class="orb1"></span>
        <span class="orb2"></span>
        <span class="orb3"></span>
      </div>

      <main class="landing-main">
        <section class="hero-card">
          <div class="badge">AI Wedding Invitation</div>

          <h1 class="landing-title">
            따뜻한 감성의 <span class="highlight">AI 청첩장</span>을
            <br />
            만들어보세요
          </h1>

          <p class="landing-subtitle">
            신랑·신부 정보 입력 → 사진 업로드 → 디자인 선택까지
            <br />
            완성된 청첩장 이미지를 바로 다운로드할 수 있어요.
          </p>

          <div class="cta-row">
            <button
              type="button"
              class="primary-btn"
              @click="handleStart"
              :disabled="initializing"
            >
              <span v-if="initializing" class="btn-inner">
                <span class="spinner" aria-hidden="true"></span>
                준비 중...
              </span>
              <span v-else>시작하기</span>
            </button>

            <button
              type="button"
              class="ghost-btn"
              @click="scrollToFeatures"
            >
              기능 미리보기
            </button>
          </div>

          <div v-if="error" class="error-box">{{ error }}</div>

          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-dot"></span>
              임시 토큰 발급 후 진행
            </div>
            <div class="meta-item">
              <span class="meta-dot"></span>
              결과물 다운로드 지원
            </div>
            <div class="meta-item">
              <span class="meta-dot"></span>
              웨딩 감성 + 글래스 UI
            </div>
          </div>
        </section>

        <section class="features">
          <article class="feature-card">
            <div class="feature-icon" aria-hidden="true">🧾</div>
            <div class="feature-title">정보 입력</div>
            <div class="feature-desc">예식장, 날짜/시간, 추가 안내까지 한 번에</div>
          </article>

          <article class="feature-card">
            <div class="feature-icon" aria-hidden="true">🖼️</div>
            <div class="feature-title">사진 업로드</div>
            <div class="feature-desc">메인/스타일 이미지로 원하는 무드 전달</div>
          </article>

          <article class="feature-card">
            <div class="feature-icon" aria-hidden="true">✨</div>
            <div class="feature-title">디자인 선택</div>
            <div class="feature-desc">톤/프레임 조합으로 완성도 높은 결과</div>
          </article>
        </section>
      </main>
    </div>

    <!-- 메인 콘텐츠 -->
    <div v-else>
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
              🤖 기본 문구 추천
            </button>
            <button class="btn-secondary" @click="showTextRecommendModal = true; generateTones()">
              🎨 5가지 톤 제안
            </button>
            <button class="btn-secondary" @click="showImageModal = true">
              🖼️ AI 이미지 생성
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
              <label>신랑 부</label>
              <input v-model="designData.groom_father_name" type="text" placeholder="예: 김아버지" />
            </div>

            <div class="form-group">
              <label>신랑 모</label>
              <input v-model="designData.groom_mother_name" type="text" placeholder="예: 박어머니" />
            </div>

            <div class="form-group">
              <label>신부 부</label>
              <input v-model="designData.bride_father_name" type="text" placeholder="예: 이아버지" />
            </div>

            <div class="form-group">
              <label>신부 모</label>
              <input v-model="designData.bride_mother_name" type="text" placeholder="예: 최어머니" />
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
            <label>예식일 *</label>
            <input
              :value="textRecommendForm.wedding_date"
              type="text"
              required
              placeholder="YYYY-MM-DD"
              maxlength="10"
              @keydown="handleDateKeydown($event, 'wedding_date')"
              @input="handleDateInput($event, 'wedding_date')"
              @paste="handleDatePaste($event, 'wedding_date')"
            />
          </div>
          <div class="form-group">
            <label>예식 시간 (HH:MM)</label>
            <input v-model="textRecommendForm.wedding_time" type="time" />
          </div>
          <div class="form-group">
            <label>예식 장소</label>
            <input
              id="wedding-location-input"
              v-model="textRecommendForm.wedding_location"
              type="text"
              placeholder="장소를 검색하세요"
              ref="locationInputRef"
            />
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

        <div v-if="recommendedTextOptions.length > 0" class="recommended-text">
          <h3>추천 문구 ({{ recommendedTextOptions.length }}개 옵션)</h3>
          
          <!-- 옵션 탭 -->
          <div class="text-options-tabs">
            <button
              v-for="(option, index) in recommendedTextOptions"
              :key="index"
              :class="['option-tab', { active: selectedTextOptionIndex === index }]"
              @click="selectedTextOptionIndex = index"
            >
              옵션 {{ index + 1 }}
            </button>
          </div>
          
          <!-- 선택된 옵션 표시 -->
          <div v-if="recommendedTextOptions[selectedTextOptionIndex]" class="recommended-content">
            <div class="option-content">
              <p><strong>주요 문구:</strong></p>
              <p class="text-preview">{{ recommendedTextOptions[selectedTextOptionIndex].main_text }}</p>
              
              <div v-if="recommendedTextOptions[selectedTextOptionIndex].groom_father || recommendedTextOptions[selectedTextOptionIndex].groom_mother">
                <p><strong>신랑 부:</strong> {{ recommendedTextOptions[selectedTextOptionIndex].groom_father || '-' }}</p>
                <p><strong>신랑 모:</strong> {{ recommendedTextOptions[selectedTextOptionIndex].groom_mother || '-' }}</p>
              </div>
              
              <div v-if="recommendedTextOptions[selectedTextOptionIndex].bride_father || recommendedTextOptions[selectedTextOptionIndex].bride_mother">
                <p><strong>신부 부:</strong> {{ recommendedTextOptions[selectedTextOptionIndex].bride_father || '-' }}</p>
                <p><strong>신부 모:</strong> {{ recommendedTextOptions[selectedTextOptionIndex].bride_mother || '-' }}</p>
              </div>
              
              <p><strong>예식 정보:</strong></p>
              <p class="text-preview">{{ recommendedTextOptions[selectedTextOptionIndex].wedding_info }}</p>
              
              <p v-if="recommendedTextOptions[selectedTextOptionIndex].reception_info">
                <strong>식장 정보:</strong> {{ recommendedTextOptions[selectedTextOptionIndex].reception_info }}
              </p>
              
              <p><strong>마무리 문구:</strong></p>
              <p class="text-preview">{{ recommendedTextOptions[selectedTextOptionIndex].closing_text }}</p>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn-secondary" @click="showTextRecommendModal = false">닫기</button>
            <button class="btn-primary" @click="applyRecommendedText">선택한 옵션 적용하기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 5가지 톤 선택 모달 -->
    <div v-if="showToneModal" class="modal-overlay" @click.self="showToneModal = false">
      <div class="modal-content tone-modal" style="max-width: 1200px;">
        <h2>🎨 5가지 톤 선택</h2>
        <p class="modal-subtitle">마음에 드는 톤을 선택하세요</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 2rem 0;">
          <div
            v-for="(tone, index) in generatedTones"
            :key="index"
            style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 1rem; cursor: pointer; transition: all 0.3s;"
            @click="selectTone(tone)"
            @mouseover="$event.currentTarget.style.borderColor='#667eea'"
            @mouseleave="$event.currentTarget.style.borderColor='#e0e0e0'"
          >
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
              <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">{{ index + 1 }}</span>
              <h3 style="margin: 0;">{{ tone.description }}</h3>
            </div>
            <p style="margin: 0.5rem 0; white-space: pre-line; font-size: 0.95rem;">{{ tone.main_text }}</p>
            <small style="color: #666;">{{ tone.wedding_info }}</small>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showToneModal = false">닫기</button>
        </div>
      </div>
    </div>

    <!-- 이미지 생성 모달 -->
    <div v-if="showImageModal" class="modal-overlay" @click.self="showImageModal = false">
      <div class="modal-content image-modal" style="max-width: 800px;">
        <h2>🖼️ AI 이미지 생성</h2>
        <p class="modal-subtitle">청첩장 이미지를 생성합니다</p>
        
        <div class="modal-form">
          <div class="form-group">
            <label>모델 선택</label>
            <select v-model="imageModel" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
              <option value="sdxl">SDXL (무료, 텍스트만)</option>
              <option value="flux">FLUX (무료, 텍스트+이미지)</option>
              <option value="gemini">Gemini 3.0 Pro (유료, 미구현)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>이미지 설명 (영어로 입력) *</label>
            <textarea
              v-model="imagePrompt"
              rows="4"
              placeholder="예: Elegant wedding invitation card with soft pink flowers, romantic atmosphere, gold accents, minimalist design"
              style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;"
            ></textarea>
            <small style="color: #666;">💡 꽃, 색상, 스타일 등을 영어로 자세히 설명해주세요</small>
          </div>
          
          <div v-if="generatedImage" style="margin-top: 1rem;">
            <h4>생성된 이미지:</h4>
            <img :src="generatedImage" alt="생성된 청첩장" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showImageModal = false">닫기</button>
          <button 
            class="btn-primary" 
            @click="generateInvitationImage"
            :disabled="imageGenerating || !imagePrompt"
          >
            {{ imageGenerating ? '생성 중...' : '✨ 이미지 생성' }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
/* 랜딩 페이지 스타일 */
.landing-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  background: radial-gradient(1200px 800px at 20% 15%, rgba(255, 205, 220, 0.45), transparent 55%),
              radial-gradient(1200px 800px at 80% 20%, rgba(255, 228, 200, 0.38), transparent 55%),
              radial-gradient(1200px 800px at 60% 90%, rgba(210, 200, 255, 0.30), transparent 60%),
              linear-gradient(180deg, #fff, #fff7fb);
}

.landing-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orb1, .orb2, .orb3 {
  position: absolute;
  border-radius: 999px;
  filter: blur(40px);
  opacity: 0.55;
  transform: translateZ(0);
}

.orb1 {
  width: 420px;
  height: 420px;
  left: -120px;
  top: -120px;
  background: rgba(255, 160, 190, 0.65);
}

.orb2 {
  width: 520px;
  height: 520px;
  right: -160px;
  top: -140px;
  background: rgba(255, 210, 170, 0.60);
}

.orb3 {
  width: 520px;
  height: 520px;
  left: 18%;
  bottom: -220px;
  background: rgba(190, 170, 255, 0.55);
}

.landing-main {
  position: relative;
  max-width: 1080px;
  width: min(1080px, 100%);
  padding: 72px 28px 52px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  z-index: 1;
}

.hero-card {
  border-radius: 32px;
  padding: 48px 36px 36px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow: 0 18px 50px rgba(25, 10, 35, 0.10);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  color: rgba(70, 20, 45, 0.82);
  background: rgba(255, 220, 235, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.landing-title {
  margin: 20px 0 14px;
  font-size: 48px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #1e1e2a;
}

.highlight {
  background: linear-gradient(90deg, rgba(255, 88, 150, 0.92), rgba(255, 140, 90, 0.92));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.landing-subtitle {
  margin: 0 0 24px;
  font-size: 18px;
  line-height: 1.7;
  color: rgba(35, 35, 55, 0.72);
}

.cta-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.primary-btn {
  min-width: 220px;
  height: 58px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 800;
  font-size: 17px;
  color: white;
  background: linear-gradient(90deg, rgba(223, 65, 129, 0.95), rgba(255, 130, 84, 0.92));
  box-shadow: 0 18px 40px rgba(223, 65, 129, 0.20);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.primary-btn:active {
  transform: translateY(0px) scale(0.99);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.55);
  border-top-color: rgba(255, 255, 255, 1);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ghost-btn {
  height: 58px;
  padding: 0 20px;
  border-radius: 18px;
  cursor: pointer;
  font-weight: 800;
  font-size: 16px;
  color: rgba(50, 30, 60, 0.88);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 0.15s ease, background 0.15s ease;
}

.ghost-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.70);
}

.ghost-btn:active {
  transform: translateY(0px) scale(0.99);
}

.error-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 235, 240, 0.78);
  border: 1px solid rgba(255, 120, 140, 0.22);
  color: rgba(140, 20, 55, 0.92);
  font-weight: 700;
}

.meta-row {
  margin-top: 18px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  color: rgba(35, 35, 55, 0.66);
  font-size: 14px;
  font-weight: 700;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.meta-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(223, 65, 129, 0.65);
  box-shadow: 0 0 0 4px rgba(223, 65, 129, 0.10);
}

.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.feature-card {
  border-radius: 26px;
  padding: 24px 20px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.64);
  box-shadow: 0 14px 32px rgba(25, 10, 35, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: transform 0.15s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 32px;
}

.feature-title {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1e1e2a;
}

.feature-desc {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(35, 35, 55, 0.68);
}

/* 반응형 */
@media (max-width: 900px) {
  .landing-title {
    font-size: 34px;
  }
  .features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .landing-main {
    padding: 44px 16px 34px;
  }
  .hero-card {
    padding: 26px 18px 20px;
    border-radius: 22px;
  }
  .landing-title {
    font-size: 28px;
  }
  .landing-subtitle {
    font-size: 14px;
  }
  .primary-btn {
    width: 100%;
  }
  .ghost-btn {
    width: 100%;
  }
  .features {
    grid-template-columns: 1fr;
  }
}

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

.text-options-tabs {
  display: flex;
  gap: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.option-tab {
  padding: 8px 16px;
  border: 1px solid var(--line, #e0e0e0);
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.option-tab:hover {
  background: #f5f5f5;
  border-color: var(--accent, #22d3ee);
}

.option-tab.active {
  background: var(--accent, #22d3ee);
  color: #fff;
  border-color: var(--accent, #22d3ee);
}

.recommended-content {
  margin: 16px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
}

.option-content {
  margin: 16px 0;
}

.option-content p {
  margin: 8px 0;
}

.text-preview {
  white-space: pre-line;
  line-height: 1.6;
  color: #333;
  margin: 8px 0 16px 0;
}

.radio-group {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  cursor: pointer;
}

.image-preview-container {
  position: relative;
  margin-top: 8px;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 6px;
  border: 1px solid var(--line, #e0e0e0);
}

.btn-remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.file-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--line, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
}

.generated-design-preview {
  margin-top: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.generated-design-preview h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.generated-image {
  width: 100%;
  max-width: 400px;
  border-radius: 6px;
  margin-bottom: 12px;
  display: block;
}

.design-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
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

/* 모바일 스타일 */
@media (max-width: 768px) {
  .invitation-design-view {
    padding: 12px;
  }

  .header h1 {
    font-size: 24px;
    margin-bottom: 6px;
  }

  .description {
    font-size: 14px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .section-header button {
    width: 100%;
  }

  .templates-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }

  .template-card {
    border-radius: 6px;
  }

  .template-info {
    padding: 12px;
  }

  .template-info h3 {
    font-size: 14px;
  }

  .template-style {
    font-size: 11px;
  }

  .designs-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .editor-section {
    margin-top: 16px;
  }

  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .editor-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .editor-actions button {
    width: 100%;
  }

  .editor-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .editor-panel {
    padding: 16px;
    max-height: none;
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
    padding: 8px 10px;
    font-size: 14px;
  }

  .preview-panel {
    padding: 16px;
  }

  .preview-card {
    padding: 32px 24px;
  }

  .main-text {
    font-size: 1em;
    margin-bottom: 16px;
  }

  .names {
    font-size: 1.2em;
    margin-bottom: 24px;
  }

  .wedding-info,
  .reception-info,
  .closing-text {
    margin-bottom: 12px;
    font-size: 0.9em;
  }

  .btn-primary,
  .btn-secondary {
    padding: 10px 16px;
    font-size: 13px;
  }

  .modal-content {
    padding: 24px 16px;
    width: 95%;
    max-width: none;
  }

  .modal-content h2 {
    font-size: 20px;
  }

  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }

  .modal-actions button {
    width: 100%;
  }

  .invitations-list {
    gap: 12px;
  }

  .invitation-card {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .invitation-actions {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .invitation-actions button,
  .invitation-actions a {
    width: 100%;
  }

  .statistics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .templates-grid,
  .designs-grid {
    grid-template-columns: 1fr;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }
}
</style>

