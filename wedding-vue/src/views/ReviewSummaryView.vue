<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

interface ReviewSummary {
  summary: string
  sentiment_analysis: {
    positive_count: number
    negative_count: number
    overall_sentiment: 'positive' | 'negative' | 'neutral'
    positive_percentage: number
    negative_percentage: number
  }
  review_count: number
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { request } = useApi()

const loading = ref(false)
const summary = ref<ReviewSummary | null>(null)
const error = ref<string | null>(null)

// board_type은 'couple'로 고정 (게시판 타입)
const boardType = 'couple'

// URL 쿼리 파라미터에서 카테고리 가져오기
const selectedCategory = computed(() => {
  const category = route.query.category as string | undefined
  return category || null
})

// 카테고리 표시명 가져오기
const categoryDisplayName = computed(() => {
  if (!selectedCategory.value) return '전체'
  
  // 카테고리 코드를 표시명으로 변환
  const categoryMap: Record<string, string> = {
    '아이폰_스냅': '아이폰 스냅',
    '웨딩_스튜디오': '웨딩 스튜디오',
    '웨딩_사진': '웨딩 사진',
    '웨딩_영상': '웨딩 영상',
    '웨딩홀': '웨딩홀',
    '실내_식장': '실내 식장',
    '야외_식장': '야외 식장',
    '복합_식장': '복합 식장',
    '웨딩_플래너': '웨딩 플래너',
    '웨딩_코디네이터': '웨딩 코디네이터',
    '드레스샵': '드레스샵',
    '턱시도샵': '턱시도샵',
    '메이크업_헤어': '메이크업/헤어',
    '뷰티_살롱': '뷰티 살롱',
    '한복': '한복',
    '케이터링': '케이터링',
    '뷔페_식당': '뷔페/식당',
    '케이크_디저트': '케이크/디저트',
    '바_음료': '바/음료',
    '꽃_플로리스트': '꽃/플로리스트',
    '장식_데코': '장식/데코',
    '부케_꽃다발': '부케/꽃다발',
    '예물_주얼리': '예물/주얼리',
    '예물_반지': '예물/반지',
    '웨딩카': '웨딩카',
    '리무진': '리무진',
    '교통_운송': '교통/운송',
    '사회자': '사회자',
    '축가': '축가',
    '밴드_연주자': '밴드/연주자',
    '축가_연주': '축가/연주',
    '청첩장_인쇄': '청첩장/인쇄',
    '웨딩선물_답례품': '웨딩선물/답례품',
    '호텔_숙박': '호텔/숙박',
    '웨딩박람회': '웨딩박람회',
    '신혼여행': '신혼여행',
  }
  
  return categoryMap[selectedCategory.value] || selectedCategory.value.replace(/_/g, ' ')
})

async function fetchReviewSummary() {
  loading.value = true
  error.value = null
  
  try {
    let url = `/posts/reviews/summarize?board_type=${boardType}&limit=100`
    if (selectedCategory.value) {
      url += `&category=${encodeURIComponent(selectedCategory.value)}`
    }
    
    const res = await request<{ message: string; data: ReviewSummary }>(
      url,
      {
        method: 'POST'
      }
    )
    
    if (res.message === 'review_summary_success' && res.data) {
      summary.value = res.data
    } else {
      error.value = '리뷰 요약을 불러오지 못했습니다.'
    }
  } catch (err: any) {
    console.error('리뷰 요약 로드 실패:', err)
    const errorMessage = err?.response?.data?.detail || err?.data?.detail || err?.data?.error || err?.message || '리뷰 요약을 불러오지 못했습니다.'
    error.value = `API 요청 실패: ${errorMessage}`
  } finally {
    loading.value = false
  }
}

function refreshSummary() {
  fetchReviewSummary()
}

function goToWriteReview() {
  const categoryParam = selectedCategory.value ? `?category=${encodeURIComponent(selectedCategory.value)}` : ''
  router.push(`/review-write${categoryParam}`)
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchReviewSummary()
  }
})

// 카테고리 변경 시 자동으로 다시 로드
watch(() => route.query.category, () => {
  if (authStore.isAuthenticated) {
    fetchReviewSummary()
  }
})
</script>

