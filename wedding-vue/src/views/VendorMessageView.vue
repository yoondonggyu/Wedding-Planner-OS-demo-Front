<script setup lang="ts">
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

interface VendorThread {
  id: number
  title: string
  vendor_id: number
  vendor_name: string | null
  vendor_type: string | null
  is_active: boolean
  unread_count: number
  last_message: {
    content: string | null
    created_at: string | null
  } | null
  last_message_at: string | null
  created_at: string | null
}

interface VendorMessage {
  id: number
  sender_type: 'user' | 'vendor'
  sender_id: number
  content: string
  attachments: string[]
  is_read: boolean
  created_at: string | null
}

interface Vendor {
  id: number
  name: string
  vendor_type: string | null
  contact_phone: string | null
  contact_link: string | null
  description: string | null
  base_location_city: string
  base_location_district: string
}

interface VendorListItem {
  id: number
  vendor_type: string
  name: string
  description: string | null
  base_location_city: string
  base_location_district: string
}

interface VendorContract {
  id: number
  contract_date: string | null
  total_amount: number | null
  deposit_amount: number | null
  interim_amount: number | null
  balance_amount: number | null
  service_date: string | null
  notes: string | null
  is_active: boolean
  payment_schedules: PaymentSchedule[]
  documents: Document[]
}

interface PaymentSchedule {
  id: number
  payment_type: 'deposit' | 'interim' | 'balance' | 'additional'
  amount: number
  due_date: string | null
  paid_date: string | null
  payment_method: string | null
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  reminder_sent: boolean
  notes: string | null
}

interface Document {
  id: number
  document_type: 'quote' | 'contract' | 'invoice' | 'receipt'
  version: number
  file_url: string
  file_name: string
  file_size: number | null
  status: 'draft' | 'pending' | 'signed' | 'rejected'
  signed_at: string | null
  signed_by: string | null
  created_at: string | null
}

interface ThreadDetail {
  id: number
  title: string
  vendor_id: number
  vendor: Vendor
  is_active: boolean
  messages: VendorMessage[]
  contract: VendorContract | null
  created_at: string | null
}

const authStore = useAuthStore()
const { request } = useApi()
const { showToast } = useToast()

const threads = ref<VendorThread[]>([])
const selectedThread = ref<ThreadDetail | null>(null)
const selectedThreadId = ref<number | null>(null)
const messageInput = ref('')
const loading = ref(false)

// 모달 상태
const showNewThreadModal = ref(false)
const showContractModal = ref(false)
const showDocumentModal = ref(false)
const showPaymentModal = ref(false)
const showCompareModal = ref(false)
const showHelp = ref(false)

// 새 쓰레드 생성
const newThreadForm = ref({
  vendor_id: 0,
  title: '',
})

// 제휴 업체 목록
const vendorList = ref<VendorListItem[]>([])
const selectedVendorCategory = ref<string>('')
const vendorCategories = [
  { value: '', label: '전체', icon: '📋' },
  { value: 'IPHONE_SNAP', label: '아이폰 스냅', icon: '📱' },
  { value: 'MC', label: '사회자', icon: '🎤' },
  { value: 'SINGER', label: '축가', icon: '🎵' },
  { value: 'STUDIO_PREWEDDING', label: '웨딩 스튜디오', icon: '📸' },
  { value: 'VENUE_OUTDOOR', label: '야외 식장', icon: '🏞️' },
]

const filteredVendors = computed(() => {
  if (!selectedVendorCategory.value) {
    return vendorList.value
  }
  return vendorList.value.filter(v => v.vendor_type === selectedVendorCategory.value)
})

const vendorsByCategory = computed(() => {
  const grouped: Record<string, VendorListItem[]> = {}
  filteredVendors.value.forEach(vendor => {
    const category = vendor.vendor_type
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(vendor)
  })
  return grouped
})

// 계약 정보
const contractForm = ref({
  contract_date: '',
  total_amount: null as number | null,
  deposit_amount: null as number | null,
  interim_amount: null as number | null,
  balance_amount: null as number | null,
  service_date: '',
  notes: '',
})

// 결제 일정
const paymentForm = ref({
  payment_type: 'deposit' as 'deposit' | 'interim' | 'balance' | 'additional',
  amount: 0,
  due_date: '',
  notes: '',
})

// 문서 업로드
const documentForm = ref({
  document_type: 'quote' as 'quote' | 'contract' | 'invoice' | 'receipt',
  file_url: '',
  file_name: '',
  file_size: null as number | null,
})

// 제휴 업체 비교
const comparingVendorIds = ref<number[]>([])
const compareResults = ref<any[]>([])

// 데모 데이터
const demoThreads = ref<VendorThread[]>([
  {
    id: 1,
    title: '카메라맨 A와의 대화',
    vendor_id: 1,
    vendor_name: '카메라맨 A',
    vendor_type: 'IPHONE_SNAP',
    is_active: true,
    unread_count: 2,
    last_message: {
      content: '견적서를 확인해주세요.',
      created_at: '2024-01-15T10:30:00',
    },
    last_message_at: '2024-01-15T10:30:00',
    created_at: '2024-01-10T09:00:00',
  },
  {
    id: 2,
    title: '웨딩홀 B와의 대화',
    vendor_id: 2,
    vendor_name: '웨딩홀 B',
    vendor_type: 'VENUE_OUTDOOR',
    is_active: true,
    unread_count: 0,
    last_message: {
      content: '계약서 서명 완료했습니다.',
      created_at: '2024-01-14T15:20:00',
    },
    last_message_at: '2024-01-14T15:20:00',
    created_at: '2024-01-05T11:00:00',
  },
])

