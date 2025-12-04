<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

interface WeddingProfile {
  id: number
  wedding_date: string
  guest_count_category: 'SMALL' | 'MEDIUM' | 'LARGE'
  total_budget: number
  location_city: string
  location_district: string
  style_indoor: boolean
  style_outdoor: boolean
  outdoor_rain_plan_required: boolean
}

interface Vendor {
  id: number
  vendor_type: 'IPHONE_SNAP' | 'MC' | 'SINGER' | 'STUDIO_PREWEDDING' | 'VENUE_OUTDOOR'
  name: string
  description: string | null
  base_location_city: string
  base_location_district: string
  service_area: string[] | null
  min_price: number | null
  max_price: number | null
  rating_avg: number
  review_count: number
  portfolio_images: string[] | null
  portfolio_videos: string[] | null
  contact_link: string | null
  contact_phone: string | null
  tags: string[] | null
  iphone_snap_detail: any
  mc_detail: any
  singer_detail: any
  studio_detail: any
  venue_detail: any
}

interface VendorWithScore {
  vendor: Vendor
  match_score: number
}

interface Favorite {
  id: number
  vendor_id: number
  vendor: Vendor
}

const authStore = useAuthStore()
const { request } = useApi()
const { showToast } = useToast()

// 프로필 관리
const profiles = ref<WeddingProfile[]>([])
const selectedProfileId = ref<number | null>(null)
const showProfileModal = ref(false)
const profileForm = ref({
  wedding_date: '',
  guest_count_category: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE',
  total_budget: 30000000,
  location_city: '서울시',
  location_district: '',
  style_indoor: true,
  style_outdoor: false,
  outdoor_rain_plan_required: false,
})
const editingProfileId = ref<number | null>(null)

// 업체 추천
const vendorTypes = [
  // 사진/영상
  { value: 'IPHONE_SNAP', label: '아이폰 스냅', icon: '📱' },
  { value: 'STUDIO_PREWEDDING', label: '웨딩 스튜디오', icon: '📸' },
  { value: 'WEDDING_PHOTO', label: '웨딩 사진', icon: '📷' },
  { value: 'VIDEO', label: '웨딩 영상', icon: '🎬' },
  // 웨딩홀/장소
  { value: 'WEDDING_HALL', label: '웨딩홀', icon: '🏛️' },
  { value: 'VENUE_INDOOR', label: '실내 식장', icon: '🏢' },
  { value: 'VENUE_OUTDOOR', label: '야외 식장', icon: '🏞️' },
  { value: 'VENUE_COMPLEX', label: '복합 식장', icon: '🏰' },
  // 플래너/기획
  { value: 'PLANNER', label: '웨딩 플래너', icon: '📅' },
  { value: 'COORDINATOR', label: '웨딩 코디네이터', icon: '🎯' },
  // 패션/뷰티
  { value: 'DRESS_SHOP', label: '드레스샵', icon: '👗' },
  { value: 'SUIT_SHOP', label: '턱시도샵', icon: '🤵' },
  { value: 'MAKEUP_HAIR', label: '메이크업/헤어', icon: '💄' },
  { value: 'BEAUTY_SALON', label: '뷰티 살롱', icon: '💅' },
  // 음식/케이터링
  { value: 'CATERING', label: '케이터링', icon: '🍽️' },
  { value: 'BUFFET', label: '뷔페/식당', icon: '🍴' },
  { value: 'CAKE', label: '케이크/디저트', icon: '🎂' },
  { value: 'BAR', label: '바/음료', icon: '🍷' },
  // 꽃/장식
  { value: 'FLORIST', label: '꽃/플로리스트', icon: '🌸' },
  { value: 'DECORATION', label: '장식/데코', icon: '🎨' },
  { value: 'BOUQUET', label: '부케/꽃다발', icon: '💐' },
  // 예물/주얼리
  { value: 'JEWELRY', label: '예물/주얼리', icon: '💍' },
  { value: 'RING', label: '예물/반지', icon: '💎' },
  // 교통/운송
  { value: 'WEDDING_CAR', label: '웨딩카', icon: '🚗' },
  { value: 'LIMOUSINE', label: '리무진', icon: '🚙' },
  { value: 'TRANSPORTATION', label: '교통/운송', icon: '🚌' },
  // 기타
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
const selectedVendorType = ref<string | null>(null)
const vendors = ref<VendorWithScore[]>([])
const loading = ref(false)
const showVendorDetail = ref(false)
const selectedVendor = ref<Vendor | null>(null)

// 필터
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const locationFilter = ref<string>('')
const hasRainPlan = ref<boolean | null>(null) // 우천 대안 필수 (야외 식장 전용)
const sortBy = ref<'score_desc' | 'price_asc' | 'price_desc' | 'review_desc'>('score_desc')

// 찜 & 비교
const favorites = ref<number[]>([])
const favoriteList = ref<Favorite[]>([])
const comparingVendors = ref<number[]>([]) // 비교할 업체 ID 리스트
const showFavoriteList = ref(false)
const showCompareModal = ref(false)

const selectedProfile = computed(() => {
  return profiles.value.find(p => p.id === selectedProfileId.value)
})

const filteredVendors = computed(() => {
  let result = [...vendors.value]
  
  if (minPrice.value !== null) {
    result = result.filter(v => v.vendor.max_price === null || v.vendor.max_price >= minPrice.value!)
  }
  if (maxPrice.value !== null) {
    result = result.filter(v => v.vendor.min_price === null || v.vendor.min_price <= maxPrice.value!)
  }
  if (locationFilter.value) {
    result = result.filter(v => 
      v.vendor.base_location_city.includes(locationFilter.value) ||
      v.vendor.service_area?.some(area => area.includes(locationFilter.value))
    )
  }
  
  // 우천 플랜 필터 (야외 식장만)
  if (hasRainPlan.value === true && selectedVendorType.value === 'VENUE_OUTDOOR') {
    result = result.filter(v => {
      const detail = v.vendor.venue_detail
      return detail?.has_indoor_backup === true || detail?.has_tent_option === true
    })
  }
  
  return result
})

const comparingVendorList = computed(() => {
  return vendors.value
    .filter(v => comparingVendors.value.includes(v.vendor.id))
    .map(v => v.vendor)
})

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await loadProfiles()
    await loadFavorites()
  }
})

