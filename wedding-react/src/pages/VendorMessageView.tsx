import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import clsx from 'clsx'
import './VendorMessageView.css'

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
  thread_type?: 'one_on_one' | 'group'
  is_shared_with_partner?: boolean
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

interface ThreadDetail {
  id: number
  title: string
  vendor_id: number
  vendor: Vendor
  is_active: boolean
  messages: VendorMessage[]
  contract: VendorContract | null
  created_at: string | null
  thread_type?: 'one_on_one' | 'group'
  is_shared_with_partner?: boolean
}

const vendorCategories = [
  { value: 'IPHONE_SNAP', label: '아이폰 스냅', icon: '📱' },
  { value: 'STUDIO_PREWEDDING', label: '웨딩 스튜디오', icon: '📸' },
  { value: 'WEDDING_PHOTO', label: '웨딩 사진', icon: '📷' },
  { value: 'VIDEO', label: '웨딩 영상', icon: '🎬' },
  { value: 'WEDDING_HALL', label: '웨딩홀', icon: '🏛️' },
  { value: 'VENUE_INDOOR', label: '실내 식장', icon: '🏢' },
  { value: 'VENUE_OUTDOOR', label: '야외 식장', icon: '🏞️' },
  { value: 'VENUE_COMPLEX', label: '복합 식장', icon: '🏰' },
  { value: 'PLANNER', label: '웨딩 플래너', icon: '📅' },
  { value: 'COORDINATOR', label: '웨딩 코디네이터', icon: '🎯' },
  { value: 'DRESS_SHOP', label: '드레스샵', icon: '👗' },
  { value: 'SUIT_SHOP', label: '턱시도샵', icon: '🤵' },
  { value: 'MAKEUP_HAIR', label: '메이크업/헤어', icon: '💄' },
  { value: 'BEAUTY_SALON', label: '뷰티 살롱', icon: '💅' },
  { value: 'CATERING', label: '케이터링', icon: '🍽️' },
  { value: 'BUFFET', label: '뷔페/식당', icon: '🍴' },
  { value: 'CAKE', label: '케이크/디저트', icon: '🎂' },
  { value: 'BAR', label: '바/음료', icon: '🍷' },
  { value: 'FLORIST', label: '꽃/플로리스트', icon: '🌸' },
  { value: 'DECORATION', label: '장식/데코', icon: '🎨' },
  { value: 'BOUQUET', label: '부케/꽃다발', icon: '💐' },
  { value: 'JEWELRY', label: '예물/주얼리', icon: '💍' },
  { value: 'RING', label: '예물/반지', icon: '💎' },
  { value: 'WEDDING_CAR', label: '웨딩카', icon: '🚗' },
  { value: 'LIMOUSINE', label: '리무진', icon: '🚙' },
  { value: 'TRANSPORTATION', label: '교통/운송', icon: '🚌' },
  { value: 'MC', label: '사회자', icon: '🎤' },
  { value: 'SINGER', label: '축가', icon: '🎵' },
  { value: 'BAND', label: '밴드/연주자', icon: '🎸' },
  { value: 'MUSIC', label: '축가/연주', icon: '🎼' },
  { value: 'INVITATION', label: '청첩장/인쇄', icon: '💌' },
  { value: 'GIFT', label: '웨딩선물/답례품', icon: '🎁' },
  { value: 'HOTEL', label: '호텔/숙박', icon: '🏨' },
  { value: 'WEDDING_FAIR', label: '웨딩박람회', icon: '🎪' },
  { value: 'HANBOK', label: '한복', icon: '🎎' },
  { value: 'HONEYMOON', label: '신혼여행', icon: '✈️' }
]

const demoThreads: VendorThread[] = [
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
]

const demoMessages: VendorMessage[] = [
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
]