const demoMessages = ref<VendorMessage[]>([
  {
    id: 1,
    sender_type: 'user',
    sender_id: 1,
    content: '안녕하세요. 견적서를 받고 싶습니다.',
    attachments: [],
    is_read: true,
    created_at: '2024-01-10T09:00:00',
  },
  {
    id: 2,
    sender_type: 'vendor',
    sender_id: 1,
    content: '안녕하세요! 견적서를 보내드리겠습니다.',
    attachments: [],
    is_read: true,
    created_at: '2024-01-10T09:15:00',
  },
  {
    id: 3,
    sender_type: 'vendor',
    sender_id: 1,
    content: '견적서를 확인해주세요. 추가 문의사항이 있으시면 언제든지 연락주세요.',
    attachments: [],
    is_read: false,
    created_at: '2024-01-15T10:30:00',
  },
])

const canAccess = computed(() => authStore.isAuthenticated)
const isVendorAccount = computed(() => authStore.user?.role === 'PARTNER_VENDOR')

onMounted(() => {
  if (!canAccess.value) {
    authStore.openLoginModal()
    return
  }
  loadThreads()
  if (!isVendorAccount.value) {
    // 일반 사용자만 제휴 업체 목록 로드 (제휴 업체 계정은 불필요)
    loadVendors()
  }
})

async function loadVendors() {
  try {
    const res = await request<{ message: string; data: { vendors: VendorListItem[] } }>(
      '/vendors',
      { method: 'GET' }
    )
    if (res.message === 'vendors_retrieved') {
      vendorList.value = res.data.vendors || []
    }
  } catch (err: any) {
    console.error('제휴 업체 목록 로드 실패:', err)
    let errorMessage = '제휴 업체 목록을 불러오는데 실패했습니다.'
    
    if (err?.status === 0) {
      errorMessage = '네트워크 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.'
    } else if (err?.status === 401) {
      errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
    } else if (err?.data?.error) {
      errorMessage = err.data.error
    } else if (err?.message) {
      errorMessage = err.message
    }
    
    showToast(errorMessage, 'error')
  }
}

function getCategoryLabel(type: string) {
  const category = vendorCategories.find(c => c.value === type)
  return category ? category.label : type
}

function getCategoryIcon(type: string) {
  const category = vendorCategories.find(c => c.value === type)
  return category ? category.icon : '📋'
}

async function loadThreads() {
  try {
    const res = await request<{ message: string; data: { threads: VendorThread[] } }>(
      '/vendor-threads',
      { method: 'GET' }
    )
    if (res.message === 'threads_retrieved') {
      threads.value = res.data.threads
    }
  } catch (err) {
    console.error('쓰레드 목록 로드 실패:', err)
    showToast('쓰레드 목록을 불러오는데 실패했습니다.', 'error')
  }
}

async function loadThread(threadId: number) {
  try {
    const res = await request<{ message: string; data: ThreadDetail }>(
      `/vendor-threads/${threadId}`,
      { method: 'GET' }
    )
    if (res.message === 'thread_retrieved') {
      selectedThread.value = res.data
      selectedThreadId.value = threadId
      await nextTick()
      scrollToBottom()
    }
  } catch (err) {
    console.error('쓰레드 상세 로드 실패:', err)
    showToast('쓰레드를 불러오는데 실패했습니다.', 'error')
  }
}

function openNewThreadModal() {
  showNewThreadModal.value = true
  selectedVendorCategory.value = ''
  newThreadForm.value = { vendor_id: 0, title: '' }
}

watch(() => newThreadForm.value.vendor_id, (vendorId) => {
  if (vendorId && vendorList.value.length > 0) {
    const vendor = vendorList.value.find(v => v.id === vendorId)
    if (vendor && !newThreadForm.value.title) {
      // 제휴 업체 이름으로 제목 자동 생성
      const categoryLabel = getCategoryLabel(vendor.vendor_type)
      newThreadForm.value.title = `${vendor.name}와의 대화`
    }
  }
})

async function createThread() {
  if (!newThreadForm.value.vendor_id || newThreadForm.value.vendor_id <= 0) {
    showToast('제휴 업체를 선택해주세요.', 'error')
    return
  }

  try {
    const res = await request<{ message: string; data: any }>(
      '/vendor-threads',
      {
        method: 'POST',
        body: {
          vendor_id: newThreadForm.value.vendor_id,
          title: newThreadForm.value.title || null,
        },
      }
    )

    if (res.message === 'thread_created' || res.message === 'thread_already_exists') {
      showToast(
        res.message === 'thread_already_exists' 
          ? '이미 존재하는 쓰레드입니다.' 
          : '쓰레드가 생성되었습니다.', 
        'success'
      )
      showNewThreadModal.value = false
      newThreadForm.value = { vendor_id: 0, title: '' }
      await loadThreads()
      if (res.data?.id) {
        await loadThread(res.data.id)
      }
    } else {
      showToast(res.message || '쓰레드 생성에 실패했습니다.', 'error')
    }
  } catch (err: any) {
    console.error('쓰레드 생성 실패:', err)
    let errorMessage = '쓰레드 생성에 실패했습니다.'
    
    if (err?.status === 0) {
      errorMessage = '네트워크 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.'
    } else if (err?.status === 401) {
      errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
    } else if (err?.status === 403) {
      errorMessage = '권한이 없습니다.'
    } else if (err?.data?.error) {
      errorMessage = err.data.error
    } else if (err?.message) {
      errorMessage = err.message
    }
    
    showToast(errorMessage, 'error')
  }
}

