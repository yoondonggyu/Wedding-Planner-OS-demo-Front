<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

interface Category {
  code: string
  display_name: string
}

interface Vendor {
  id: number
  vendor_type: string
  name: string
  description?: string
  base_location_city?: string
  base_location_district?: string
}

interface CompletedReservation {
  id: number
  title: string
  description?: string
  start_date?: string
  end_date?: string
  location?: string
  category?: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { request } = useApi()

// 단계 관리
const step = ref<'category' | 'vendor' | 'write'>('category')

// 카테고리 관련
const categories = ref<{ by_group: Record<string, Category[]>; all: Category[] }>({ by_group: {}, all: [] })
const categoriesLoading = ref(false)
const selectedCategory = ref<string | null>(null)

// 업체 관련
const vendors = ref<Vendor[]>([])
const vendorsLoading = ref(false)
const selectedVendor = ref<Vendor | null>(null)

// 예약 확인 관련
const completedReservations = ref<CompletedReservation[]>([])
const reservationsLoading = ref(false)
const hasValidReservation = ref(false)

// 리뷰 작성 관련
const formTitle = ref('')
const formContent = ref('')
const formSubmitting = ref(false)
const error = ref<string | null>(null)

// URL에서 카테고리 가져오기
const categoryFromUrl = computed(() => {
  const category = route.query.category as string | undefined
  return category || null
})

// 카테고리 표시명 가져오기
const categoryDisplayName = computed(() => {
  if (!selectedCategory.value) return ''
  const category = categories.value.all.find((c) => c.code === selectedCategory.value)
  return category?.display_name || selectedCategory.value.replace(/_/g, ' ')
})

// 카테고리 목록 가져오기
async function fetchCategories() {
  categoriesLoading.value = true
  try {
    const res = await request<{ message: string; data: { by_group: Record<string, Category[]>; all: Category[] } }>(
      '/categories'
    )
    if (res.message === 'get_categories_success' && res.data) {
      categories.value = res.data
      // URL에서 카테고리가 있으면 자동 선택
      if (categoryFromUrl.value) {
        selectedCategory.value = categoryFromUrl.value
        step.value = 'vendor'
        fetchVendors()
      }
    }
  } catch (err: any) {
    console.error('카테고리 로드 실패:', err)
    error.value = '카테고리를 불러오지 못했습니다.'
  } finally {
    categoriesLoading.value = false
  }
}

// 완료된 예약 확인
async function checkCompletedReservations() {
  reservationsLoading.value = true
  try {
    const res = await request<{ message: string; data: { events: CompletedReservation[] } }>(
      '/calendar/completed-reservations'
    )
    if (res.message === 'completed_reservations_retrieved' && res.data) {
      completedReservations.value = res.data.events
      hasValidReservation.value = res.data.events.length > 0
    }
  } catch (err: any) {
    console.error('예약 확인 실패:', err)
    hasValidReservation.value = false
  } finally {
    reservationsLoading.value = false
  }
}

// 카테고리 선택
function selectCategory(categoryCode: string) {
  selectedCategory.value = categoryCode
  selectedVendor.value = null
  vendors.value = []
  step.value = 'vendor'
  fetchVendors()
}

// 업체 목록 가져오기
async function fetchVendors() {
  if (!selectedCategory.value) return
  
  vendorsLoading.value = true
  try {
    const res = await request<{ message: string; data: { vendors: Vendor[] } }>(
      `/vendors?category=${encodeURIComponent(selectedCategory.value)}`
    )
    if (res.message === 'vendors_retrieved' && res.data) {
      vendors.value = res.data.vendors
    }
  } catch (err: any) {
    console.error('업체 로드 실패:', err)
    error.value = '업체를 불러오지 못했습니다.'
  } finally {
    vendorsLoading.value = false
  }
}

// 업체 선택
function selectVendor(vendor: Vendor) {
  selectedVendor.value = vendor
  formTitle.value = `${vendor.name} 후기`
  step.value = 'write'
}

// 뒤로가기
function goBack() {
  if (step.value === 'write') {
    step.value = 'vendor'
    selectedVendor.value = null
  } else if (step.value === 'vendor') {
    step.value = 'category'
    selectedCategory.value = null
    selectedVendor.value = null
    vendors.value = []
  }
}

// 리뷰 작성
async function submitReview() {
  if (!selectedCategory.value || !selectedVendor.value) {
    error.value = '카테고리와 업체를 선택해주세요.'
    return
  }
  
  if (!formTitle.value.trim() || !formContent.value.trim()) {
    error.value = '제목과 내용을 입력해주세요.'
    return
  }
  
  // 예약 완료 확인
  if (!hasValidReservation.value) {
    error.value = '예약을 완료하고 하루 이상 지난 후에만 리뷰를 작성할 수 있습니다.'
    return
  }
  
  formSubmitting.value = true
  error.value = null
  
  try {
    await request('/posts', {
      method: 'POST',
      body: {
        title: formTitle.value.trim(),
        content: formContent.value.trim(),
        board_type: 'couple',
        category: selectedCategory.value,
        vendor_id: selectedVendor.value.id,
      },
    })
    
    // 성공 시 게시판으로 이동
    router.push('/board')
  } catch (err: any) {
    console.error('리뷰 작성 실패:', err)
    error.value = err?.data?.error || err?.message || '리뷰 작성에 실패했습니다.'
  } finally {
    formSubmitting.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchCategories()
    checkCompletedReservations()
  }
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    fetchCategories()
    checkCompletedReservations()
  }
})
</script>