watch(selectedProfileId, async (newId) => {
  if (newId) {
    await loadVendors()
    await loadFavorites()
  } else {
    vendors.value = []
  }
})

watch([selectedVendorType, sortBy], async () => {
  if (selectedProfileId.value) {
    await loadVendors()
  }
})

async function loadProfiles() {
  try {
    const res = await request<{ message: string; data: { profiles: WeddingProfile[] } }>(
      '/wedding-profiles',
      { method: 'GET' }
    )
    if (res.message === 'wedding_profiles_retrieved') {
      profiles.value = res.data.profiles
      if (profiles.value.length > 0 && !selectedProfileId.value) {
        selectedProfileId.value = profiles.value[0].id
      }
    }
  } catch (err) {
    console.error('프로필 로드 실패:', err)
    showToast('프로필을 불러오는데 실패했습니다.', 'error')
  }
}

async function loadVendors() {
  if (!selectedProfileId.value) return
  
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('wedding_profile_id', String(selectedProfileId.value))
    if (selectedVendorType.value) {
      params.append('vendor_type', selectedVendorType.value)
    }
    if (minPrice.value !== null) {
      params.append('min_price', String(minPrice.value))
    }
    if (maxPrice.value !== null) {
      params.append('max_price', String(maxPrice.value))
    }
    if (locationFilter.value) {
      params.append('location_city', locationFilter.value)
    }
    if (hasRainPlan.value === true && selectedVendorType.value === 'VENUE_OUTDOOR') {
      params.append('has_rain_plan', 'true')
    }
    params.append('sort', sortBy.value)
    
    const res = await request<{ message: string; data: { vendors: VendorWithScore[] } }>(
      `/vendors/recommend?${params.toString()}`,
      { method: 'GET' }
    )
    if (res.message === 'vendors_recommended') {
      vendors.value = res.data.vendors
    }
  } catch (err) {
    console.error('업체 로드 실패:', err)
    showToast('업체를 불러오는데 실패했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  if (!profileForm.value.wedding_date || !profileForm.value.location_district) {
    showToast('모든 필드를 입력해주세요.', 'error')
    return
  }
  
  try {
    if (editingProfileId.value) {
      await request(`/wedding-profiles/${editingProfileId.value}`, {
        method: 'PUT',
        body: profileForm.value,
      })
      showToast('프로필이 수정되었습니다.', 'success')
    } else {
      const res = await request<{ message: string; data: { id: number } }>(
        '/wedding-profiles',
        {
          method: 'POST',
          body: profileForm.value,
        }
      )
      if (res.message === 'wedding_profile_created') {
        showToast('프로필이 생성되었습니다.', 'success')
        selectedProfileId.value = res.data.id
      }
    }
    showProfileModal.value = false
    await loadProfiles()
  } catch (err) {
    console.error('프로필 저장 실패:', err)
    showToast('프로필 저장에 실패했습니다.', 'error')
  }
}

function openProfileModal(profile?: WeddingProfile) {
  if (profile) {
    editingProfileId.value = profile.id
    profileForm.value = {
      wedding_date: profile.wedding_date,
      guest_count_category: profile.guest_count_category,
      total_budget: profile.total_budget,
      location_city: profile.location_city,
      location_district: profile.location_district,
      style_indoor: profile.style_indoor,
      style_outdoor: profile.style_outdoor,
      outdoor_rain_plan_required: profile.outdoor_rain_plan_required,
    }
  } else {
    editingProfileId.value = null
    profileForm.value = {
      wedding_date: '',
      guest_count_category: 'MEDIUM',
      total_budget: 30000000,
      location_city: '서울시',
      location_district: '',
      style_indoor: true,
      style_outdoor: false,
      outdoor_rain_plan_required: false,
    }
  }
  showProfileModal.value = true
}

async function openVendorDetail(vendor: Vendor) {
  try {
    const res = await request<{ message: string; data: Vendor }>(
      `/vendors/${vendor.id}`,
      { method: 'GET' }
    )
    if (res.message === 'vendor_retrieved') {
      selectedVendor.value = res.data
      showVendorDetail.value = true
    }
  } catch (err) {
    console.error('업체 상세 로드 실패:', err)
    showToast('업체 정보를 불러오는데 실패했습니다.', 'error')
  }
}

async function toggleFavorite(vendorId: number) {
  if (!selectedProfileId.value) {
    showToast('프로필을 먼저 선택해주세요.', 'error')
    return
  }
  
  const isFavorite = favorites.value.includes(vendorId)
  
  try {
    if (isFavorite) {
      // 찜 삭제
      const favorite = favoriteList.value.find(f => f.vendor_id === vendorId)
      if (favorite) {
        await request(`/favorites/${favorite.id}`, { method: 'DELETE' })
        favorites.value = favorites.value.filter(id => id !== vendorId)
        favoriteList.value = favoriteList.value.filter(f => f.id !== favorite.id)
        showToast('찜 목록에서 제거되었습니다.', 'success')
      }
    } else {
      await request('/favorites', {
        method: 'POST',
        body: {
          wedding_profile_id: selectedProfileId.value,
          vendor_id: vendorId,
        },
      })
      favorites.value.push(vendorId)
      showToast('찜 목록에 추가되었습니다.', 'success')
      await loadFavorites()
    }
  } catch (err: any) {
    if (err?.data?.message === 'favorite_already_exists') {
      showToast('이미 찜 목록에 있습니다.', 'info')
    } else {
      console.error('찜 실패:', err)
      showToast('찜 처리에 실패했습니다.', 'error')
    }
  }
}