// 메시지가 자신이 보낸 것인지 확인
function isMyMessage(message: VendorMessage): boolean {
  if (isVendorAccount.value) {
    // 제휴 업체 계정: sender_type이 'vendor'면 자신이 보낸 메시지
    return message.sender_type === 'vendor'
  } else {
    // 일반 사용자: sender_type이 'user'면 자신이 보낸 메시지
    return message.sender_type === 'user'
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || !selectedThreadId.value) return

  try {
    const res = await request<{ message: string; data: any }>(
      '/vendor-messages',
      {
        method: 'POST',
        body: {
          thread_id: selectedThreadId.value,
          content: messageInput.value.trim(),
          attachments: [],
        },
      }
    )

    if (res.message === 'message_sent') {
      messageInput.value = ''
      await loadThread(selectedThreadId.value!)
      await loadThreads()
    }
  } catch (err: any) {
    console.error('메시지 전송 실패:', err)
    showToast('메시지 전송에 실패했습니다.', 'error')
  }
}

async function createContract() {
  if (!selectedThreadId.value) return

  try {
    const res = await request<{ message: string; data: any }>(
      '/vendor-contracts',
      {
        method: 'POST',
        body: {
          thread_id: selectedThreadId.value,
          contract_date: contractForm.value.contract_date || null,
          total_amount: contractForm.value.total_amount,
          deposit_amount: contractForm.value.deposit_amount,
          interim_amount: contractForm.value.interim_amount,
          balance_amount: contractForm.value.balance_amount,
          service_date: contractForm.value.service_date || null,
          notes: contractForm.value.notes || null,
        },
      }
    )

    if (res.message === 'contract_created') {
      showToast('계약 정보가 생성되었습니다.', 'success')
      showContractModal.value = false
      contractForm.value = {
        contract_date: '',
        total_amount: null,
        deposit_amount: null,
        interim_amount: null,
        balance_amount: null,
        service_date: '',
        notes: '',
      }
      await loadThread(selectedThreadId.value)
    }
  } catch (err: any) {
    console.error('계약 생성 실패:', err)
    showToast(err?.data?.error || '계약 생성에 실패했습니다.', 'error')
  }
}

async function createPaymentSchedule() {
  if (!selectedThread.value?.contract?.id) return

  try {
    const res = await request<{ message: string; data: any }>(
      '/vendor-payment-schedules',
      {
        method: 'POST',
        body: {
          contract_id: selectedThread.value.contract.id,
          payment_type: paymentForm.value.payment_type,
          amount: paymentForm.value.amount,
          due_date: paymentForm.value.due_date,
          notes: paymentForm.value.notes || null,
        },
      }
    )

    if (res.message === 'payment_schedule_created') {
      showToast('결제 일정이 생성되었습니다.', 'success')
      showPaymentModal.value = false
      paymentForm.value = {
        payment_type: 'deposit',
        amount: 0,
        due_date: '',
        notes: '',
      }
      await loadThread(selectedThreadId.value!)
    }
  } catch (err: any) {
    console.error('결제 일정 생성 실패:', err)
    showToast(err?.data?.error || '결제 일정 생성에 실패했습니다.', 'error')
  }
}

async function uploadDocument() {
  if (!selectedThread.value?.contract?.id) return

  try {
    const res = await request<{ message: string; data: any }>(
      '/vendor-documents',
      {
        method: 'POST',
        body: {
          contract_id: selectedThread.value.contract.id,
          document_type: documentForm.value.document_type,
          file_url: documentForm.value.file_url,
          file_name: documentForm.value.file_name,
          file_size: documentForm.value.file_size,
        },
      }
    )

    if (res.message === 'document_created') {
      showToast('문서가 업로드되었습니다.', 'success')
      showDocumentModal.value = false
      documentForm.value = {
        document_type: 'quote',
        file_url: '',
        file_name: '',
        file_size: null,
      }
      await loadThread(selectedThreadId.value!)
    }
  } catch (err: any) {
    console.error('문서 업로드 실패:', err)
    showToast(err?.data?.error || '문서 업로드에 실패했습니다.', 'error')
  }
}

