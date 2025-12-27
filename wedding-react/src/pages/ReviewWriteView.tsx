import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import './ReviewWriteView.css'

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

type Step = 'category' | 'vendor' | 'write'

export default function ReviewWriteView() {
  const authStore = useAuthStore()
  const { request } = useApi()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('category')

  const [categories, setCategories] = useState<{ by_group: Record<string, Category[]>; all: Category[] }>({
    by_group: {},
    all: [],
  })
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  const [completedReservations, setCompletedReservations] = useState<CompletedReservation[]>([])
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [hasValidReservation, setHasValidReservation] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryFromUrl = useMemo(() => {
    return searchParams.get('category') || null
  }, [searchParams])

  const categoryDisplayName = useMemo(() => {
    if (!selectedCategory) return ''
    const category = categories.all.find((c) => c.code === selectedCategory)
    return category?.display_name || selectedCategory.replace(/_/g, ' ')
  }, [selectedCategory, categories.all])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const res = await request<{ message: string; data: { by_group: Record<string, Category[]>; all: Category[] } }>(
        '/categories'
      )
      if (res.message === 'get_categories_success' && res.data) {
        setCategories(res.data)
        if (categoryFromUrl) {
          setSelectedCategory(categoryFromUrl)
          setStep('vendor')
          fetchVendors()
        }
      }
    } catch (err: any) {
      console.error('카테고리 로드 실패:', err)
      setError('카테고리를 불러오지 못했습니다.')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const checkCompletedReservations = async () => {
    setReservationsLoading(true)
    try {
      const res = await request<{ message: string; data: { events: CompletedReservation[] } }>(
        '/calendar/completed-reservations'
      )
      if (res.message === 'completed_reservations_retrieved' && res.data) {
        setCompletedReservations(res.data.events)
        setHasValidReservation(res.data.events.length > 0)
      }
    } catch (err: any) {
      console.error('예약 확인 실패:', err)
      setHasValidReservation(false)
    } finally {
      setReservationsLoading(false)
    }
  }

  const selectCategory = (categoryCode: string) => {
    setSelectedCategory(categoryCode)
    setSelectedVendor(null)
    setVendors([])
    setStep('vendor')
    fetchVendors()
  }

  const fetchVendors = async () => {
    if (!selectedCategory) return

    setVendorsLoading(true)
    try {
      const res = await request<{ message: string; data: { vendors: Vendor[] } }>(
        `/vendors?category=${encodeURIComponent(selectedCategory)}`
      )
      if (res.message === 'vendors_retrieved' && res.data) {
        setVendors(res.data.vendors)
      }
    } catch (err: any) {
      console.error('업체 로드 실패:', err)
      setError('업체를 불러오지 못했습니다.')
    } finally {
      setVendorsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCategory) {
      fetchVendors()
    }
  }, [selectedCategory])

  const selectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setFormTitle(`${vendor.name} 후기`)
    setStep('write')
  }

  const goBack = () => {
    if (step === 'write') {
      setStep('vendor')
      setSelectedVendor(null)
    } else if (step === 'vendor') {
      setStep('category')
      setSelectedCategory(null)
      setSelectedVendor(null)
      setVendors([])
    }
  }

  const submitReview = async () => {
    if (!selectedCategory || !selectedVendor) {
      setError('카테고리와 업체를 선택해주세요.')
      return
    }

    if (!formTitle.trim() || !formContent.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }

    if (!hasValidReservation) {
      setError('예약을 완료하고 하루 이상 지난 후에만 리뷰를 작성할 수 있습니다.')
      return
    }

    setFormSubmitting(true)
    setError(null)

    try {
      await request('/posts', {
        method: 'POST',
        body: {
          title: formTitle.trim(),
          content: formContent.trim(),
          board_type: 'couple',
          category: selectedCategory,
          vendor_id: selectedVendor.id,
        },
      })

      navigate('/board')
    } catch (err: any) {
      console.error('리뷰 작성 실패:', err)
      setError(err?.data?.error || err?.message || '리뷰 작성에 실패했습니다.')
    } finally {
      setFormSubmitting(false)
    }
  }

  useEffect(() => {
    if (authStore.isAuthenticated) {
      fetchCategories()
      checkCompletedReservations()
    }
  }, [authStore.isAuthenticated])

  return (
    <div className="review-write-view">
      <div className="page-header">
        <div className="header-content">
          <h1>✍️ 리뷰 작성</h1>
          <p>예약을 완료하고 하루 이상 지난 업체에 대한 리뷰를 작성하세요.</p>
        </div>
      </div>

      {/* 예약 확인 상태 */}
      {reservationsLoading && (
        <div className="info-box loading">
          <p>예약 정보를 확인하는 중...</p>
        </div>
      )}
      {!reservationsLoading && !hasValidReservation && (
        <div className="info-box warning">
          <p>⚠️ 완료된 예약이 없거나 아직 리뷰 작성 가능 시간이 되지 않았습니다.</p>
          <p>예약을 완료하고 하루 이상 지난 후에 리뷰를 작성할 수 있습니다.</p>
        </div>
      )}
      {!reservationsLoading && hasValidReservation && (
        <div className="info-box success">
          <p>✅ 리뷰 작성 가능한 예약이 있습니다.</p>
        </div>
      )}

      {/* 단계별 UI */}
      <div className="steps-container">
        {/* 단계 1: 카테고리 선택 */}
        {step === 'category' && (
          <div className="step-content">
            <h2>카테고리 선택</h2>
            {categoriesLoading ? (
              <div className="loading-state">
                <p>카테고리를 불러오는 중...</p>
              </div>
            ) : (
              <div className="category-grid">
                {categories.all.map((cat) => (
                  <button
                    key={cat.code}
                    className="category-card"
                    onClick={() => selectCategory(cat.code)}
                    disabled={!hasValidReservation}
                  >
                    <div className="category-name">{cat.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 단계 2: 업체 선택 */}
        {step === 'vendor' && (
          <div className="step-content">
            <div className="step-header">
              <button className="btn-back" onClick={goBack}>
                ← 뒤로
              </button>
              <h2>{categoryDisplayName} 업체 선택</h2>
            </div>
            {vendorsLoading ? (
              <div className="loading-state">
                <p>업체를 불러오는 중...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="empty-state">
                <p>선택한 카테고리에 등록된 업체가 없습니다.</p>
              </div>
            ) : (
              <div className="vendor-list">
                {vendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    className="vendor-card"
                    onClick={() => selectVendor(vendor)}
                    disabled={!hasValidReservation}
                  >
                    <div className="vendor-name">{vendor.name}</div>
                    {vendor.description && <div className="vendor-description">{vendor.description}</div>}
                    {vendor.base_location_city && (
                      <div className="vendor-location">
                        {vendor.base_location_city} {vendor.base_location_district || ''}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 단계 3: 리뷰 작성 */}
        {step === 'write' && (
          <div className="step-content">
            <div className="step-header">
              <button className="btn-back" onClick={goBack}>
                ← 뒤로
              </button>
              <h2>리뷰 작성</h2>
            </div>
            {selectedVendor && (
              <div className="selected-vendor-info">
                <p>
                  <strong>카테고리:</strong> {categoryDisplayName}
                </p>
                <p>
                  <strong>업체:</strong> {selectedVendor.name}
                </p>
              </div>
            )}
            <div className="review-form">
              <div className="form-group">
                <label>제목</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  type="text"
                  placeholder="리뷰 제목을 입력하세요"
                  disabled={!hasValidReservation || formSubmitting}
                />
              </div>
              <div className="form-group">
                <label>내용</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="리뷰 내용을 입력하세요"
                  rows={10}
                  disabled={!hasValidReservation || formSubmitting}
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="form-actions">
                <button
                  className="btn-submit"
                  onClick={submitReview}
                  disabled={!hasValidReservation || formSubmitting || !formTitle.trim() || !formContent.trim()}
                >
                  {formSubmitting ? '작성 중...' : '리뷰 작성'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
