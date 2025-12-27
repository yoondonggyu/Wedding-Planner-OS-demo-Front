import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import './ReviewSummaryView.css'

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

const categoryMap: Record<string, string> = {
  아이폰_스냅: '아이폰 스냅',
  웨딩_스튜디오: '웨딩 스튜디오',
  웨딩_사진: '웨딩 사진',
  웨딩_영상: '웨딩 영상',
  웨딩홀: '웨딩홀',
  실내_식장: '실내 식장',
  야외_식장: '야외 식장',
  복합_식장: '복합 식장',
  웨딩_플래너: '웨딩 플래너',
  웨딩_코디네이터: '웨딩 코디네이터',
  드레스샵: '드레스샵',
  턱시도샵: '턱시도샵',
  메이크업_헤어: '메이크업/헤어',
  뷰티_살롱: '뷰티 살롱',
  한복: '한복',
  케이터링: '케이터링',
  뷔페_식당: '뷔페/식당',
  케이크_디저트: '케이크/디저트',
  바_음료: '바/음료',
  꽃_플로리스트: '꽃/플로리스트',
  장식_데코: '장식/데코',
  부케_꽃다발: '부케/꽃다발',
  예물_주얼리: '예물/주얼리',
  예물_반지: '예물/반지',
  웨딩카: '웨딩카',
  리무진: '리무진',
  교통_운송: '교통/운송',
  사회자: '사회자',
  축가: '축가',
  밴드_연주자: '밴드/연주자',
  축가_연주: '축가/연주',
  청첩장_인쇄: '청첩장/인쇄',
  웨딩선물_답례품: '웨딩선물/답례품',
  호텔_숙박: '호텔/숙박',
  웨딩박람회: '웨딩박람회',
  신혼여행: '신혼여행',
}

export default function ReviewSummaryView() {
  const authStore = useAuthStore()
  const { request } = useApi()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const boardType = 'couple'

  const selectedCategory = useMemo(() => {
    return searchParams.get('category') || null
  }, [searchParams])

  const categoryDisplayName = useMemo(() => {
    if (!selectedCategory) return '전체'
    return categoryMap[selectedCategory] || selectedCategory.replace(/_/g, ' ')
  }, [selectedCategory])

  const fetchReviewSummary = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = `/posts/reviews/summarize?board_type=${boardType}&limit=100`
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }

      const res = await request<{ message: string; data: ReviewSummary }>(url, {
        method: 'POST',
      })

      if (res.message === 'review_summary_success' && res.data) {
        setSummary(res.data)
      } else {
        setError('리뷰 요약을 불러오지 못했습니다.')
      }
    } catch (err: any) {
      console.error('리뷰 요약 로드 실패:', err)
      const errorMessage =
        err?.response?.data?.detail || err?.data?.detail || err?.data?.error || err?.message || '리뷰 요약을 불러오지 못했습니다.'
      setError(`API 요청 실패: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshSummary = () => {
    fetchReviewSummary()
  }

  const goToWriteReview = () => {
    const categoryParam = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ''
    navigate(`/review-write${categoryParam}`)
  }

  useEffect(() => {
    if (authStore.isAuthenticated) {
      fetchReviewSummary()
    }
  }, [authStore.isAuthenticated, selectedCategory])

  return (
    <div className="review-summary-view">
      <div className="page-header">
        <div className="header-content">
          <h1>📊 리뷰 요약</h1>
          {selectedCategory ? (
            <p>
              <strong>{categoryDisplayName}</strong> 카테고리의 리뷰를 AI로 분석하고 요약합니다.
            </p>
          ) : (
            <p>게시판의 모든 리뷰를 AI로 분석하고 요약합니다.</p>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-write" onClick={goToWriteReview}>
            ✍️ 리뷰 작성
          </button>
          <button className="btn-refresh" onClick={refreshSummary} disabled={loading}>
            <span>🔄</span>
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>리뷰를 분석하고 요약하는 중...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>❌ {error}</p>
          <button className="btn-retry" onClick={fetchReviewSummary}>
            다시 시도
          </button>
        </div>
      )}

      {!summary || summary.review_count === 0 ? (
        <div className="empty-state">
          <p>📝 리뷰가 없습니다.</p>
          <p>첫 번째 리뷰를 작성해보세요!</p>
          <button className="btn-write-primary" onClick={goToWriteReview}>
            ✍️ 리뷰 작성하기
          </button>
        </div>
      ) : (
        <div className="summary-content">
          {/* 전체 요약 */}
          <div className="summary-card">
            <h2>📝 전체 요약</h2>
            <div className="summary-text">{summary.summary}</div>
          </div>

          {/* 감성 분석 */}
          <div className="sentiment-card">
            <h2>💭 감성 분석</h2>
            <div className="sentiment-stats">
              <div className="stat-item positive">
                <div className="stat-label">긍정</div>
                <div className="stat-value">{summary.sentiment_analysis.positive_count}개</div>
                <div className="stat-percentage">{summary.sentiment_analysis.positive_percentage.toFixed(1)}%</div>
              </div>
              <div className="stat-item negative">
                <div className="stat-label">부정</div>
                <div className="stat-value">{summary.sentiment_analysis.negative_count}개</div>
                <div className="stat-percentage">{summary.sentiment_analysis.negative_percentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="overall-sentiment">
              <span
                className={`sentiment-badge ${summary.sentiment_analysis.overall_sentiment}`}
              >
                {summary.sentiment_analysis.overall_sentiment === 'positive'
                  ? '긍정적'
                  : summary.sentiment_analysis.overall_sentiment === 'negative'
                  ? '부정적'
                  : '중립적'}
              </span>
            </div>
          </div>

          {/* 리뷰 개수 */}
          <div className="review-count-card">
            <p>
              총 <strong>{summary.review_count}</strong>개의 리뷰가 분석되었습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