export default function VendorMessageView() {
  const authStore = useAuthStore()
  const { request } = useApi()
  const { showToast } = useToast()

  const [threads, setThreads] = useState<VendorThread[]>([])
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isMessagePrivate, setIsMessagePrivate] = useState(false)
  const [loading, setLoading] = useState(false)

  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeleteThreadModal, setShowDeleteThreadModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const [newThreadForm, setNewThreadForm] = useState({
    vendor_id: 0,
    title: '',
    thread_type: 'one_on_one' as 'one_on_one' | 'group',
    is_shared_with_partner: true,
  })

  const [vendorList, setVendorList] = useState<VendorListItem[]>([])
  const [selectedVendorCategory, setSelectedVendorCategory] = useState<string>('')

  const [contractForm, setContractForm] = useState({
    contract_date: '',
    total_amount: null as number | null,
    deposit_amount: null as number | null,
    interim_amount: null as number | null,
    balance_amount: null as number | null,
    service_date: '',
    notes: '',
  })

  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'deposit' as 'deposit' | 'interim' | 'balance' | 'additional',
    amount: 0,
    due_date: '',
    notes: '',
  })

  const [documentForm, setDocumentForm] = useState({
    document_type: 'quote' as 'quote' | 'contract' | 'invoice' | 'receipt',
    file_url: '',
    file_name: '',
    file_size: null as number | null,
  })

  const [comparingVendorIds, setComparingVendorIds] = useState<number[]>([])
  const [compareResults, setCompareResults] = useState<any[]>([])

  const [inviteForm, setInviteForm] = useState({
    user_ids: [] as number[]
  })
  const [availableUsers, setAvailableUsers] = useState<any[]>([])

  const [isMobile, setIsMobile] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const isVendorAccount = useMemo(() => authStore.user?.role === 'PARTNER_VENDOR', [authStore.user?.role])

  const filteredVendors = useMemo(() => {
    if (!selectedVendorCategory) {
      return vendorList
    }
    return vendorList.filter(v => v.vendor_type === selectedVendorCategory)
  }, [vendorList, selectedVendorCategory])

  const vendorsByCategory = useMemo(() => {
    const grouped: Record<string, VendorListItem[]> = {}
    filteredVendors.forEach(vendor => {
      const category = vendor.vendor_type
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(vendor)
    })
    return grouped
  }, [filteredVendors])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadThreads()
    if (!isVendorAccount) {
      loadVendors()
      loadAvailableUsers()
    }
  }, [isVendorAccount])

  useEffect(() => {
    if (newThreadForm.vendor_id && vendorList.length > 0) {
      const vendor = vendorList.find(v => v.id === newThreadForm.vendor_id)
      if (vendor && !newThreadForm.title) {
        const categoryLabel = getCategoryLabel(vendor.vendor_type)
        setNewThreadForm(prev => ({ ...prev, title: `${vendor.name}와의 대화` }))
      }
    }
  }, [newThreadForm.vendor_id, vendorList])

  useEffect(() => {
    if (selectedThread?.messages && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [selectedThread?.messages])

  const loadAvailableUsers = useCallback(async () => {
    try {
      const res = await request<{ message: string; data: any }>('/couple/info')
      if (res.message === 'couple_info_retrieved' && res.data?.partner) {
        setAvailableUsers([{
          id: res.data.partner.id,
          nickname: res.data.partner.nickname,
          email: res.data.partner.email,
          gender: res.data.partner.gender
        }])
      }
    } catch (err: any) {
      console.error('사용자 목록 로드 실패:', err)
      setAvailableUsers([])
    }
  }, [request])

  const loadVendors = useCallback(async () => {
    try {
      const res = await request<{ message: string; data: { vendors: VendorListItem[] } }>(
        '/vendors',
        { method: 'GET' }
      )
      if (res.message === 'vendors_retrieved') {
        setVendorList(res.data.vendors || [])
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
  }, [request, showToast])

  const getCategoryLabel = useCallback((type: string) => {
    const category = vendorCategories.find(c => c.value === type)
    return category ? category.label : type
  }, [])

  const getCategoryIcon = useCallback((type: string) => {
    const category = vendorCategories.find(c => c.value === type)
    return category ? category.icon : '📋'
  }, [])

  const loadThreads = useCallback(async () => {
    try {
      const res = await request<{ message: string; data: { threads: VendorThread[] } }>(
        '/vendor-threads',
        { method: 'GET' }
      )
      if (res.message === 'threads_retrieved') {
        setThreads(res.data.threads)
      }
    } catch (err) {
      console.error('쓰레드 목록 로드 실패:', err)
      showToast('쓰레드 목록을 불러오는데 실패했습니다.', 'error')
    }
  }, [request, showToast])

  const loadThread = useCallback(async (threadId: number) => {
    try {
      const res = await request<{ message: string; data: ThreadDetail }>(
        `/vendor-threads/${threadId}`,
        { method: 'GET' }
      )
      if (res.message === 'thread_retrieved') {
        setSelectedThread(res.data)
        setSelectedThreadId(threadId)
        setTimeout(() => {
          scrollToBottom()
        }, 0)
      }
    } catch (err) {
      console.error('쓰레드 상세 로드 실패:', err)
      showToast('쓰레드를 불러오는데 실패했습니다.', 'error')
    }
  }, [request, showToast])

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  const openNewThreadModal = useCallback(() => {
    setShowNewThreadModal(true)
    setSelectedVendorCategory('')
    setNewThreadForm({ 
      vendor_id: 0, 
      title: '',
      thread_type: 'one_on_one',
      is_shared_with_partner: true
    })
  }, [])

  const createThread = useCallback(async () => {
    if (!newThreadForm.vendor_id || newThreadForm.vendor_id <= 0) {
      showToast('제휴 업체를 선택해주세요.', 'error')
      return
    }

    try {
      const res = await request<{ message: string; data: any }>(
        '/vendor-threads',
        {
          method: 'POST',
          body: {
            vendor_id: newThreadForm.vendor_id,
            thread_type: newThreadForm.thread_type || 'one_on_one',
            is_shared_with_partner: newThreadForm.is_shared_with_partner,
            title: newThreadForm.title || null,
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
        setShowNewThreadModal(false)
        setNewThreadForm({ 
          vendor_id: 0, 
          title: '',
          thread_type: 'one_on_one',
          is_shared_with_partner: true
        })
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
  }, [newThreadForm, request, showToast, loadThreads, loadThread])

  const isMyMessage = useCallback((message: VendorMessage): boolean => {
    if (isVendorAccount) {
      return message.sender_type === 'vendor'
    } else {
      return message.sender_type === 'user'
    }
  }, [isVendorAccount])

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedThreadId) return

    try {
      const thread = threads.find(t => t.id === selectedThreadId)
      const isVisibleToPartner = thread?.thread_type === 'one_on_one' && thread?.is_shared_with_partner
        ? !isMessagePrivate
        : true

      const res = await request<{ message: string; data: any }>(
        '/vendor-messages',
        {
          method: 'POST',
          body: {
            thread_id: selectedThreadId,
            content: messageInput.trim(),
            attachments: [],
            is_visible_to_partner: isVisibleToPartner,
          },
        }
      )

      if (res.message === 'message_sent') {
        setMessageInput('')
        setIsMessagePrivate(false)
        await loadThread(selectedThreadId)
        await loadThreads()
      }
    } catch (err: any) {
      console.error('메시지 전송 실패:', err)
      showToast('메시지 전송에 실패했습니다.', 'error')
    }
  }, [messageInput, selectedThreadId, threads, isMessagePrivate, request, showToast, loadThread, loadThreads])

  const createContract = useCallback(async () => {
    if (!selectedThreadId) return

    try {
      const res = await request<{ message: string; data: any }>(
        '/vendor-contracts',
        {
          method: 'POST',
          body: {
            thread_id: selectedThreadId,
            contract_date: contractForm.contract_date || null,
            total_amount: contractForm.total_amount,
            deposit_amount: contractForm.deposit_amount,
            interim_amount: contractForm.interim_amount,
            balance_amount: contractForm.balance_amount,
            service_date: contractForm.service_date || null,
            notes: contractForm.notes || null,
          },
        }
      )

      if (res.message === 'contract_created') {
        showToast('계약 정보가 생성되었습니다.', 'success')
        setShowContractModal(false)
        setContractForm({
          contract_date: '',
          total_amount: null,
          deposit_amount: null,
          interim_amount: null,
          balance_amount: null,
          service_date: '',
          notes: '',
        })
        await loadThread(selectedThreadId)
      }
    } catch (err: any) {
      console.error('계약 생성 실패:', err)
      showToast(err?.data?.error || '계약 생성에 실패했습니다.', 'error')
    }
  }, [selectedThreadId, contractForm, request, showToast, loadThread])

  const createPaymentSchedule = useCallback(async () => {
    if (!selectedThread?.contract?.id) return

    try {
      const res = await request<{ message: string; data: any }>(
        '/vendor-payment-schedules',
        {
          method: 'POST',
          body: {
            contract_id: selectedThread.contract.id,
            payment_type: paymentForm.payment_type,
            amount: paymentForm.amount,
            due_date: paymentForm.due_date,
            notes: paymentForm.notes || null,
          },
        }
      )

      if (res.message === 'payment_schedule_created') {
        showToast('결제 일정이 생성되었습니다.', 'success')
        setShowPaymentModal(false)
        setPaymentForm({
          payment_type: 'deposit',
          amount: 0,
          due_date: '',
          notes: '',
        })
        await loadThread(selectedThreadId!)
      }
    } catch (err: any) {
      console.error('결제 일정 생성 실패:', err)
      showToast(err?.data?.error || '결제 일정 생성에 실패했습니다.', 'error')
    }
  }, [selectedThread, paymentForm, request, showToast, loadThread, selectedThreadId])

  const uploadDocument = useCallback(async () => {
    if (!selectedThread?.contract?.id) return

    try {
      const res = await request<{ message: string; data: any }>(
        '/vendor-documents',
        {
          method: 'POST',
          body: {
            contract_id: selectedThread.contract.id,
            document_type: documentForm.document_type,
            file_url: documentForm.file_url,
            file_name: documentForm.file_name,
            file_size: documentForm.file_size,
          },
        }
      )

      if (res.message === 'document_created') {
        showToast('문서가 업로드되었습니다.', 'success')
        setShowDocumentModal(false)
        setDocumentForm({
          document_type: 'quote',
          file_url: '',
          file_name: '',
          file_size: null,
        })
        await loadThread(selectedThreadId!)
      }
    } catch (err: any) {
      console.error('문서 업로드 실패:', err)
      showToast(err?.data?.error || '문서 업로드에 실패했습니다.', 'error')
    }
  }, [selectedThread, documentForm, request, showToast, loadThread, selectedThreadId])

  const deleteThread = useCallback(async () => {
    if (!selectedThreadId) return

    try {
      const res = await request<{ message: string; data: any }>(
        `/vendor-threads/${selectedThreadId}`,
        {
          method: 'DELETE',
        }
      )

      if (res.message === 'thread_deleted') {
        showToast('대화가 삭제되었습니다.', 'success')
        setShowDeleteThreadModal(false)
        setSelectedThreadId(null)
        setSelectedThread(null)
        await loadThreads()
      } else {
        showToast(res.message || '대화 삭제에 실패했습니다.', 'error')
      }
    } catch (err: any) {
      console.error('대화 삭제 실패:', err)
      showToast(err?.data?.error || '대화 삭제에 실패했습니다.', 'error')
    }
  }, [selectedThreadId, request, showToast, loadThreads])

  const inviteParticipant = useCallback(async () => {
    if (!selectedThreadId || inviteForm.user_ids.length === 0) {
      showToast('초대할 사용자를 선택해주세요.', 'error')
      return
    }

    try {
      const res = await request<{ message: string; data: any }>(
        `/vendor-threads/${selectedThreadId}/invite`,
        {
          method: 'POST',
          body: {
            user_ids: inviteForm.user_ids,
          },
        }
      )

      if (res.message === 'participants_invited') {
        showToast('참여자가 초대되었습니다.', 'success')
        setShowInviteModal(false)
        setInviteForm({ user_ids: [] })
        await loadThread(selectedThreadId)
        await loadThreads()
      } else {
        showToast(res.message || '참여자 초대에 실패했습니다.', 'error')
      }
    } catch (err: any) {
      console.error('참여자 초대 실패:', err)
      showToast(err?.data?.error || '참여자 초대에 실패했습니다.', 'error')
    }
  }, [selectedThreadId, inviteForm, request, showToast, loadThread, loadThreads])

  const compareVendors = useCallback(async () => {
    if (comparingVendorIds.length < 2) {
      showToast('최소 2개 이상의 제휴 업체를 선택해주세요.', 'error')
      return
    }

    if (comparingVendorIds.length > 5) {
      showToast('최대 5개까지 비교할 수 있습니다.', 'error')
      return
    }

    try {
      const res = await request<{ message: string; data: { vendors: any[] } }>(
        '/vendors/compare',
        {
          method: 'POST',
          body: {
            vendor_ids: comparingVendorIds,
          },
        }
      )

      if (res.message === 'vendors_compared') {
        setCompareResults(res.data.vendors)
        setShowCompareModal(true)
      }
    } catch (err: any) {
      console.error('제휴 업체 비교 실패:', err)
      showToast(err?.data?.error || '제휴 업체 비교에 실패했습니다.', 'error')
    }
  }, [comparingVendorIds, request, showToast])

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  const formatTime = useCallback((dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  const getPaymentTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = {
      deposit: '계약금',
      interim: '중도금',
      balance: '잔금',
      additional: '추가 결제',
    }
    return labels[type] || type
  }, [])

  const getDocumentTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = {
      quote: '견적서',
      contract: '계약서',
      invoice: '청구서',
      receipt: '영수증',
    }
    return labels[type] || type
  }, [])

  const getStatusColor = useCallback((status: string) => {
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
  }, [])

  const getStatusBadge = useCallback((status: string) => {
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
  }, [])

  const getVendorTypeIcon = useCallback((type: string | null) => {
    const icons: Record<string, string> = {
      IPHONE_SNAP: '📱',
      MC: '🎤',
      SINGER: '🎵',
      STUDIO_PREWEDDING: '📸',
      VENUE_OUTDOOR: '🏞️',
    }
    return icons[type || ''] || '💼'
  }, [])

  const showDemoThread = useCallback((thread: VendorThread) => {
    setSelectedThread({
      id: thread.id,
      title: thread.title,
      vendor_id: thread.vendor_id,
      vendor: {
        id: thread.vendor_id,
        name: thread.vendor_name || '데모 제휴 업체',
        vendor_type: thread.vendor_type,
        contact_phone: '010-1234-5678',
        contact_link: 'https://example.com',
        description: null,
        base_location_city: '',
        base_location_district: '',
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
    })
    setSelectedThreadId(thread.id)
    setTimeout(() => {
      scrollToBottom()
    }, 0)
  }, [scrollToBottom])

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  return (
    <section className="vendor-message-section">
      <div className="vendor-message-container">
        <div className="vendor-header">
          <div className="header-content">
            <h1 className="header-title">
              <span className="header-icon">💬</span>
              제휴 업체 메시지 & 결제 리마인더
            </h1>
            <p className="header-subtitle">
              웨딩 업체와의 계약·일정·결제 일정을 한 곳에서 관리하는 소통·리마인더 시스템
            </p>
            <div className="feature-grid">
              <div className="feature-item">
                <span className="feature-icon">📨</span>
                <div className="feature-content">
                  <div className="feature-title">제휴 업체별 메시지 쓰레드</div>
                  <div className="feature-desc">카메라, 드레스, 본식스냅 등 업체별 대화방</div>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📄</span>
                <div className="feature-content">
                  <div className="feature-title">견적서·계약서 관리</div>
                  <div className="feature-desc">업로드·버전 관리, 서명 상태 확인</div>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <div className="feature-content">
                  <div className="feature-title">결제 일정 관리</div>
                  <div className="feature-desc">계약금·중도금·잔금 납부일 자동 알림</div>
                </div>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-demo" onClick={() => setShowHelp(!showHelp)}>
              {showHelp ? '📖 닫기' : '📖 도움말'}
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="help-section">
            <h3 className="help-title">📖 사용 가이드</h3>
            <div className="help-content">
              <div className="help-item">
                <div className="help-number">1</div>
                <div className="help-text">
                  <h4>제휴 업체와 대화 시작하기</h4>
                  <p>"새 대화 시작" 버튼을 클릭하고 제휴 업체를 선택하면 해당 제휴 업체와의 메시지 쓰레드가 생성됩니다.</p>
                </div>
              </div>
              <div className="help-item">
                <div className="help-number">2</div>
                <div className="help-text">
                  <h4>계약 정보 관리</h4>
                  <p>제휴 업체와 계약이 성사되면 "계약 정보" 버튼을 클릭하여 계약일, 금액, 서비스 일정 등을 등록하세요.</p>
                </div>
              </div>
              <div className="help-item">
                <div className="help-number">3</div>
                <div className="help-text">
                  <h4>결제 일정 등록</h4>
                  <p>계약 정보가 등록되면 "결제 일정 추가" 버튼으로 계약금, 중도금, 잔금 일정을 등록하세요. 자동으로 캘린더에 등록됩니다.</p>
                </div>
              </div>
              <div className="help-item">
                <div className="help-number">4</div>
                <div className="help-text">
                  <h4>문서 관리</h4>
                  <p>견적서, 계약서, 청구서, 영수증 등을 업로드하고 버전을 관리할 수 있습니다.</p>
                </div>
              </div>
              <div className="help-item">
                <div className="help-number">5</div>
                <div className="help-text">
                  <h4>제휴 업체 비교</h4>
                  <p>여러 제휴 업체를 선택하여 가격, 평점, 계약 금액 등을 한눈에 비교할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedThread && threads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3 className="empty-title">아직 대화가 없습니다</h3>
            <p className="empty-desc">
              {!isVendorAccount ? '제휴 업체와의 첫 대화를 시작해보세요!' : '고객과의 대화가 시작되면 여기에 표시됩니다.'}
            </p>
            {!isVendorAccount && (
              <button className="btn-primary" onClick={openNewThreadModal}>
                + 새 대화 시작
              </button>
            )}
          </div>
        ) : (
          <div className="main-layout">
            <div className="thread-list-panel">
              <div className="panel-header">
                <h2 className="panel-title">{isVendorAccount ? '고객 대화 목록' : '대화 목록'}</h2>
                {!isVendorAccount && (
                  <button className="btn-new-thread" onClick={openNewThreadModal}>
                    <span>+</span> 새 대화
                  </button>
                )}
              </div>

              <div className="thread-list">
                {threads.length === 0 && (
                  <div className="demo-section">
                    <div className="demo-label">데모 예시</div>
                    {demoThreads.map(thread => (
                      <div
                        key={`demo-${thread.id}`}
                        className={clsx('thread-item', { active: selectedThreadId === thread.id })}
                        onClick={() => showDemoThread(thread)}
                      >
                        <div className="thread-header">
                          <div className="thread-vendor-icon">{getVendorTypeIcon(thread.vendor_type)}</div>
                          <div className="thread-info">
                            <h3 className="thread-title">{thread.title}</h3>
                            <p className="thread-preview">{thread.last_message?.content || '메시지 없음'}</p>
                          </div>
                          {thread.unread_count > 0 && (
                            <span className="unread-badge">{thread.unread_count}</span>
                          )}
                        </div>
                        <div className="thread-time">{formatTime(thread.last_message_at)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {threads.map(thread => (
                  <div
                    key={thread.id}
                    className={clsx('thread-item', { active: selectedThreadId === thread.id })}
                    onClick={() => loadThread(thread.id)}
                  >
                    <div className="thread-header">
                      <div className="thread-vendor-icon">{getVendorTypeIcon(thread.vendor_type)}</div>
                      <div className="thread-info">
                        <h3 className="thread-title">{thread.title}</h3>
                        <p className="thread-preview">{thread.last_message?.content || '메시지 없음'}</p>
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="unread-badge">{thread.unread_count}</span>
                      )}
                    </div>
                    <div className="thread-time">{formatTime(thread.last_message_at)}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedThread && (
              <div className="message-panel">
                <div className="message-header">
                  <div className="message-vendor-info">
                    <div className="vendor-avatar">{getVendorTypeIcon(selectedThread.vendor.vendor_type)}</div>
                    <div>
                      <h3 className="vendor-name">{!isVendorAccount ? selectedThread.vendor.name : '고객과의 대화'}</h3>
                      {!isVendorAccount && (
                        <p className="vendor-type">{selectedThread.vendor.vendor_type}</p>
                      )}
                    </div>
                  </div>
                  {!isVendorAccount && (
                    <div className={clsx('message-actions', { 'mobile-actions': isMobile })}>
                      {(selectedThread?.thread_type === 'one_on_one' || selectedThread?.thread_type === 'group') && (
                        <button className="btn-action secondary" onClick={() => setShowInviteModal(true)}>
                          👥 초대
                        </button>
                      )}
                      <button className="btn-action" onClick={() => setShowContractModal(true)}>
                        📄 계약 정보
                      </button>
                      <button className="btn-action secondary" onClick={() => setShowCompareModal(true)}>
                        ⚖️ 비교
                      </button>
                      <button className="btn-action secondary btn-delete" onClick={() => setShowDeleteThreadModal(true)}>
                        🗑️ 삭제
                      </button>
                    </div>
                  )}
                </div>

                <div id="messages-container" ref={messagesContainerRef} className="messages-container">
                  {selectedThread.messages.map(message => (
                    <div
                      key={message.id}
                      className={clsx('message-bubble', isMyMessage(message) ? 'my-message' : 'other-message')}
                    >
                      <div className="message-content">
                        <p className="message-text">{message.content}</p>
                        <span className="message-time">{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="message-input-area">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      type="text"
                      placeholder="메시지를 입력하세요..."
                      className="message-input"
                    />
                    {selectedThread?.thread_type === 'one_on_one' && selectedThread?.is_shared_with_partner && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', padding: '4px 8px' }}>
                        <input 
                          type="checkbox" 
                          checked={isMessagePrivate}
                          onChange={(e) => setIsMessagePrivate(e.target.checked)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                        <span>파트너에게 비공개</span>
                      </label>
                    )}
                  </div>
                  <button className="btn-send" onClick={sendMessage} disabled={!messageInput.trim()}>
                    전송
                  </button>
                </div>
              </div>
            )}

            {selectedThread?.contract && (
              <div className="contract-panel">
                <h3 className="panel-title">계약 정보</h3>

                <div className="contract-summary">
                  <div className="summary-item">
                    <span className="summary-label">계약일</span>
                    <span className="summary-value">{formatDate(selectedThread.contract.contract_date)}</span>
                  </div>
                  <div className="summary-item highlight">
                    <span className="summary-label">총 계약 금액</span>
                    <span className="summary-value large">{selectedThread.contract.total_amount?.toLocaleString()}원</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">서비스 일정</span>
                    <span className="summary-value">{formatDate(selectedThread.contract.service_date)}</span>
                  </div>
                </div>

                <div className="contract-section">
                  <div className="section-header">
                    <h4 className="section-title">💰 결제 일정</h4>
                    <button className="btn-add" onClick={() => setShowPaymentModal(true)}>+ 추가</button>
                  </div>
                  <div className="payment-list">
                    {selectedThread.contract.payment_schedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className={clsx('payment-item', getStatusColor(schedule.status))}
                      >
                        <div className="payment-header">
                          <span className="payment-type">{getPaymentTypeLabel(schedule.payment_type)}</span>
                          <span className={clsx('payment-status', getStatusColor(schedule.status))}>
                            {getStatusBadge(schedule.status)}
                          </span>
                        </div>
                        <div className="payment-amount">{schedule.amount.toLocaleString()}원</div>
                        <div className="payment-date">납부일: {formatDate(schedule.due_date)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="contract-section">
                  <div className="section-header">
                    <h4 className="section-title">📄 문서</h4>
                    <button className="btn-add" onClick={() => setShowDocumentModal(true)}>+ 업로드</button>
                  </div>
                  <div className="document-list">
                    {selectedThread.contract.documents.map(doc => (
                      <div key={doc.id} className="document-item">
                        <div className="document-header">
                          <span className="document-name">{getDocumentTypeLabel(doc.document_type)} v{doc.version}</span>
                          <span className={clsx('document-status', getStatusColor(doc.status))}>
                            {getStatusBadge(doc.status)}
                          </span>
                        </div>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="document-link">{doc.file_name}</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewThreadModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowNewThreadModal(false)
        }}>
          <div className="modal-card large">
            <h3 className="modal-title">새 대화 시작</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>카테고리 선택</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {vendorCategories.map(category => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedVendorCategory(category.value)}
                      className={clsx('category-btn', { active: selectedVendorCategory === category.value })}
                    >
                      {category.icon} {category.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>제휴 업체 선택 *</label>
                {filteredVendors.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
                    {selectedVendorCategory ? '해당 카테고리에 제휴 업체가 없습니다.' : '카테고리를 선택해주세요.'}
                  </div>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, padding: 8 }}>
                    {Object.entries(vendorsByCategory).map(([category, vendors]) => (
                      <div key={category} style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)', marginBottom: 8, padding: 8, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 6 }}>
                          {getCategoryIcon(category)} {getCategoryLabel(category)}
                        </div>
                        {vendors.map(vendor => (
                          <div
                            key={vendor.id}
                            className={clsx('vendor-item', { selected: newThreadForm.vendor_id === vendor.id })}
                            onClick={() => setNewThreadForm(prev => ({ ...prev, vendor_id: vendor.id }))}
                          >
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{vendor.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {vendor.base_location_city} {vendor.base_location_district}
                            </div>
                            {vendor.description && (
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
                                {vendor.description.substring(0, 50)}{vendor.description.length > 50 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>제목 (선택)</label>
                <input
                  value={newThreadForm.title}
                  onChange={(e) => setNewThreadForm(prev => ({ ...prev, title: e.target.value }))}
                  type="text"
                  placeholder="자동 생성됩니다"
                />
              </div>
              <div className="form-group">
                <label>대화 유형</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    padding: 16,
                    background: newThreadForm.thread_type === 'one_on_one' 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(232, 184, 184, 0.2))' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    flex: 1,
                    border: newThreadForm.thread_type === 'one_on_one' 
                      ? '2px solid var(--accent)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    boxShadow: newThreadForm.thread_type === 'one_on_one' 
                      ? '0 4px 12px rgba(139, 92, 246, 0.3)' 
                      : 'none'
                  }}>
                    <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
                      <input 
                        type="radio" 
                        checked={newThreadForm.thread_type === 'one_on_one'}
                        onChange={() => setNewThreadForm(prev => ({ ...prev, thread_type: 'one_on_one' }))}
                        style={{ cursor: 'pointer', width: 24, height: 24, margin: 0, accentColor: 'var(--accent)' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: newThreadForm.thread_type === 'one_on_one' ? 'var(--accent)' : 'var(--text)' }}>1대1 채팅</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>나와 업체만</div>
                    </div>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    padding: 16,
                    background: newThreadForm.thread_type === 'group' 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(232, 184, 184, 0.2))' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    flex: 1,
                    border: newThreadForm.thread_type === 'group' 
                      ? '2px solid var(--accent)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    boxShadow: newThreadForm.thread_type === 'group' 
                      ? '0 4px 12px rgba(139, 92, 246, 0.3)' 
                      : 'none'
                  }}>
                    <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
                      <input 
                        type="radio" 
                        checked={newThreadForm.thread_type === 'group'}
                        onChange={() => setNewThreadForm(prev => ({ ...prev, thread_type: 'group' }))}
                        style={{ cursor: 'pointer', width: 24, height: 24, margin: 0, accentColor: 'var(--accent)' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: newThreadForm.thread_type === 'group' ? 'var(--accent)' : 'var(--text)' }}>단체톡방</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>신랑 + 신부 + 업체</div>
                    </div>
                  </label>
                </div>
              </div>
              {newThreadForm.thread_type === 'one_on_one' && (
                <div className="form-group">
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    padding: 16,
                    background: newThreadForm.is_shared_with_partner 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(232, 184, 184, 0.15))' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    border: newThreadForm.is_shared_with_partner 
                      ? '2px solid var(--accent)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    boxShadow: newThreadForm.is_shared_with_partner 
                      ? '0 2px 8px rgba(139, 92, 246, 0.2)' 
                      : 'none'
                  }}>
                    <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={newThreadForm.is_shared_with_partner}
                        onChange={(e) => setNewThreadForm(prev => ({ ...prev, is_shared_with_partner: e.target.checked }))}
                        style={{ cursor: 'pointer', width: 24, height: 24, margin: 0, accentColor: 'var(--accent)' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: newThreadForm.is_shared_with_partner ? 'var(--accent)' : 'var(--text)' }}>파트너와 공유</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>상대방도 이 대화를 볼 수 있습니다</div>
                    </div>
                  </label>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowNewThreadModal(false)}>취소</button>
              <button className="btn-primary" onClick={createThread} disabled={!newThreadForm.vendor_id}>생성</button>
            </div>
          </div>
        </div>
      )}

      {showContractModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowContractModal(false)
        }}>
          <div className="modal-card large">
            <h3 className="modal-title">계약 정보</h3>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>계약일</label>
                  <input value={contractForm.contract_date} onChange={(e) => setContractForm(prev => ({ ...prev, contract_date: e.target.value }))} type="date" />
                </div>
                <div className="form-group">
                  <label>서비스 일정</label>
                  <input value={contractForm.service_date} onChange={(e) => setContractForm(prev => ({ ...prev, service_date: e.target.value }))} type="date" />
                </div>
              </div>
              <div className="form-group">
                <label>총 계약 금액</label>
                <input value={contractForm.total_amount || ''} onChange={(e) => setContractForm(prev => ({ ...prev, total_amount: e.target.value ? Number(e.target.value) : null }))} type="number" placeholder="0" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>계약금</label>
                  <input value={contractForm.deposit_amount || ''} onChange={(e) => setContractForm(prev => ({ ...prev, deposit_amount: e.target.value ? Number(e.target.value) : null }))} type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>중도금</label>
                  <input value={contractForm.interim_amount || ''} onChange={(e) => setContractForm(prev => ({ ...prev, interim_amount: e.target.value ? Number(e.target.value) : null }))} type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>잔금</label>
                  <input value={contractForm.balance_amount || ''} onChange={(e) => setContractForm(prev => ({ ...prev, balance_amount: e.target.value ? Number(e.target.value) : null }))} type="number" placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label>메모</label>
                <textarea value={contractForm.notes} onChange={(e) => setContractForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="계약 관련 메모를 입력하세요"></textarea>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowContractModal(false)}>취소</button>
              <button className="btn-primary" onClick={createContract}>저장</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPaymentModal(false)
        }}>
          <div className="modal-card">
            <h3 className="modal-title">결제 일정 추가</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>결제 유형</label>
                <select value={paymentForm.payment_type} onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_type: e.target.value as typeof paymentForm.payment_type }))}>
                  <option value="deposit">계약금</option>
                  <option value="interim">중도금</option>
                  <option value="balance">잔금</option>
                  <option value="additional">추가 결제</option>
                </select>
              </div>
              <div className="form-group">
                <label>금액</label>
                <input value={paymentForm.amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))} type="number" placeholder="0" />
              </div>
              <div className="form-group">
                <label>납부 기한</label>
                <input value={paymentForm.due_date} onChange={(e) => setPaymentForm(prev => ({ ...prev, due_date: e.target.value }))} type="date" />
              </div>
              <div className="form-group">
                <label>메모</label>
                <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="결제 관련 메모를 입력하세요"></textarea>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>취소</button>
              <button className="btn-primary" onClick={createPaymentSchedule}>저장</button>
            </div>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowDocumentModal(false)
        }}>
          <div className="modal-card">
            <h3 className="modal-title">문서 업로드</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>문서 유형</label>
                <select value={documentForm.document_type} onChange={(e) => setDocumentForm(prev => ({ ...prev, document_type: e.target.value as typeof documentForm.document_type }))}>
                  <option value="quote">견적서</option>
                  <option value="contract">계약서</option>
                  <option value="invoice">청구서</option>
                  <option value="receipt">영수증</option>
                </select>
              </div>
              <div className="form-group">
                <label>파일 URL</label>
                <input value={documentForm.file_url} onChange={(e) => setDocumentForm(prev => ({ ...prev, file_url: e.target.value }))} type="text" placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>파일명</label>
                <input value={documentForm.file_name} onChange={(e) => setDocumentForm(prev => ({ ...prev, file_name: e.target.value }))} type="text" placeholder="파일명을 입력하세요" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDocumentModal(false)}>취소</button>
              <button className="btn-primary" onClick={uploadDocument}>업로드</button>
            </div>
          </div>
        </div>
      )}

      {showCompareModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowCompareModal(false)
        }}>
          <div className="modal-card xlarge">
            <h3 className="modal-title">제휴 업체 비교</h3>
            {compareResults.length > 0 ? (
              <div className="compare-table">
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
                    {compareResults.map(vendor => (
                      <tr key={vendor.id}>
                        <td className="vendor-name-cell">{vendor.name}</td>
                        <td>{vendor.vendor_type}</td>
                        <td className="text-right">{vendor.min_price ? vendor.min_price.toLocaleString() + '원' : '-'}</td>
                        <td className="text-right">{vendor.max_price ? vendor.max_price.toLocaleString() + '원' : '-'}</td>
                        <td className="text-right">{vendor.rating_avg || '-'}</td>
                        <td className="text-right">{vendor.review_count || 0}</td>
                        <td className="text-right">{vendor.total_contract_amount ? vendor.total_contract_amount.toLocaleString() + '원' : '-'}</td>
                        <td className="text-right">{vendor.pending_payments ? vendor.pending_payments.toLocaleString() + '원' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-compare">
                비교할 제휴 업체를 선택해주세요.
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCompareModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteThreadModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowDeleteThreadModal(false)
        }}>
          <div className="modal-card">
            <h3 className="modal-title">대화 삭제</h3>
            <div style={{ padding: '20px 0' }}>
              <p style={{ fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>
                정말로 이 대화를 삭제하시겠습니까?
              </p>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                삭제된 대화는 복구할 수 없습니다.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteThreadModal(false)}>취소</button>
              <button 
                className="btn-primary" 
                onClick={deleteThread}
                style={{ background: 'linear-gradient(135deg, var(--danger), #ef4444)' }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowInviteModal(false)
        }}>
          <div className="modal-card">
            <h3 className="modal-title">참여자 초대</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>초대할 사용자 선택</label>
                <div style={{ padding: 12, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8, marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                    💡 파트너는 자동으로 초대됩니다.
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {selectedThread?.thread_type === 'one_on_one' 
                      ? '1대1 채팅이 단체톡방으로 전환됩니다.' 
                      : '선택한 사용자가 단체톡방에 추가됩니다.'}
                  </p>
                </div>
                {availableUsers.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
                    초대할 수 있는 사용자가 없습니다. (커플이 연결되어 있지 않습니다)
                  </div>
                ) : (
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, padding: 8 }}>
                    {availableUsers.map(user => (
                      <label
                        key={user.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'pointer',
                          padding: 12,
                          background: inviteForm.user_ids.includes(user.id)
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(232, 184, 184, 0.15))'
                            : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 8,
                          marginBottom: 8,
                          border: inviteForm.user_ids.includes(user.id)
                            ? '2px solid var(--accent)'
                            : '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={inviteForm.user_ids.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInviteForm(prev => ({ ...prev, user_ids: [...prev.user_ids, user.id] }))
                              } else {
                                setInviteForm(prev => ({ ...prev, user_ids: prev.user_ids.filter(id => id !== user.id) }))
                              }
                            }}
                            style={{ cursor: 'pointer', width: 20, height: 20, margin: 0, accentColor: 'var(--accent)' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 4, color: inviteForm.user_ids.includes(user.id) ? 'var(--accent)' : 'var(--text)' }}>
                            {user.nickname} ({user.gender === 'BRIDE' ? '신부' : '신랑'})
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowInviteModal(false)}>취소</button>
              <button 
                className="btn-primary" 
                onClick={inviteParticipant} 
                disabled={inviteForm.user_ids.length === 0}
              >
                초대
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