<template>
  <div class="review-write-view">
    <div class="page-header">
      <div class="header-content">
        <h1>✍️ 리뷰 작성</h1>
        <p>예약을 완료하고 하루 이상 지난 업체에 대한 리뷰를 작성하세요.</p>
      </div>
    </div>

    <!-- 예약 확인 상태 -->
    <div v-if="reservationsLoading" class="info-box loading">
      <p>예약 정보를 확인하는 중...</p>
    </div>
    <div v-else-if="!hasValidReservation" class="info-box warning">
      <p>⚠️ 완료된 예약이 없거나 아직 리뷰 작성 가능 시간이 되지 않았습니다.</p>
      <p>예약을 완료하고 하루 이상 지난 후에 리뷰를 작성할 수 있습니다.</p>
    </div>
    <div v-else class="info-box success">
      <p>✅ 리뷰 작성 가능한 예약이 있습니다.</p>
    </div>

    <!-- 단계별 UI -->
    <div class="steps-container">
      <!-- 단계 1: 카테고리 선택 -->
      <div v-if="step === 'category'" class="step-content">
        <h2>카테고리 선택</h2>
        <div v-if="categoriesLoading" class="loading-state">
          <p>카테고리를 불러오는 중...</p>
        </div>
        <div v-else class="category-grid">
          <button
            v-for="cat in categories.all"
            :key="cat.code"
            class="category-card"
            @click="selectCategory(cat.code)"
            :disabled="!hasValidReservation"
          >
            <div class="category-name">{{ cat.display_name }}</div>
          </button>
        </div>
      </div>

      <!-- 단계 2: 업체 선택 -->
      <div v-if="step === 'vendor'" class="step-content">
        <div class="step-header">
          <button class="btn-back" @click="goBack">← 뒤로</button>
          <h2>{{ categoryDisplayName }} 업체 선택</h2>
        </div>
        <div v-if="vendorsLoading" class="loading-state">
          <p>업체를 불러오는 중...</p>
        </div>
        <div v-else-if="vendors.length === 0" class="empty-state">
          <p>선택한 카테고리에 등록된 업체가 없습니다.</p>
        </div>
        <div v-else class="vendor-list">
          <button
            v-for="vendor in vendors"
            :key="vendor.id"
            class="vendor-card"
            @click="selectVendor(vendor)"
            :disabled="!hasValidReservation"
          >
            <div class="vendor-name">{{ vendor.name }}</div>
            <div v-if="vendor.description" class="vendor-description">{{ vendor.description }}</div>
            <div v-if="vendor.base_location_city" class="vendor-location">
              {{ vendor.base_location_city }} {{ vendor.base_location_district || '' }}
            </div>
          </button>
        </div>
      </div>

      <!-- 단계 3: 리뷰 작성 -->
      <div v-if="step === 'write'" class="step-content">
        <div class="step-header">
          <button class="btn-back" @click="goBack">← 뒤로</button>
          <h2>리뷰 작성</h2>
        </div>
        <div v-if="selectedVendor" class="selected-vendor-info">
          <p><strong>카테고리:</strong> {{ categoryDisplayName }}</p>
          <p><strong>업체:</strong> {{ selectedVendor.name }}</p>
        </div>
        <div class="review-form">
          <div class="form-group">
            <label>제목</label>
            <input
              v-model="formTitle"
              type="text"
              placeholder="리뷰 제목을 입력하세요"
              :disabled="!hasValidReservation || formSubmitting"
            />
          </div>
          <div class="form-group">
            <label>내용</label>
            <textarea
              v-model="formContent"
              placeholder="리뷰 내용을 입력하세요"
              rows="10"
              :disabled="!hasValidReservation || formSubmitting"
            ></textarea>
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="form-actions">
            <button
              class="btn-submit"
              @click="submitReview"
              :disabled="!hasValidReservation || formSubmitting || !formTitle.trim() || !formContent.trim()"
            >
              {{ formSubmitting ? '작성 중...' : '리뷰 작성' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-write-view {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg, #ffffff);
  color: var(--text, #1a1a1a);
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text, #1a1a1a);
}

.page-header p {
  font-size: 1rem;
  color: var(--muted, #6b7280);
  line-height: 1.6;
}

.info-box {
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid;
}

.info-box.loading {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #1e40af;
}

.info-box.warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #92400e;
}

.info-box.success {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #166534;
}

.info-box p {
  margin: 4px 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.steps-container {
  max-width: 800px;
  margin: 0 auto;
}

.step-content {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text, #1a1a1a);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.step-header h2 {
  margin: 0;
}

.btn-back {
  background: var(--card-bg, #f9fafb);
  border: 1px solid var(--border, #e5e7eb);
  color: var(--text, #1a1a1a);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-back:hover {
  background: var(--hover, #f3f4f6);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.category-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.category-card:hover:not(:disabled) {
  background: var(--hover, #f9fafb);
  border-color: var(--primary, #8b5cf6);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-name {
  font-weight: 500;
  color: var(--text, #1a1a1a);
  font-size: 0.95rem;
}

.vendor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vendor-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.vendor-card:hover:not(:disabled) {
  background: var(--hover, #f9fafb);
  border-color: var(--primary, #8b5cf6);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vendor-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vendor-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: var(--text, #1a1a1a);
}

.vendor-description {
  color: var(--muted, #6b7280);
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.vendor-location {
  color: var(--muted, #6b7280);
  font-size: 0.85rem;
}

.selected-vendor-info {
  background: var(--bg, #f9fafb);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid var(--border, #e5e7eb);
}

.selected-vendor-info p {
  margin: 4px 0;
  color: var(--text, #1a1a1a);
  font-size: 0.95rem;
}

.selected-vendor-info strong {
  color: var(--primary, #8b5cf6);
  font-weight: 600;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: var(--text, #1a1a1a);
  font-size: 0.95rem;
}

.form-group input,
.form-group textarea {
  background: var(--bg, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  padding: 12px;
  color: var(--text, #1a1a1a);
  font-family: inherit;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary, #8b5cf6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg, #f9fafb);
}

.error-message {
  color: #dc2626;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-submit {
  background: linear-gradient(135deg, #8b5cf6, #22d3ee);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--muted, #6b7280);
}

.loading-state p,
.empty-state p {
  font-size: 1rem;
}
</style>