async function compareVendors() {
  if (comparingVendorIds.value.length < 2) {
    showToast('최소 2개 이상의 제휴 업체를 선택해주세요.', 'error')
    return
  }

  if (comparingVendorIds.value.length > 5) {
    showToast('최대 5개까지 비교할 수 있습니다.', 'error')
    return
  }

  try {
    const res = await request<{ message: string; data: { vendors: any[] } }>(
      '/vendors/compare',
      {
        method: 'POST',
        body: {
          vendor_ids: comparingVendorIds.value,
        },
      }
    )

    if (res.message === 'vendors_compared') {
      compareResults.value = res.data.vendors
      showCompareModal.value = true
    }
  } catch (err: any) {
    console.error('제휴 업체 비교 실패:', err)
    showToast(err?.data?.error || '제휴 업체 비교에 실패했습니다.', 'error')
  }
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('messages-container')
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPaymentTypeLabel(type: string) {
  const labels: Record<string, string> = {
    deposit: '계약금',
    interim: '중도금',
    balance: '잔금',
    additional: '추가 결제',
  }
  return labels[type] || type
}

function getDocumentTypeLabel(type: string) {
  const labels: Record<string, string> = {
    quote: '견적서',
    contract: '계약서',
    invoice: '청구서',
    receipt: '영수증',
  }
  return labels[type] || type
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'status-pending',
    paid: 'status-paid',
    overdue: 'status-overdue',
    cancelled: 'status-cancelled',
    draft: 'status-draft',
    signed: 'status-signed',
    rejected: 'status-rejected',
  }
  return colors[status] || 'status-default'
}

function getStatusBadge(status: string) {
  const badges: Record<string, string> = {
    pending: '대기 중',
    paid: '완료',
    overdue: '연체',
    cancelled: '취소됨',
    draft: '초안',
    signed: '서명 완료',
    rejected: '거부됨',
  }
  return badges[status] || status
}

function getVendorTypeIcon(type: string | null) {
  const icons: Record<string, string> = {
    IPHONE_SNAP: '📱',
    MC: '🎤',
    SINGER: '🎵',
    STUDIO_PREWEDDING: '📸',
    VENUE_OUTDOOR: '🏞️',
  }
  return icons[type || ''] || '💼'
}

function showDemoThread(thread: VendorThread) {
  selectedThread.value = {
    id: thread.id,
    title: thread.title,
    vendor_id: thread.vendor_id,
    vendor: {
      id: thread.vendor_id,
      name: thread.vendor_name || '데모 제휴 업체',
      vendor_type: thread.vendor_type,
      contact_phone: '010-1234-5678',
      contact_link: 'https://example.com',
    },
    is_active: true,
    messages: demoMessages,
    contract: {
      id: 1,
      contract_date: '2024-01-15',
      total_amount: 5000000,
      deposit_amount: 1000000,
      interim_amount: 2000000,
      balance_amount: 2000000,
      service_date: '2024-05-10',
      notes: '데모 계약 정보입니다.',
      is_active: true,
      payment_schedules: [
        {
          id: 1,
          payment_type: 'deposit',
          amount: 1000000,
          due_date: '2024-02-01',
          paid_date: null,
          payment_method: null,
          status: 'pending',
          reminder_sent: false,
          notes: null,
        },
        {
          id: 2,
          payment_type: 'interim',
          amount: 2000000,
          due_date: '2024-03-15',
          paid_date: null,
          payment_method: null,
          status: 'pending',
          reminder_sent: false,
          notes: null,
        },
        {
          id: 3,
          payment_type: 'balance',
          amount: 2000000,
          due_date: '2024-05-01',
          paid_date: null,
          payment_method: null,
          status: 'pending',
          reminder_sent: false,
          notes: null,
        },
      ],
      documents: [
        {
          id: 1,
          document_type: 'quote',
          version: 1,
          file_url: 'https://example.com/quote.pdf',
          file_name: '견적서_v1.pdf',
          file_size: 1024000,
          status: 'pending',
          signed_at: null,
          signed_by: null,
          created_at: '2024-01-10T09:00:00',
        },
        {
          id: 2,
          document_type: 'contract',
          version: 1,
          file_url: 'https://example.com/contract.pdf',
          file_name: '계약서_v1.pdf',
          file_size: 2048000,
          status: 'signed',
          signed_at: '2024-01-15T10:00:00',
          signed_by: '홍길동',
          created_at: '2024-01-15T09:00:00',
        },
      ],
    },
    created_at: thread.created_at,
  }
  selectedThreadId.value = thread.id
  nextTick(() => {
    scrollToBottom()
  })
}
</script>