async function loadFavorites() {
  if (!selectedProfileId.value) return
  
  try {
    const res = await request<{ message: string; data: { favorites: Favorite[] } }>(
      `/favorites?wedding_profile_id=${selectedProfileId.value}`,
      { method: 'GET' }
    )
    if (res.message === 'favorites_retrieved') {
      favoriteList.value = res.data.favorites
      favorites.value = res.data.favorites.map(f => f.vendor_id)
    }
  } catch (err) {
    console.error('찜 목록 로드 실패:', err)
  }
}

function toggleCompare(vendorId: number) {
  const index = comparingVendors.value.indexOf(vendorId)
  if (index > -1) {
    comparingVendors.value.splice(index, 1)
  } else {
    if (comparingVendors.value.length >= 3) {
      showToast('최대 3개까지만 비교할 수 있습니다.', 'warning')
      return
    }
    comparingVendors.value.push(vendorId)
  }
}

function openCompareModal() {
  if (comparingVendors.value.length < 2) {
    showToast('비교할 업체를 2개 이상 선택해주세요.', 'warning')
    return
  }
  showCompareModal.value = true
}

function formatPrice(price: number | null) {
  if (price === null) return '문의'
  return `${(price / 10000).toFixed(0)}만원`
}

function getVendorTypeLabel(type: string) {
  return vendorTypes.find(vt => vt.value === type)?.label || type
}

function getRainPlanBadges(vendor: Vendor) {
  if (vendor.vendor_type !== 'VENUE_OUTDOOR' || !vendor.venue_detail) return []
  
  const badges: string[] = []
  if (vendor.venue_detail.has_indoor_backup) {
    badges.push('우천 시 실내 대체 가능')
  }
  if (vendor.venue_detail.has_tent_option) {
    badges.push('우천 시 텐트 제공')
  }
  if (vendor.venue_detail.rain_refund_policy) {
    badges.push('우천 시 환불/연기 가능')
  }
  return badges
}

function getVendorTypeDetail(vendor: Vendor) {
  switch (vendor.vendor_type) {
    case 'IPHONE_SNAP':
      return vendor.iphone_snap_detail
    case 'MC':
      return vendor.mc_detail
    case 'SINGER':
      return vendor.singer_detail
    case 'STUDIO_PREWEDDING':
      return vendor.studio_detail
    case 'VENUE_OUTDOOR':
      return vendor.venue_detail
    default:
      return null
  }
}

// 날짜 입력 포맷팅 함수들 (캘린더와 동일)
function handleDateKeydown(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement
  
  // 백스페이스, 삭제, 화살표 키 등은 허용
  if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(event.key)) {
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
  
  // YYYY-MM-DD 형식으로 자동 포맷팅
  let formatted = newValue
  if (newValue.length > 4) {
    formatted = newValue.slice(0, 4) + '-' + newValue.slice(4, 6)
  }
  if (newValue.length > 6) {
    formatted = newValue.slice(0, 4) + '-' + newValue.slice(4, 6) + '-' + newValue.slice(6, 8)
  }
  
  // 연도 4자리 입력 완료 시 자동으로 하이픈 추가하고 월 필드로 포커스 이동
  if (newValue.length === 4) {
    event.preventDefault()
    formatted = newValue + '-'
    profileForm.value.wedding_date = formatted
    nextTick(() => {
      input.value = formatted
      const position = 5 // YYYY-|MM-DD
      input.setSelectionRange(position, position)
    })
    return
  }
  
  // 월 2자리 입력 완료 시 자동으로 하이픈 추가하고 일 필드로 포커스 이동
  if (newValue.length === 6) {
    event.preventDefault()
    formatted = newValue.slice(0, 4) + '-' + newValue.slice(4, 6) + '-'
    profileForm.value.wedding_date = formatted
    nextTick(() => {
      input.value = formatted
      const position = formatted.length // YYYY-MM-|DD
      input.setSelectionRange(position, position)
    })
    return
  }
  
  // 일반 입력 시 포맷팅만 적용
  event.preventDefault()
  formatted = formatDateValue(newValue)
  profileForm.value.wedding_date = formatted
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

function handleDateInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // 이미 올바른 형식이면 그대로 사용
  if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    profileForm.value.wedding_date = value
    return
  }
  
  // 숫자만 추출하여 포맷팅
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const formatted = formatDateValue(digits)
  profileForm.value.wedding_date = formatted
  
  nextTick(() => {
    if (input.value !== formatted) {
      input.value = formatted
    }
  })
}

function handleDatePaste(event: ClipboardEvent) {
  event.preventDefault()
  const input = event.target as HTMLInputElement
  const pastedText = event.clipboardData?.getData('text') || ''
  const digits = pastedText.replace(/\D/g, '').slice(0, 8)
  const formatted = formatDateValue(digits)
  
  profileForm.value.wedding_date = formatted
  
  nextTick(() => {
    input.value = formatted
    input.setSelectionRange(formatted.length, formatted.length)
  })
}
</script>