<template>
  <div class="review-summary-view">
    <div class="page-header">
      <div class="header-content">
        <h1>📊 리뷰 요약</h1>
        <p v-if="selectedCategory">
          <strong>{{ categoryDisplayName }}</strong> 카테고리의 리뷰를 AI로 분석하고 요약합니다.
        </p>
        <p v-else>
          게시판의 모든 리뷰를 AI로 분석하고 요약합니다.
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-write" @click="goToWriteReview">
          ✍️ 리뷰 작성
        </button>
        <button class="btn-refresh" @click="refreshSummary" :disabled="loading">
          <span>🔄</span>
          <span>새로고침</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>리뷰를 분석하고 요약하는 중...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button class="btn-retry" @click="fetchReviewSummary">다시 시도</button>
    </div>

    <div v-else-if="!summary || summary.review_count === 0" class="empty-state">
      <p>📝 리뷰가 없습니다.</p>
      <p>첫 번째 리뷰를 작성해보세요!</p>
      <button class="btn-write-primary" @click="goToWriteReview">
        ✍️ 리뷰 작성하기
      </button>
    </div>

    <div v-else class="summary-content">
      <!-- 전체 요약 -->
      <div class="summary-card">
        <h2>📝 전체 요약</h2>
        <div class="summary-text">
          {{ summary.summary }}
        </div>
      </div>

      <!-- 감성 분석 -->
      <div class="sentiment-card">
        <h2>💭 감성 분석</h2>
        <div class="sentiment-stats">
          <div class="stat-item positive">
            <div class="stat-label">긍정</div>
            <div class="stat-value">{{ summary.sentiment_analysis.positive_count }}개</div>
            <div class="stat-percentage">{{ summary.sentiment_analysis.positive_percentage.toFixed(1) }}%</div>
          </div>
          <div class="stat-item negative">
            <div class="stat-label">부정</div>
            <div class="stat-value">{{ summary.sentiment_analysis.negative_count }}개</div>
            <div class="stat-percentage">{{ summary.sentiment_analysis.negative_percentage.toFixed(1) }}%</div>
          </div>
        </div>
        <div class="overall-sentiment">
          <span class="sentiment-badge" :class="summary.sentiment_analysis.overall_sentiment">
            {{ summary.sentiment_analysis.overall_sentiment === 'positive' ? '긍정적' : 
               summary.sentiment_analysis.overall_sentiment === 'negative' ? '부정적' : '중립적' }}
          </span>
        </div>
      </div>

      <!-- 리뷰 개수 -->
      <div class="review-count-card">
        <p>총 <strong>{{ summary.review_count }}</strong>개의 리뷰가 분석되었습니다.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-summary-view {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg, #ffffff);
  color: var(--text, #1a1a1a);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid var(--border, #e5e7eb);
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text, #1a1a1a);
}

.header-content p {
  font-size: 1rem;
  color: var(--muted, #6b7280);
  line-height: 1.6;
}

.header-content p strong {
  color: var(--primary, #8b5cf6);
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-write {
  background: linear-gradient(135deg, #8b5cf6, #22d3ee);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-write:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-refresh {
  background: var(--card-bg, #f9fafb);
  color: var(--text, #1a1a1a);
  border: 1px solid var(--border, #e5e7eb);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--hover, #f3f4f6);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid var(--border, #e5e7eb);
  border-top: 4px solid var(--primary, #8b5cf6);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state p {
  color: #ef4444;
  font-size: 1.1rem;
  margin-bottom: 16px;
}

.btn-retry {
  background: var(--primary, #8b5cf6);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.empty-state p {
  color: var(--muted, #6b7280);
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.btn-write-primary {
  background: linear-gradient(135deg, #8b5cf6, #22d3ee);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;
}

.btn-write-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.summary-card,
.sentiment-card,
.review-count-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-card h2,
.sentiment-card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text, #1a1a1a);
}

.summary-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text, #1a1a1a);
  white-space: pre-wrap;
}

.sentiment-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-item.positive {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.stat-item.negative {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--muted, #6b7280);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text, #1a1a1a);
  margin-bottom: 4px;
}

.stat-percentage {
  font-size: 1rem;
  color: var(--muted, #6b7280);
}

.overall-sentiment {
  text-align: center;
  margin-top: 16px;
}

.sentiment-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1rem;
}

.sentiment-badge.positive {
  background: rgba(34, 197, 94, 0.2);
  color: #16a34a;
}

.sentiment-badge.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.sentiment-badge.neutral {
  background: rgba(156, 163, 175, 0.2);
  color: #6b7280;
}

.review-count-card {
  text-align: center;
  padding: 20px;
}

.review-count-card p {
  font-size: 1.1rem;
  color: var(--text, #1a1a1a);
}

.review-count-card strong {
  color: var(--primary, #8b5cf6);
  font-weight: 700;
}
</style>