<template>
  <section class="vendor-message-section">
    <div class="vendor-message-container">
      <!-- 헤더 -->
      <div class="vendor-header">
        <div class="header-content">
          <h1 class="header-title">
            <span class="header-icon">💬</span>
            제휴 업체 메시지 & 결제 리마인더
          </h1>
          <p class="header-subtitle">
            웨딩 업체와의 계약·일정·결제 일정을 한 곳에서 관리하는 소통·리마인더 시스템
          </p>
          <div class="feature-grid">
            <div class="feature-item">
              <span class="feature-icon">📨</span>
              <div class="feature-content">
                <div class="feature-title">제휴 업체별 메시지 쓰레드</div>
                <div class="feature-desc">카메라, 드레스, 본식스냅 등 업체별 대화방</div>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📄</span>
              <div class="feature-content">
                <div class="feature-title">견적서·계약서 관리</div>
                <div class="feature-desc">업로드·버전 관리, 서명 상태 확인</div>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💰</span>
              <div class="feature-content">
                <div class="feature-title">결제 일정 관리</div>
                <div class="feature-desc">계약금·중도금·잔금 납부일 자동 알림</div>
              </div>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-demo" @click="showHelp = !showHelp">
            {{ showHelp ? '📖 닫기' : '📖 도움말' }}
          </button>
        </div>
      </div>

      <!-- 도움말 -->
      <div v-if="showHelp" class="help-section">
        <h3 class="help-title">📖 사용 가이드</h3>
        <div class="help-content">
          <div class="help-item">
            <div class="help-number">1</div>
            <div class="help-text">
              <h4>제휴 업체와 대화 시작하기</h4>
              <p>"새 대화 시작" 버튼을 클릭하고 제휴 업체를 선택하면 해당 제휴 업체와의 메시지 쓰레드가 생성됩니다.</p>
            </div>
          </div>
          <div class="help-item">
            <div class="help-number">2</div>
            <div class="help-text">
              <h4>계약 정보 관리</h4>
              <p>제휴 업체와 계약이 성사되면 "계약 정보" 버튼을 클릭하여 계약일, 금액, 서비스 일정 등을 등록하세요.</p>
            </div>
          </div>
          <div class="help-item">
            <div class="help-number">3</div>
            <div class="help-text">
              <h4>결제 일정 등록</h4>
              <p>계약 정보가 등록되면 "결제 일정 추가" 버튼으로 계약금, 중도금, 잔금 일정을 등록하세요. 자동으로 캘린더에 등록됩니다.</p>
            </div>
          </div>
          <div class="help-item">
            <div class="help-number">4</div>
            <div class="help-text">
              <h4>문서 관리</h4>
              <p>견적서, 계약서, 청구서, 영수증 등을 업로드하고 버전을 관리할 수 있습니다.</p>
            </div>
          </div>
          <div class="help-item">
            <div class="help-number">5</div>
            <div class="help-text">
              <h4>제휴 업체 비교</h4>
              <p>여러 제휴 업체를 선택하여 가격, 평점, 계약 금액 등을 한눈에 비교할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="!selectedThread && threads.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3 class="empty-title">아직 대화가 없습니다</h3>
        <p class="empty-desc" v-if="!isVendorAccount">제휴 업체와의 첫 대화를 시작해보세요!</p>
        <p class="empty-desc" v-else>고객과의 대화가 시작되면 여기에 표시됩니다.</p>
        <button v-if="!isVendorAccount" class="btn-primary" @click="openNewThreadModal">
          + 새 대화 시작
        </button>
      </div>

      <!-- 메인 콘텐츠 -->
      <div v-else class="main-layout">
        <!-- 왼쪽: 쓰레드 목록 -->
        <div class="thread-list-panel">
          <div class="panel-header">
            <h2 class="panel-title">{{ isVendorAccount ? '고객 대화 목록' : '대화 목록' }}</h2>
            <button v-if="!isVendorAccount" class="btn-new-thread" @click="openNewThreadModal">
              <span>+</span> 새 대화
            </button>
          </div>

          <div class="thread-list">
            <!-- 데모 쓰레드 -->
            <div v-if="threads.length === 0" class="demo-section">
              <div class="demo-label">데모 예시</div>
              <div
                v-for="thread in demoThreads"
                :key="'demo-' + thread.id"
                @click="showDemoThread(thread)"
                :class="['thread-item', { active: selectedThreadId === thread.id }]"
              >
                <div class="thread-header">
                  <div class="thread-vendor-icon">{{ getVendorTypeIcon(thread.vendor_type) }}</div>
                  <div class="thread-info">
                    <h3 class="thread-title">{{ thread.title }}</h3>
                    <p class="thread-preview">{{ thread.last_message?.content || '메시지 없음' }}</p>
                  </div>
                  <span v-if="thread.unread_count > 0" class="unread-badge">{{ thread.unread_count }}</span>
                </div>
                <div class="thread-time">{{ formatTime(thread.last_message_at) }}</div>
              </div>
            </div>

            <!-- 실제 쓰레드 -->
            <div
              v-for="thread in threads"
              :key="thread.id"
              @click="loadThread(thread.id)"
              :class="['thread-item', { active: selectedThreadId === thread.id }]"
            >
              <div class="thread-header">
                <div class="thread-vendor-icon">{{ getVendorTypeIcon(thread.vendor_type) }}</div>
                <div class="thread-info">
                  <h3 class="thread-title">{{ thread.title }}</h3>
                  <p class="thread-preview">{{ thread.last_message?.content || '메시지 없음' }}</p>
                </div>
                <span v-if="thread.unread_count > 0" class="unread-badge">{{ thread.unread_count }}</span>
              </div>
              <div class="thread-time">{{ formatTime(thread.last_message_at) }}</div>
            </div>
          </div>
        </div>

        <!-- 중앙: 메시지 영역 -->
        <div v-if="selectedThread" class="message-panel">
          <!-- 메시지 헤더 -->
          <div class="message-header">
            <div class="message-vendor-info">
              <div class="vendor-avatar">{{ getVendorTypeIcon(selectedThread.vendor.vendor_type) }}</div>
              <div>
                <h3 class="vendor-name" v-if="!isVendorAccount">{{ selectedThread.vendor.name }}</h3>
                <h3 class="vendor-name" v-else>고객과의 대화</h3>
                <p class="vendor-type" v-if="!isVendorAccount">{{ selectedThread.vendor.vendor_type }}</p>
              </div>
            </div>
            <div class="message-actions" v-if="!isVendorAccount">
              <button class="btn-action" @click="showContractModal = true">
                📄 계약 정보
              </button>
              <button class="btn-action secondary" @click="showCompareModal = true">
                ⚖️ 제휴 업체 비교
              </button>
            </div>
          </div>

          <!-- 메시지 목록 -->
          <div id="messages-container" class="messages-container">
            <div
              v-for="message in selectedThread.messages"
              :key="message.id"
              :class="['message-bubble', isMyMessage(message) ? 'my-message' : 'other-message']"
            >
              <div class="message-content">
                <p class="message-text">{{ message.content }}</p>
                <span class="message-time">{{ formatTime(message.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- 메시지 입력 -->
          <div class="message-input-area">
            <input
              v-model="messageInput"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="메시지를 입력하세요..."
              class="message-input"
            />
            <button class="btn-send" @click="sendMessage" :disabled="!messageInput.trim()">
              전송
            </button>
          </div>
        </div>

        <!-- 오른쪽: 계약 정보 사이드바 -->
        <div v-if="selectedThread?.contract" class="contract-panel">
          <h3 class="panel-title">계약 정보</h3>

          <div class="contract-summary">
            <div class="summary-item">
              <span class="summary-label">계약일</span>
              <span class="summary-value">{{ formatDate(selectedThread.contract.contract_date) }}</span>
            </div>
            <div class="summary-item highlight">
              <span class="summary-label">총 계약 금액</span>
              <span class="summary-value large">{{ selectedThread.contract.total_amount?.toLocaleString() }}원</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">서비스 일정</span>
              <span class="summary-value">{{ formatDate(selectedThread.contract.service_date) }}</span>
            </div>
          </div>

          <!-- 결제 일정 -->
          <div class="contract-section">
            <div class="section-header">
              <h4 class="section-title">💰 결제 일정</h4>
              <button class="btn-add" @click="showPaymentModal = true">+ 추가</button>
            </div>
            <div class="payment-list">
              <div
                v-for="schedule in selectedThread.contract.payment_schedules"
                :key="schedule.id"
                :class="['payment-item', getStatusColor(schedule.status)]"
              >
                <div class="payment-header">
                  <span class="payment-type">{{ getPaymentTypeLabel(schedule.payment_type) }}</span>
                  <span :class="['payment-status', getStatusColor(schedule.status)]">
                    {{ getStatusBadge(schedule.status) }}
                  </span>
                </div>
                <div class="payment-amount">{{ schedule.amount.toLocaleString() }}원</div>
                <div class="payment-date">납부일: {{ formatDate(schedule.due_date) }}</div>
              </div>
            </div>
          </div>

          <!-- 문서 -->
          <div class="contract-section">
            <div class="section-header">
              <h4 class="section-title">📄 문서</h4>
              <button class="btn-add" @click="showDocumentModal = true">+ 업로드</button>
            </div>
            <div class="document-list">
              <div
                v-for="doc in selectedThread.contract.documents"
                :key="doc.id"
                class="document-item"
              >
                <div class="document-header">
                  <span class="document-name">{{ getDocumentTypeLabel(doc.document_type) }} v{{ doc.version }}</span>
                  <span :class="['document-status', getStatusColor(doc.status)]">
                    {{ getStatusBadge(doc.status) }}
                  </span>
                </div>
                <a :href="doc.file_url" target="_blank" class="document-link">{{ doc.file_name }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 모달들 -->
    <!-- 새 쓰레드 모달 -->
    <div v-if="showNewThreadModal" class="modal-overlay" @click.self="showNewThreadModal = false">
      <div class="modal-card large">
        <h3 class="modal-title">새 대화 시작</h3>
        <div class="modal-form">
          <div class="form-group">
            <label>카테고리 선택</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
              <button
                v-for="category in vendorCategories"
                :key="category.value"
                type="button"
                @click="selectedVendorCategory = category.value"
                :class="['category-btn', { active: selectedVendorCategory === category.value }]"
              >
                {{ category.icon }} {{ category.label }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>제휴 업체 선택 *</label>
            <div v-if="filteredVendors.length === 0" style="padding: 20px; text-align: center; color: var(--muted);">
              {{ selectedVendorCategory ? '해당 카테고리에 제휴 업체가 없습니다.' : '카테고리를 선택해주세요.' }}
            </div>
            <div v-else style="max-height: 300px; overflow-y: auto; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px;">
              <div
                v-for="(vendors, category) in vendorsByCategory"
                :key="category"
                style="margin-bottom: 16px;"
              >
                <div style="font-weight: 600; font-size: 13px; color: var(--accent); margin-bottom: 8px; padding: 8px; background: rgba(139, 92, 246, 0.1); border-radius: 6px;">
                  {{ getCategoryIcon(category) }} {{ getCategoryLabel(category) }}
                </div>
                <div
                  v-for="vendor in vendors"
                  :key="vendor.id"
                  @click="newThreadForm.vendor_id = vendor.id"
                  :class="['vendor-item', { selected: newThreadForm.vendor_id === vendor.id }]"
                >
                  <div style="font-weight: 600; margin-bottom: 4px;">{{ vendor.name }}</div>
                  <div style="font-size: 12px; color: var(--muted);">
                    {{ vendor.base_location_city }} {{ vendor.base_location_district }}
                  </div>
                  <div v-if="vendor.description" style="font-size: 11px; color: var(--muted); margin-top: 4px; line-height: 1.4;">
                    {{ vendor.description.substring(0, 50) }}{{ vendor.description.length > 50 ? '...' : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>제목 (선택)</label>
            <input
              v-model="newThreadForm.title"
              type="text"
              placeholder="자동 생성됩니다"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showNewThreadModal = false">취소</button>
          <button class="btn-primary" @click="createThread" :disabled="!newThreadForm.vendor_id">생성</button>
        </div>
      </div>
    </div>

    <!-- 계약 정보 모달 -->
    <div v-if="showContractModal" class="modal-overlay" @click.self="showContractModal = false">
      <div class="modal-card large">
        <h3 class="modal-title">계약 정보</h3>
        <div class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>계약일</label>
              <input v-model="contractForm.contract_date" type="date" />
            </div>
            <div class="form-group">
              <label>서비스 일정</label>
              <input v-model="contractForm.service_date" type="date" />
            </div>
          </div>
          <div class="form-group">
            <label>총 계약 금액</label>
            <input v-model.number="contractForm.total_amount" type="number" placeholder="0" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>계약금</label>
              <input v-model.number="contractForm.deposit_amount" type="number" placeholder="0" />
            </div>
            <div class="form-group">
              <label>중도금</label>
              <input v-model.number="contractForm.interim_amount" type="number" placeholder="0" />
            </div>
            <div class="form-group">
              <label>잔금</label>
              <input v-model.number="contractForm.balance_amount" type="number" placeholder="0" />
            </div>
          </div>
          <div class="form-group">
            <label>메모</label>
            <textarea v-model="contractForm.notes" rows="3" placeholder="계약 관련 메모를 입력하세요"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showContractModal = false">취소</button>
          <button class="btn-primary" @click="createContract">저장</button>
        </div>
      </div>
    </div>

    <!-- 결제 일정 모달 -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-card">
        <h3 class="modal-title">결제 일정 추가</h3>
        <div class="modal-form">
          <div class="form-group">
            <label>결제 유형</label>
            <select v-model="paymentForm.payment_type">
              <option value="deposit">계약금</option>
              <option value="interim">중도금</option>
              <option value="balance">잔금</option>
              <option value="additional">추가 결제</option>
            </select>
          </div>
          <div class="form-group">
            <label>금액</label>
            <input v-model.number="paymentForm.amount" type="number" placeholder="0" />
          </div>
          <div class="form-group">
            <label>납부 기한</label>
            <input v-model="paymentForm.due_date" type="date" />
          </div>
          <div class="form-group">
            <label>메모</label>
            <textarea v-model="paymentForm.notes" rows="3" placeholder="결제 관련 메모를 입력하세요"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showPaymentModal = false">취소</button>
          <button class="btn-primary" @click="createPaymentSchedule">저장</button>
        </div>
      </div>
    </div>

    <!-- 문서 업로드 모달 -->
    <div v-if="showDocumentModal" class="modal-overlay" @click.self="showDocumentModal = false">
      <div class="modal-card">
        <h3 class="modal-title">문서 업로드</h3>
        <div class="modal-form">
          <div class="form-group">
            <label>문서 유형</label>
            <select v-model="documentForm.document_type">
              <option value="quote">견적서</option>
              <option value="contract">계약서</option>
              <option value="invoice">청구서</option>
              <option value="receipt">영수증</option>
            </select>
          </div>
          <div class="form-group">
            <label>파일 URL</label>
            <input v-model="documentForm.file_url" type="text" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label>파일명</label>
            <input v-model="documentForm.file_name" type="text" placeholder="파일명을 입력하세요" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDocumentModal = false">취소</button>
          <button class="btn-primary" @click="uploadDocument">업로드</button>
        </div>
      </div>
    </div>

    <!-- 제휴 업체 비교 모달 -->
    <div v-if="showCompareModal" class="modal-overlay" @click.self="showCompareModal = false">
      <div class="modal-card xlarge">
        <h3 class="modal-title">제휴 업체 비교</h3>
        <div v-if="compareResults.length > 0" class="compare-table">
          <table>
            <thead>
              <tr>
                <th>제휴 업체명</th>
                <th>타입</th>
                <th>최소 가격</th>
                <th>최대 가격</th>
                <th>평점</th>
                <th>리뷰 수</th>
                <th>계약 금액</th>
                <th>대기 중 결제</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="vendor in compareResults" :key="vendor.id">
                <td class="vendor-name-cell">{{ vendor.name }}</td>
                <td>{{ vendor.vendor_type }}</td>
                <td class="text-right">{{ vendor.min_price ? vendor.min_price.toLocaleString() + '원' : '-' }}</td>
                <td class="text-right">{{ vendor.max_price ? vendor.max_price.toLocaleString() + '원' : '-' }}</td>
                <td class="text-right">{{ vendor.rating_avg || '-' }}</td>
                <td class="text-right">{{ vendor.review_count || 0 }}</td>
                <td class="text-right">{{ vendor.total_contract_amount ? vendor.total_contract_amount.toLocaleString() + '원' : '-' }}</td>
                <td class="text-right">{{ vendor.pending_payments ? vendor.pending_payments.toLocaleString() + '원' : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-compare">
          비교할 제휴 업체를 선택해주세요.
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCompareModal = false">닫기</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vendor-message-section {
  min-height: calc(100vh - 4rem);
  padding: 24px;
  background: var(--bg);
}

.vendor-message-container {
  max-width: 1600px;
  margin: 0 auto;
}

/* 헤더 */
.vendor-header {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(232, 184, 184, 0.15));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-icon {
  font-size: 36px;
  -webkit-text-fill-color: initial;
}

.header-subtitle {
  font-size: 16px;
  color: var(--muted);
  margin-bottom: 24px;
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.feature-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
}

.feature-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.feature-content {
  flex: 1;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
}

.feature-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}

.header-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-demo {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-demo:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

/* 도움말 */
.help-section {
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.help-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text);
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.help-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border-left: 4px solid var(--accent);
}

.help-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border-radius: 12px;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.help-text h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

.help-text p {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.6;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text);
}

.empty-desc {
  font-size: 16px;
  color: var(--muted);
  margin-bottom: 32px;
}

/* 메인 레이아웃 */
.main-layout {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 24px;
  height: calc(100vh - 300px);
  min-height: 600px;
}

/* 쓰레드 목록 패널 */
.thread-list-panel {
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.btn-new-thread {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-new-thread:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.thread-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.demo-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(139, 92, 246, 0.3);
}

.demo-label {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding: 0 12px;
}

.thread-item {
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.thread-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(4px);
  border-color: rgba(139, 92, 246, 0.3);
}

.thread-item.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(232, 184, 184, 0.15));
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.thread-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.thread-vendor-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.thread-info {
  flex: 1;
  min-width: 0;
}

.thread-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-preview {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-badge {
  background: var(--danger);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  flex-shrink: 0;
}

.thread-time {
  font-size: 11px;
  color: var(--muted);
  padding-left: 36px;
}

/* 메시지 패널 */
.message-panel {
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.message-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(232, 184, 184, 0.1));
}

.message-vendor-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.vendor-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-radius: 12px;
  font-size: 24px;
}

.vendor-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text);
}

.vendor-type {
  font-size: 13px;
  color: var(--muted);
}

.message-actions {
  display: flex;
  gap: 12px;
}

.btn-action {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-action.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.02), transparent);
}

.message-bubble {
  display: flex;
  max-width: 70%;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble.my-message {
  align-self: flex-end;
  margin-left: auto;
}

.message-bubble.other-message {
  align-self: flex-start;
  margin-right: auto;
}

.message-content {
  padding: 14px 18px;
  border-radius: 18px;
  position: relative;
}

.message-bubble.my-message .message-content {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border-bottom-right-radius: 4px;
}

.message-bubble.other-message .message-content {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom-left-radius: 4px;
}

.message-text {
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 6px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}

.message-input-area {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  background: var(--card);
}

.message-input {
  flex: 1;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: var(--text);
  font-size: 15px;
  transition: all 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.btn-send {
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border: none;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 계약 정보 패널 */
.contract-panel {
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.contract-summary {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.summary-item.highlight {
  padding: 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(232, 184, 184, 0.1));
  border-radius: 12px;
  margin: 12px 0;
}

.summary-label {
  font-size: 13px;
  color: var(--muted);
}

.summary-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.summary-value.large {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
}

.contract-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.btn-add {
  padding: 6px 12px;
  background: rgba(139, 92, 246, 0.2);
  color: var(--accent);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  background: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.payment-list,
.document-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.payment-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(4px);
}

.payment-item.status-pending {
  border-left-color: #f59e0b;
}

.payment-item.status-paid {
  border-left-color: #10b981;
}

.payment-item.status-overdue {
  border-left-color: #ef4444;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.payment-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.payment-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}

.payment-status.status-pending {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.payment-status.status-paid {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.payment-status.status-overdue {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.payment-amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}

.payment-date {
  font-size: 12px;
  color: var(--muted);
}

.document-item {
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.document-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(4px);
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.document-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.document-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}

.document-status.status-signed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.document-status.status-pending {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.document-status.status-draft {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.document-link {
  font-size: 12px;
  color: var(--accent);
  text-decoration: none;
  transition: all 0.3s ease;
}

.document-link:hover {
  color: var(--accent-2);
  text-decoration: underline;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 9, 14, 0.88);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-card {
  width: min(480px, 92vw);
  max-height: 90vh;
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-card.large {
  width: min(640px, 92vw);
}

.modal-card.xlarge {
  width: min(90vw, 1200px);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text);
  font-size: 15px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

/* 비교 테이블 */
.compare-table {
  overflow-x: auto;
  margin-bottom: 24px;
}

.compare-table table {
  width: 100%;
  border-collapse: collapse;
}

.compare-table th {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.compare-table td {
  padding: 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text);
}

.compare-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.vendor-name-cell {
  font-weight: 600;
  color: var(--text);
}

.text-right {
  text-align: right;
}

.empty-compare {
  text-align: center;
  padding: 40px;
  color: var(--muted);
}

/* 카테고리 버튼 */
.category-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--accent);
}

.category-btn.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--bg);
  border-color: var(--accent);
}

/* 제휴 업체 아이템 */
.vendor-item {
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.vendor-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateX(4px);
}

.vendor-item.selected {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(232, 184, 184, 0.15));
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

/* 반응형 */
@media (max-width: 1400px) {
  .main-layout {
    grid-template-columns: 280px 1fr 320px;
  }
}

@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 280px 1fr;
  }
  
  .contract-panel {
    display: none;
  }
}

@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .thread-list-panel {
    max-height: 300px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