<template>
  <section class="section" id="vendor">
    <div class="container">
      <div class="page-title">
        <h1>💍 업체 추천</h1>
        <p>결혼식 프로필에 맞는 업체를 추천받아보세요</p>
      </div>

      <!-- 프로필 선택/생성 -->
      <div class="card profile-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
          <h2 style="margin: 0">결혼식 프로필</h2>
          <div style="display: flex; gap: 8px">
            <button class="btn" type="button" @click="showFavoriteList = true" :disabled="!selectedProfileId">
              찜 목록 ({{ favorites.length }})
            </button>
            <button class="btn primary" type="button" @click="openProfileModal()">프로필 생성</button>
          </div>
        </div>
        
        <div v-if="profiles.length === 0" style="text-align: center; padding: 40px; color: var(--muted)">
          프로필이 없습니다. 프로필을 생성해주세요.
        </div>
        
        <div v-else style="display: flex; gap: 12px; flex-wrap: wrap">
          <button
            v-for="profile in profiles"
            :key="profile.id"
            class="btn"
            :class="{ primary: selectedProfileId === profile.id }"
            type="button"
            @click="selectedProfileId = profile.id"
          >
            {{ profile.wedding_date }} · {{ profile.location_city }} {{ profile.location_district }}
          </button>
        </div>
        
        <div v-if="selectedProfile" style="margin-top: 16px; padding: 16px; background: var(--soft); border-radius: 8px">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <div>
              <div style="font-weight: 600; margin-bottom: 8px">
                예식일: {{ selectedProfile.wedding_date }}
              </div>
              <div style="font-size: 14px; color: var(--muted)">
                규모: {{ selectedProfile.guest_count_category === 'SMALL' ? '소규모' : selectedProfile.guest_count_category === 'MEDIUM' ? '중규모' : '대규모' }} · 
                예산: {{ (selectedProfile.total_budget / 10000).toFixed(0) }}만원 · 
                지역: {{ selectedProfile.location_city }} {{ selectedProfile.location_district }}
              </div>
              <div v-if="selectedProfile.style_outdoor && selectedProfile.outdoor_rain_plan_required" 
                   style="margin-top: 8px; padding: 6px 12px; background: var(--accent); color: white; border-radius: 6px; font-size: 12px; display: inline-block">
                🌧️ 우천 대안 필수
              </div>
            </div>
            <button class="btn" type="button" @click="openProfileModal(selectedProfile)">수정</button>
          </div>
        </div>
      </div>

      <!-- 업체 추천 -->
      <div v-if="selectedProfileId" class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
          <h2 style="margin: 0">업체 추천</h2>
          <button 
            v-if="comparingVendors.length > 0" 
            class="btn primary" 
            type="button" 
            @click="openCompareModal"
          >
            비교하기 ({{ comparingVendors.length }})
          </button>
        </div>

        <!-- 카테고리 탭 -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap">
          <button
            class="btn"
            :class="{ primary: selectedVendorType === null }"
            type="button"
            @click="selectedVendorType = null"
          >
            전체
          </button>
          <button
            v-for="vt in vendorTypes"
            :key="vt.value"
            class="btn"
            :class="{ primary: selectedVendorType === vt.value }"
            type="button"
            @click="selectedVendorType = vt.value"
          >
            {{ vt.icon }} {{ vt.label }}
          </button>
        </div>

        <!-- 필터 -->
        <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center">
          <div style="display: flex; gap: 8px; align-items: center">
            <label style="font-size: 14px">가격:</label>
            <input
              v-model.number="minPrice"
              type="number"
              placeholder="최소"
              style="width: 100px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--input-background); color: var(--text)"
            />
            <span>~</span>
            <input
              v-model.number="maxPrice"
              type="number"
              placeholder="최대"
              style="width: 100px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--input-background); color: var(--text)"
            />
            <span style="font-size: 12px; color: var(--muted)">만원</span>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center">
            <label style="font-size: 14px">지역:</label>
            <input
              v-model="locationFilter"
              type="text"
              placeholder="지역 검색"
              style="width: 150px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--input-background); color: var(--text)"
            />
          </div>
          
          <div v-if="selectedVendorType === 'VENUE_OUTDOOR' && selectedProfile?.style_outdoor" 
               style="display: flex; gap: 8px; align-items: center">
            <label style="font-size: 14px; cursor: pointer">
              <input 
                v-model="hasRainPlan" 
                type="checkbox" 
                :true-value="true"
                :false-value="null"
                style="margin-right: 6px"
              />
              우천 대안 필수
            </label>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; margin-left: auto">
            <label style="font-size: 14px">정렬:</label>
            <select
              v-model="sortBy"
              style="padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--input-background); color: var(--text)"
            >
              <option value="score_desc">매칭 점수 높은 순</option>
              <option value="price_asc">가격 낮은 순</option>
              <option value="price_desc">가격 높은 순</option>
              <option value="review_desc">리뷰 많은 순</option>
            </select>
          </div>
        </div>

        <!-- 업체 리스트 -->
        <div v-if="loading" style="text-align: center; padding: 40px">
          로딩 중...
        </div>
        
        <div v-else-if="filteredVendors.length === 0" style="text-align: center; padding: 40px; color: var(--muted)">
          추천 업체가 없습니다.
        </div>
        
        <div v-else class="vendor-grid">
          <div
            v-for="item in filteredVendors"
            :key="item.vendor.id"
            class="vendor-card"
            :class="{ 'comparing': comparingVendors.includes(item.vendor.id) }"
          >
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px">
              <div style="flex: 1">
                <h3 style="margin: 0 0 8px 0; font-size: 18px">{{ item.vendor.name }}</h3>
                <div style="font-size: 13px; color: var(--muted); margin-bottom: 8px">
                  {{ getVendorTypeLabel(item.vendor.vendor_type) }}
                </div>
              </div>
              <div style="display: flex; gap: 8px">
                <button
                  class="compare-btn"
                  :class="{ active: comparingVendors.includes(item.vendor.id) }"
                  type="button"
                  @click.stop="toggleCompare(item.vendor.id)"
                  :title="comparingVendors.includes(item.vendor.id) ? '비교에서 제거' : '비교에 추가'"
                >
                  {{ comparingVendors.includes(item.vendor.id) ? '✓' : '⚖️' }}
                </button>
                <button
                  class="favorite-btn"
                  :class="{ active: favorites.includes(item.vendor.id) }"
                  type="button"
                  @click.stop="toggleFavorite(item.vendor.id)"
                >
                  {{ favorites.includes(item.vendor.id) ? '❤️' : '🤍' }}
                </button>
              </div>
            </div>
            
            <!-- 포트폴리오 이미지 -->
            <div v-if="item.vendor.portfolio_images && item.vendor.portfolio_images.length > 0" 
                 style="margin-bottom: 12px; border-radius: 8px; overflow: hidden; max-height: 150px">
              <img 
                :src="item.vendor.portfolio_images[0]" 
                :alt="item.vendor.name"
                style="width: 100%; height: 150px; object-fit: cover"
              />
            </div>
            
            <div style="font-size: 14px; color: var(--text); margin-bottom: 12px; line-height: 1.5; max-height: 60px; overflow: hidden">
              {{ item.vendor.description || '설명 없음' }}
            </div>
            
            <!-- 우천 플랜 뱃지 (야외 식장만) -->
            <div v-if="item.vendor.vendor_type === 'VENUE_OUTDOOR' && getRainPlanBadges(item.vendor).length > 0" 
                 style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px">
              <span 
                v-for="badge in getRainPlanBadges(item.vendor)" 
                :key="badge"
                style="padding: 4px 8px; background: var(--accent); color: white; border-radius: 4px; font-size: 11px"
              >
                {{ badge }}
              </span>
            </div>
            
            <div style="display: flex; gap: 16px; font-size: 13px; color: var(--muted); margin-bottom: 12px">
              <div>📍 {{ item.vendor.base_location_city }} {{ item.vendor.base_location_district }}</div>
              <div>💰 {{ formatPrice(item.vendor.min_price) }} ~ {{ formatPrice(item.vendor.max_price) }}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div style="display: flex; gap: 8px; align-items: center">
                <span style="font-size: 14px; font-weight: 600">⭐ {{ item.vendor.rating_avg.toFixed(1) }}</span>
                <span style="font-size: 12px; color: var(--muted)">({{ item.vendor.review_count }})</span>
              </div>
              <div style="font-size: 12px; color: var(--accent); font-weight: 600">
                매칭 {{ item.match_score }}점
              </div>
            </div>
            
            <button class="btn primary" style="width: 100%; margin-top: 12px" @click.stop="openVendorDetail(item.vendor)">
              상세보기
            </button>
          </div>
        </div>
      </div>

      <div v-else class="card" style="text-align: center; padding: 40px; color: var(--muted)">
        프로필을 선택하거나 생성해주세요.
      </div>
    </div>

    <!-- 프로필 모달 -->
    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="modal-card">
        <h3 style="margin-top: 0">{{ editingProfileId ? '프로필 수정' : '프로필 생성' }}</h3>
        
        <div class="form-group">
          <label>예식일</label>
          <div class="input-with-icon">
            <input
              :value="profileForm.wedding_date"
              type="text"
              placeholder="YYYY-MM-DD"
              maxlength="10"
              required
              @keydown="handleDateKeydown"
              @input="handleDateInput"
              @paste="handleDatePaste"
            />
            <span class="input-icon">📅</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>규모</label>
          <select v-model="profileForm.guest_count_category">
            <option value="SMALL">소규모 (50명 미만)</option>
            <option value="MEDIUM">중규모 (50~150명)</option>
            <option value="LARGE">대규모 (150명 이상)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>전체 예산 (원)</label>
          <input v-model.number="profileForm.total_budget" type="number" required />
        </div>
        
        <div class="form-group">
          <label>시/도</label>
          <input v-model="profileForm.location_city" type="text" required />
        </div>
        
        <div class="form-group">
          <label>구/군</label>
          <input v-model="profileForm.location_district" type="text" required />
        </div>
        
        <div class="form-group">
          <label>
            <input v-model="profileForm.style_indoor" type="checkbox" />
            실내 결혼식
          </label>
        </div>
        
        <div class="form-group">
          <label>
            <input v-model="profileForm.style_outdoor" type="checkbox" />
            야외 결혼식
          </label>
        </div>
        
        <div v-if="profileForm.style_outdoor" class="form-group">
          <label>
            <input v-model="profileForm.outdoor_rain_plan_required" type="checkbox" />
            우천 시 대안 필수
          </label>
        </div>
        
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px">
          <button class="btn" type="button" @click="showProfileModal = false">취소</button>
          <button class="btn primary" type="button" @click="saveProfile">저장</button>
        </div>
      </div>
    </div>

    <!-- 업체 상세 모달 -->
    <div v-if="showVendorDetail && selectedVendor" class="modal-overlay" @click.self="showVendorDetail = false">
      <div class="modal-card vendor-detail-modal" style="max-width: 900px; max-height: 90vh; overflow-y: auto">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px">
          <div>
            <h2 style="margin: 0 0 8px 0">{{ selectedVendor.name }}</h2>
            <div style="font-size: 14px; color: var(--muted); margin-bottom: 12px">
              {{ getVendorTypeLabel(selectedVendor.vendor_type) }}
            </div>
          </div>
          <button class="btn" type="button" @click="showVendorDetail = false" style="padding: 8px 12px">✕</button>
        </div>
        
        <!-- 포트폴리오 -->
        <div v-if="selectedVendor.portfolio_images && selectedVendor.portfolio_images.length > 0" 
             style="margin-bottom: 20px">
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px">
            <img 
              v-for="(img, idx) in selectedVendor.portfolio_images" 
              :key="idx"
              :src="img" 
              :alt="`포트폴리오 ${idx + 1}`"
              style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer"
              @click="window.open(img, '_blank')"
            />
          </div>
        </div>
        
        <div style="margin-bottom: 20px; line-height: 1.6">{{ selectedVendor.description }}</div>
        
        <!-- 기본 정보 -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px">
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px">위치</div>
            <div>{{ selectedVendor.base_location_city }} {{ selectedVendor.base_location_district }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px">서비스 지역</div>
            <div>{{ selectedVendor.service_area?.join(', ') || '전국' }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px">가격</div>
            <div>{{ formatPrice(selectedVendor.min_price) }} ~ {{ formatPrice(selectedVendor.max_price) }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px">평점</div>
            <div>⭐ {{ selectedVendor.rating_avg.toFixed(1) }} ({{ selectedVendor.review_count }}개 리뷰)</div>
          </div>
        </div>
        
        <!-- 타입별 상세 정보 -->
        <div v-if="getVendorTypeDetail(selectedVendor)" style="margin-bottom: 20px; padding: 16px; background: var(--soft); border-radius: 8px">
          <h4 style="margin: 0 0 12px 0; font-size: 16px">상세 정보</h4>
          <div style="display: grid; gap: 8px; font-size: 14px">
            <div v-for="(value, key) in getVendorTypeDetail(selectedVendor)" :key="key">
              <strong>{{ key }}:</strong> 
              <span v-if="typeof value === 'boolean'">{{ value ? '예' : '아니오' }}</span>
              <span v-else-if="Array.isArray(value)">{{ value.join(', ') }}</span>
              <span v-else>{{ value }}</span>
            </div>
          </div>
        </div>
        
        <!-- 우천 플랜 뱃지 (야외 식장만) -->
        <div v-if="selectedVendor.vendor_type === 'VENUE_OUTDOOR' && getRainPlanBadges(selectedVendor).length > 0" 
             style="margin-bottom: 20px">
          <h4 style="margin: 0 0 12px 0; font-size: 16px">우천 대안</h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <span 
              v-for="badge in getRainPlanBadges(selectedVendor)" 
              :key="badge"
              style="padding: 8px 12px; background: var(--accent); color: white; border-radius: 6px; font-size: 13px"
            >
              {{ badge }}
            </span>
          </div>
        </div>
        
        <!-- 연락처 -->
        <div style="display: flex; gap: 8px; margin-top: 20px">
          <a 
            v-if="selectedVendor.contact_link" 
            :href="selectedVendor.contact_link" 
            target="_blank" 
            class="btn primary"
          >
            문의하기
          </a>
          <a 
            v-if="selectedVendor.contact_phone" 
            :href="`tel:${selectedVendor.contact_phone}`" 
            class="btn"
          >
            전화: {{ selectedVendor.contact_phone }}
          </a>
        </div>
      </div>
    </div>

    <!-- 찜 목록 모달 -->
    <div v-if="showFavoriteList" class="modal-overlay" @click.self="showFavoriteList = false">
      <div class="modal-card" style="max-width: 800px; max-height: 90vh; overflow-y: auto">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
          <h2 style="margin: 0">찜 목록</h2>
          <button class="btn" type="button" @click="showFavoriteList = false">✕</button>
        </div>
        
        <div v-if="favoriteList.length === 0" style="text-align: center; padding: 40px; color: var(--muted)">
          찜한 업체가 없습니다.
        </div>
        
        <div v-else class="vendor-grid">
          <div
            v-for="favorite in favoriteList"
            :key="favorite.id"
            class="vendor-card"
            @click="openVendorDetail(favorite.vendor)"
          >
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px">
              <div>
                <h3 style="margin: 0 0 8px 0; font-size: 18px">{{ favorite.vendor.name }}</h3>
                <div style="font-size: 13px; color: var(--muted)">
                  {{ getVendorTypeLabel(favorite.vendor.vendor_type) }}
                </div>
              </div>
              <button
                class="favorite-btn active"
                type="button"
                @click.stop="toggleFavorite(favorite.vendor_id)"
              >
                ❤️
              </button>
            </div>
            
            <div style="font-size: 14px; color: var(--text); margin-bottom: 12px">
              {{ favorite.vendor.description || '설명 없음' }}
            </div>
            
            <div style="display: flex; gap: 16px; font-size: 13px; color: var(--muted); margin-bottom: 12px">
              <div>📍 {{ favorite.vendor.base_location_city }}</div>
              <div>💰 {{ formatPrice(favorite.vendor.min_price) }} ~ {{ formatPrice(favorite.vendor.max_price) }}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div>⭐ {{ favorite.vendor.rating_avg.toFixed(1) }} ({{ favorite.vendor.review_count }})</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 비교 모달 -->
    <div v-if="showCompareModal" class="modal-overlay" @click.self="showCompareModal = false">
      <div class="modal-card" style="max-width: 1200px; max-height: 90vh; overflow-y: auto">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
          <h2 style="margin: 0">업체 비교</h2>
          <button class="btn" type="button" @click="showCompareModal = false">✕</button>
        </div>
        
        <div style="overflow-x: auto">
          <table class="compare-table">
            <thead>
              <tr>
                <th>항목</th>
                <th v-for="vendor in comparingVendorList" :key="vendor.id">
                  {{ vendor.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>타입</strong></td>
                <td v-for="vendor in comparingVendorList" :key="vendor.id">
                  {{ getVendorTypeLabel(vendor.vendor_type) }}
                </td>
              </tr>
              <tr>
                <td><strong>위치</strong></td>
                <td v-for="vendor in comparingVendorList" :key="vendor.id">
                  {{ vendor.base_location_city }} {{ vendor.base_location_district }}
                </td>
              </tr>
              <tr>
                <td><strong>가격</strong></td>
                <td v-for="vendor in comparingVendorList" :key="vendor.id">
                  {{ formatPrice(vendor.min_price) }} ~ {{ formatPrice(vendor.max_price) }}
                </td>
              </tr>
              <tr>
                <td><strong>평점</strong></td>
                <td v-for="vendor in comparingVendorList" :key="vendor.id">
                  ⭐ {{ vendor.rating_avg.toFixed(1) }} ({{ vendor.review_count }}개)
                </td>
              </tr>
              <tr v-if="comparingVendorList.some(v => v.vendor_type === 'VENUE_OUTDOOR')">
                <td><strong>우천 대안</strong></td>
                <td v-for="vendor in comparingVendorList" :key="vendor.id">
                  <div v-if="vendor.vendor_type === 'VENUE_OUTDOOR'">
                    <div v-for="badge in getRainPlanBadges(vendor)" :key="badge" style="font-size: 11px; margin: 2px 0">
                      • {{ badge }}
                    </div>
                    <div v-if="getRainPlanBadges(vendor).length === 0" style="color: var(--muted)">없음</div>
                  </div>
                  <div v-else style="color: var(--muted)">해당 없음</div>
                </td>
              </tr>
              <tr>
                <td><strong>설명</strong></td>
                <td v-for="vendor in comparingVendorList" :key="vendor.id" style="max-width: 200px">
                  {{ vendor.description || '설명 없음' }}
                </td>
              </tr>
              <tr>
                <td><strong>문의</strong></td>
                <td v-for="vendor in comparingVendorList" :key="vendor.id">
                  <a v-if="vendor.contact_link" :href="vendor.contact_link" target="_blank" class="btn primary" style="font-size: 12px; padding: 6px 12px">
                    문의하기
                  </a>
                  <span v-else style="color: var(--muted)">문의 불가</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
}

.page-title h1 {
  font-size: 2.5em;
  color: var(--text);
  margin-bottom: 10px;
}

.page-title p {
  font-size: 1.1em;
  color: var(--muted);
}

.card {
  background: var(--background-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--shadow);
  margin-bottom: 20px;
}

[data-theme='dark'] .card {
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

[data-theme='light'] .card {
  background: var(--card);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-section {
  margin-bottom: 30px;
}

.vendor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.vendor-card {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

[data-theme='dark'] .vendor-card {
  background: rgba(35, 35, 45, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

[data-theme='light'] .vendor-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.vendor-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

[data-theme='dark'] .vendor-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(201, 154, 106, 0.3);
  background: rgba(40, 40, 50, 0.9);
}

[data-theme='dark'] .vendor-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(201, 154, 106, 0.3);
  background: rgba(40, 40, 50, 0.9);
}

[data-theme='light'] .vendor-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vendor-card.comparing {
  border-color: var(--accent);
  border-width: 2px;
  background: var(--soft);
}

[data-theme='dark'] .vendor-card.comparing {
  background: rgba(50, 45, 60, 0.8);
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(201, 154, 106, 0.3);
}

.favorite-btn, .compare-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  transition: transform 0.2s;
  border-radius: 4px;
}

.favorite-btn:hover, .compare-btn:hover {
  transform: scale(1.2);
  background: var(--soft);
}

.compare-btn.active {
  background: var(--accent);
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: var(--background-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  color: var(--text);
}

[data-theme='dark'] .modal-card {
  background: rgba(25, 25, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

[data-theme='light'] .modal-card {
  background: var(--card);
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.vendor-detail-modal {
  max-width: 900px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text);
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group input[type='date'],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-background);
  color: var(--text);
  font-size: 1em;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input[type='text']:focus,
.form-group input[type='number']:focus,
.form-group select:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 139, 92, 246), 0.1);
}

[data-theme='dark'] .form-group input[type='text'],
[data-theme='dark'] .form-group input[type='number'],
[data-theme='dark'] .form-group input[type='date'],
[data-theme='dark'] .form-group select {
  background: rgba(40, 40, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text);
}

[data-theme='dark'] .form-group input[type='text']:focus,
[data-theme='dark'] .form-group input[type='number']:focus,
[data-theme='dark'] .form-group select:focus {
  border-color: var(--accent);
  background: rgba(50, 50, 60, 0.9);
  box-shadow: 0 0 0 3px rgba(201, 154, 106, 0.2);
}

[data-theme='light'] .form-group input[type='text'],
[data-theme='light'] .form-group input[type='number'],
[data-theme='light'] .form-group input[type='date'],
[data-theme='light'] .form-group select {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: var(--text);
}

[data-theme='light'] .form-group input[type='text']:focus,
[data-theme='light'] .form-group input[type='number']:focus,
[data-theme='light'] .form-group select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(201, 154, 106, 0.15);
}

.form-group input[type='checkbox'] {
  margin-right: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn.primary {
  background: var(--accent);
  color: white;
}

.btn.primary:hover {
  background: var(--accent-2);
}

.btn:not(.primary) {
  background: var(--button-background);
  color: var(--button-text);
  border: 1px solid var(--button-border);
}

.btn:not(.primary):hover {
  background: var(--button-hover-background);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon input {
  padding-right: 40px; /* 아이콘 공간 확보 */
}

.input-icon {
  position: absolute;
  right: 12px;
  color: var(--muted);
  pointer-events: none; /* 아이콘 클릭 방지 */
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.compare-table th,
.compare-table td {
  padding: 12px;
  text-align: left;
  border: 1px solid var(--border);
}

.compare-table th {
  background: var(--soft);
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 1;
}

[data-theme='dark'] .compare-table th {
  background: rgba(40, 40, 50, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.compare-table td {
  background: var(--background);
}

[data-theme='dark'] .compare-table td {
  background: rgba(30, 30, 40, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.compare-table tr:hover td {
  background: var(--soft);
}

[data-theme='dark'] .compare-table tr:hover td {
  background: rgba(50, 50, 60, 0.8);
}

.profile-summary {
  margin-top: 16px;
  padding: 16px;
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 8px;
}

[data-theme='dark'] .profile-summary {
  background: rgba(40, 40, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

[data-theme='light'] .profile-summary {
  background: var(--soft);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .btn:not(.primary) {
  background: rgba(50, 50, 60, 0.8);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme='dark'] .btn:not(.primary):hover {
  background: rgba(60, 60, 70, 0.9);
  border-color: var(--accent);
}

[data-theme='dark'] .btn.primary {
  background: var(--accent);
  color: #ffffff;
  border: none;
  box-shadow: 0 2px 8px rgba(201, 154, 106, 0.3);
}

[data-theme='dark'] .btn.primary:hover {
  background: var(--accent-2);
  box-shadow: 0 4px 12px rgba(201, 154, 106, 0.4);
}

[data-theme='light'] .demo-inner-box {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

[data-theme='light'] .btn:not(.primary) {
  background: #ffffff;
  color: var(--text);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

[data-theme='light'] .btn:not(.primary):hover {
  background: var(--soft);
  border-color: var(--accent);
}

[data-theme='light'] .btn.primary {
  background: var(--accent);
  color: #ffffff;
  border: none;
}

[data-theme='light'] .btn.primary:hover {
  background: var(--accent-2);
}

/* 모바일 스타일 */
@media (max-width: 768px) {
  .section {
    padding: 16px 8px;
  }

  .container {
    padding: 0 12px;
  }

  .page-title h1 {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .page-title p {
    font-size: 12px;
  }

  .card {
    padding: 16px;
    margin-bottom: 16px;
  }

  .profile-section > div[style*="display: flex"] {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .profile-section > div[style*="display: flex"] > div[style*="display: flex"] {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .profile-section > div[style*="display: flex"] > div[style*="display: flex"] > button {
    width: 100%;
  }

  .profile-section > div[style*="display: flex"][style*="flex-wrap"] {
    flex-direction: column;
  }

  .profile-section > div[style*="display: flex"][style*="flex-wrap"] > button {
    width: 100%;
  }

  .card > div[style*="display: flex"][style*="justify-content: space-between"] {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .card > div[style*="display: flex"][style*="justify-content: space-between"] > button {
    width: 100%;
  }

  .card > div[style*="display: flex"][style*="gap: 8px"][style*="flex-wrap"] {
    flex-direction: column;
  }

  .card > div[style*="display: flex"][style*="gap: 8px"][style*="flex-wrap"] > button {
    width: 100%;
    font-size: 13px;
    padding: 10px;
  }

  .card > div[style*="display: flex"][style*="gap: 12px"][style*="flex-wrap"] {
    flex-direction: column;
    gap: 8px;
  }

  .card > div[style*="display: flex"][style*="gap: 12px"][style*="flex-wrap"] > div {
    width: 100%;
  }

  .card > div[style*="display: flex"][style*="gap: 12px"][style*="flex-wrap"] > div > input,
  .card > div[style*="display: flex"][style*="gap: 12px"][style*="flex-wrap"] > div > select {
    width: 100%;
  }

  .vendor-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .vendor-card {
    padding: 16px;
  }

  .vendor-card h3 {
    font-size: 16px;
  }

  .vendor-card > div[style*="display: flex"][style*="justify-content: space-between"] {
    flex-direction: column;
    gap: 8px;
  }

  .vendor-card > div[style*="display: flex"][style*="justify-content: space-between"] > div[style*="display: flex"] {
    width: 100%;
    justify-content: flex-end;
  }

  .vendor-card > div[style*="display: flex"][style*="gap: 16px"] {
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
  }

  .vendor-card > div[style*="display: flex"][style*="justify-content: space-between"][style*="align-items: center"] {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .vendor-card button {
    width: 100%;
    margin-top: 8px;
  }

  .modal-card {
    padding: 20px 16px;
    width: 95%;
    max-width: none;
  }

  .modal-card h3 {
    font-size: 18px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .form-group input,
  .form-group select {
    padding: 8px 10px;
    font-size: 14px;
  }

  .vendor-detail-modal {
    padding: 16px;
  }

  .vendor-detail-modal > div[style*="display: flex"][style*="justify-content: space-between"] {
    flex-direction: column;
    gap: 12px;
  }

  .vendor-detail-modal > div[style*="display: grid"][style*="grid-template-columns"] {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .vendor-detail-modal > div[style*="display: flex"][style*="gap: 8px"] {
    flex-direction: column;
    width: 100%;
  }

  .vendor-detail-modal > div[style*="display: flex"][style*="gap: 8px"] > a,
  .vendor-detail-modal > div[style*="display: flex"][style*="gap: 8px"] > button {
    width: 100%;
  }

  .compare-table {
    font-size: 11px;
  }

  .compare-table th,
  .compare-table td {
    padding: 8px 6px;
    font-size: 11px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .vendor-card {
    padding: 12px;
  }

  .vendor-card h3 {
    font-size: 14px;
  }

  .compare-table {
    font-size: 10px;
  }

  .compare-table th,
  .compare-table td {
    padding: 6px 4px;
    font-size: 10px;
  }
}
</style>
