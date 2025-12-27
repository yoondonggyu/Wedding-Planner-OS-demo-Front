import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuthStore } from '@/contexts/auth'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import clsx from 'clsx'
import './VendorView.css'

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

const vendorTypes = [
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

export default function VendorView() {
  const authStore = useAuthStore()
  const { request } = useApi()
  const { showToast } = useToast()

  const [profiles, setProfiles] = useState<WeddingProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    wedding_date: '',
    guest_count_category: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE',
    total_budget: 30000000,
    location_city: '서울시',
    location_district: '',
    style_indoor: true,
    style_outdoor: false,
    outdoor_rain_plan_required: false,
  })
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null)

  const [selectedVendorType, setSelectedVendorType] = useState<string | null>(null)
  const [vendors, setVendors] = useState<VendorWithScore[]>([])
  const [loading, setLoading] = useState(false)
  const [showVendorDetail, setShowVendorDetail] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [hasRainPlan, setHasRainPlan] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<'score_desc' | 'price_asc' | 'price_desc' | 'review_desc'>('score_desc')

  const [favorites, setFavorites] = useState<number[]>([])
  const [favoriteList, setFavoriteList] = useState<Favorite[]>([])
  const [comparingVendors, setComparingVendors] = useState<number[]>([])
  const [showFavoriteList, setShowFavoriteList] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)

  const selectedProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedProfileId)
  }, [profiles, selectedProfileId])

  const filteredVendors = useMemo(() => {
    let result = [...vendors]
    
    if (minPrice !== null) {
      result = result.filter(v => v.vendor.max_price === null || v.vendor.max_price >= minPrice)
    }
    if (maxPrice !== null) {
      result = result.filter(v => v.vendor.min_price === null || v.vendor.min_price <= maxPrice)
    }
    if (locationFilter) {
      result = result.filter(v => 
        v.vendor.base_location_city.includes(locationFilter) ||
        v.vendor.service_area?.some(area => area.includes(locationFilter))
      )
    }
    
    if (hasRainPlan === true && selectedVendorType === 'VENUE_OUTDOOR') {
      result = result.filter(v => {
        const detail = v.vendor.venue_detail
        return detail?.has_indoor_backup === true || detail?.has_tent_option === true
      })
    }
    
    return result
  }, [vendors, minPrice, maxPrice, locationFilter, hasRainPlan, selectedVendorType])

  const comparingVendorList = useMemo(() => {
    return vendors
      .filter(v => comparingVendors.includes(v.vendor.id))
      .map(v => v.vendor)
  }, [vendors, comparingVendors])

  useEffect(() => {
    if (authStore.isAuthenticated) {
      loadProfiles()
      loadFavorites()
    }
  }, [authStore.isAuthenticated])

  useEffect(() => {
    if (selectedProfileId) {
      loadVendors()
      loadFavorites()
    } else {
      setVendors([])
    }
  }, [selectedProfileId])

  useEffect(() => {
    if (selectedProfileId) {
      loadVendors()
    }
  }, [selectedVendorType, sortBy])

  const loadProfiles = useCallback(async () => {
    try {
      const res = await request<{ message: string; data: { profiles: WeddingProfile[] } }>(
        '/wedding-profiles',
        { method: 'GET' }
      )
      if (res.message === 'wedding_profiles_retrieved') {
        setProfiles(res.data.profiles)
        if (res.data.profiles.length > 0 && !selectedProfileId) {
          setSelectedProfileId(res.data.profiles[0].id)
        }
      }
    } catch (err) {
      console.error('프로필 로드 실패:', err)
      showToast('프로필을 불러오는데 실패했습니다.', 'error')
    }
  }, [request, showToast, selectedProfileId])

  const loadVendors = useCallback(async () => {
    if (!selectedProfileId) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('wedding_profile_id', String(selectedProfileId))
      if (selectedVendorType) {
        params.append('vendor_type', selectedVendorType)
      }
      if (minPrice !== null) {
        params.append('min_price', String(minPrice))
      }
      if (maxPrice !== null) {
        params.append('max_price', String(maxPrice))
      }
      if (locationFilter) {
        params.append('location_city', locationFilter)
      }
      if (hasRainPlan === true && selectedVendorType === 'VENUE_OUTDOOR') {
        params.append('has_rain_plan', 'true')
      }
      params.append('sort', sortBy)
      
      const res = await request<{ message: string; data: { vendors: VendorWithScore[] } }>(
        `/vendors/recommend?${params.toString()}`,
        { method: 'GET' }
      )
      if (res.message === 'vendors_recommended') {
        setVendors(res.data.vendors)
      }
    } catch (err) {
      console.error('업체 로드 실패:', err)
      showToast('업체를 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedProfileId, selectedVendorType, minPrice, maxPrice, locationFilter, hasRainPlan, sortBy, request, showToast])

  const saveProfile = useCallback(async () => {
    if (!profileForm.wedding_date || !profileForm.location_district) {
      showToast('모든 필드를 입력해주세요.', 'error')
      return
    }
    
    try {
      if (editingProfileId) {
        await request(`/wedding-profiles/${editingProfileId}`, {
          method: 'PUT',
          body: profileForm,
        })
        showToast('프로필이 수정되었습니다.', 'success')
      } else {
        const res = await request<{ message: string; data: { id: number } }>(
          '/wedding-profiles',
          {
            method: 'POST',
            body: profileForm,
          }
        )
        if (res.message === 'wedding_profile_created') {
          showToast('프로필이 생성되었습니다.', 'success')
          setSelectedProfileId(res.data.id)
        }
      }
      setShowProfileModal(false)
      await loadProfiles()
    } catch (err) {
      console.error('프로필 저장 실패:', err)
      showToast('프로필 저장에 실패했습니다.', 'error')
    }
  }, [profileForm, editingProfileId, request, showToast, loadProfiles])

  const openProfileModal = useCallback((profile?: WeddingProfile) => {
    if (profile) {
      setEditingProfileId(profile.id)
      setProfileForm({
        wedding_date: profile.wedding_date,
        guest_count_category: profile.guest_count_category,
        total_budget: profile.total_budget,
        location_city: profile.location_city,
        location_district: profile.location_district,
        style_indoor: profile.style_indoor,
        style_outdoor: profile.style_outdoor,
        outdoor_rain_plan_required: profile.outdoor_rain_plan_required,
      })
    } else {
      setEditingProfileId(null)
      setProfileForm({
        wedding_date: '',
        guest_count_category: 'MEDIUM',
        total_budget: 30000000,
        location_city: '서울시',
        location_district: '',
        style_indoor: true,
        style_outdoor: false,
        outdoor_rain_plan_required: false,
      })
    }
    setShowProfileModal(true)
  }, [])

  const openVendorDetail = useCallback(async (vendor: Vendor) => {
    try {
      const res = await request<{ message: string; data: Vendor }>(
        `/vendors/${vendor.id}`,
        { method: 'GET' }
      )
      if (res.message === 'vendor_retrieved') {
        setSelectedVendor(res.data)
        setShowVendorDetail(true)
      }
    } catch (err) {
      console.error('업체 상세 로드 실패:', err)
      showToast('업체 정보를 불러오는데 실패했습니다.', 'error')
    }
  }, [request, showToast])

  const toggleFavorite = useCallback(async (vendorId: number) => {
    if (!selectedProfileId) {
      showToast('프로필을 먼저 선택해주세요.', 'error')
      return
    }
    
    const isFavorite = favorites.includes(vendorId)
    
    try {
      if (isFavorite) {
        const favorite = favoriteList.find(f => f.vendor_id === vendorId)
        if (favorite) {
          await request(`/favorites/${favorite.id}`, { method: 'DELETE' })
          setFavorites(favorites.filter(id => id !== vendorId))
          setFavoriteList(favoriteList.filter(f => f.id !== favorite.id))
          showToast('찜 목록에서 제거되었습니다.', 'success')
        }
      } else {
        await request('/favorites', {
          method: 'POST',
          body: {
            wedding_profile_id: selectedProfileId,
            vendor_id: vendorId,
          },
        })
        setFavorites([...favorites, vendorId])
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
  }, [selectedProfileId, favorites, favoriteList, request, showToast])

  const loadFavorites = useCallback(async () => {
    if (!selectedProfileId) return
    
    try {
      const res = await request<{ message: string; data: { favorites: Favorite[] } }>(
        `/favorites?wedding_profile_id=${selectedProfileId}`,
        { method: 'GET' }
      )
      if (res.message === 'favorites_retrieved') {
        setFavoriteList(res.data.favorites)
        setFavorites(res.data.favorites.map(f => f.vendor_id))
      }
    } catch (err) {
      console.error('찜 목록 로드 실패:', err)
    }
  }, [selectedProfileId, request])

  const toggleCompare = useCallback((vendorId: number) => {
    setComparingVendors(prev => {
      const index = prev.indexOf(vendorId)
      if (index > -1) {
        return prev.filter(id => id !== vendorId)
      } else {
        if (prev.length >= 3) {
          showToast('최대 3개까지만 비교할 수 있습니다.', 'warning')
          return prev
        }
        return [...prev, vendorId]
      }
    })
  }, [showToast])

  const openCompareModal = useCallback(() => {
    if (comparingVendors.length < 2) {
      showToast('비교할 업체를 2개 이상 선택해주세요.', 'warning')
      return
    }
    setShowCompareModal(true)
  }, [comparingVendors.length, showToast])

  const formatPrice = useCallback((price: number | null) => {
    if (price === null) return '문의'
    return `${(price / 10000).toFixed(0)}만원`
  }, [])

  const getVendorTypeLabel = useCallback((type: string) => {
    return vendorTypes.find(vt => vt.value === type)?.label || type
  }, [])

  const getRainPlanBadges = useCallback((vendor: Vendor) => {
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
  }, [])

  const getVendorTypeDetail = useCallback((vendor: Vendor) => {
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
  }, [])

  const handleDateKeydown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement
    
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(event.key)) {
      return
    }
    
    if (event.ctrlKey || event.metaKey) {
      return
    }
    
    if (!/^\d$/.test(event.key)) {
      event.preventDefault()
      return
    }
    
    const currentValue = input.value.replace(/\D/g, '')
    const newValue = currentValue + event.key
    
    if (newValue.length > 8) {
      event.preventDefault()
      return
    }
    
    let formatted = newValue
    if (newValue.length > 4) {
      formatted = newValue.slice(0, 4) + '-' + newValue.slice(4, 6)
    }
    if (newValue.length > 6) {
      formatted = newValue.slice(0, 4) + '-' + newValue.slice(4, 6) + '-' + newValue.slice(6, 8)
    }
    
    if (newValue.length === 4) {
      event.preventDefault()
      formatted = newValue + '-'
      setProfileForm(prev => ({ ...prev, wedding_date: formatted }))
      setTimeout(() => {
        input.value = formatted
        input.setSelectionRange(5, 5)
      }, 0)
      return
    }
    
    if (newValue.length === 6) {
      event.preventDefault()
      formatted = newValue.slice(0, 4) + '-' + newValue.slice(4, 6) + '-'
      setProfileForm(prev => ({ ...prev, wedding_date: formatted }))
      setTimeout(() => {
        input.value = formatted
        input.setSelectionRange(formatted.length, formatted.length)
      }, 0)
      return
    }
    
    event.preventDefault()
    const formatDateValue = (digits: string): string => {
      if (digits.length <= 4) {
        return digits
      } else if (digits.length <= 6) {
        return digits.slice(0, 4) + '-' + digits.slice(4, 6)
      } else {
        return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8)
      }
    }
    formatted = formatDateValue(newValue)
    setProfileForm(prev => ({ ...prev, wedding_date: formatted }))
    setTimeout(() => {
      input.value = formatted
      input.setSelectionRange(formatted.length, formatted.length)
    }, 0)
  }, [])

  const formatDateValue = useCallback((digits: string): string => {
    if (digits.length <= 4) {
      return digits
    } else if (digits.length <= 6) {
      return digits.slice(0, 4) + '-' + digits.slice(4, 6)
    } else {
      return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8)
    }
  }, [])

  const handleDateInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const value = input.value
    
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setProfileForm(prev => ({ ...prev, wedding_date: value }))
      return
    }
    
    const digits = value.replace(/\D/g, '').slice(0, 8)
    const formatted = formatDateValue(digits)
    setProfileForm(prev => ({ ...prev, wedding_date: formatted }))
    
    setTimeout(() => {
      if (input.value !== formatted) {
        input.value = formatted
      }
    }, 0)
  }, [formatDateValue])

  const handleDatePaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const input = event.target as HTMLInputElement
    const pastedText = event.clipboardData?.getData('text') || ''
    const digits = pastedText.replace(/\D/g, '').slice(0, 8)
    const formatted = formatDateValue(digits)
    
    setProfileForm(prev => ({ ...prev, wedding_date: formatted }))
    
    setTimeout(() => {
      input.value = formatted
      input.setSelectionRange(formatted.length, formatted.length)
    }, 0)
  }, [formatDateValue])

  return (
    <section className="section" id="vendor">
      <div className="container">
        <div className="page-title">
          <h1>💍 업체 추천</h1>
          <p>결혼식 프로필에 맞는 업체를 추천받아보세요</p>
        </div>

        <div className="card profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>결혼식 프로필</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="button" onClick={() => setShowFavoriteList(true)} disabled={!selectedProfileId}>
                찜 목록 ({favorites.length})
              </button>
              <button className="btn primary" type="button" onClick={() => openProfileModal()}>프로필 생성</button>
            </div>
          </div>
          
          {profiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              프로필이 없습니다. 프로필을 생성해주세요.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  className={clsx('btn', { primary: selectedProfileId === profile.id })}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  {profile.wedding_date} · {profile.location_city} {profile.location_district}
                </button>
              ))}
            </div>
          )}
          
          {selectedProfile && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--soft)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    예식일: {selectedProfile.wedding_date}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                    규모: {selectedProfile.guest_count_category === 'SMALL' ? '소규모' : selectedProfile.guest_count_category === 'MEDIUM' ? '중규모' : '대규모'} · 
                    예산: {(selectedProfile.total_budget / 10000).toFixed(0)}만원 · 
                    지역: {selectedProfile.location_city} {selectedProfile.location_district}
                  </div>
                  {selectedProfile.style_outdoor && selectedProfile.outdoor_rain_plan_required && (
                    <div style={{ marginTop: 8, padding: '6px 12px', background: 'var(--accent)', color: 'white', borderRadius: 6, fontSize: 12, display: 'inline-block' }}>
                      🌧️ 우천 대안 필수
                    </div>
                  )}
                </div>
                <button className="btn" type="button" onClick={() => openProfileModal(selectedProfile)}>수정</button>
              </div>
            </div>
          )}
        </div>

        {selectedProfileId ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>업체 추천</h2>
              {comparingVendors.length > 0 && (
                <button className="btn primary" type="button" onClick={openCompareModal}>
                  비교하기 ({comparingVendors.length})
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button
                className={clsx('btn', { primary: selectedVendorType === null })}
                type="button"
                onClick={() => setSelectedVendorType(null)}
              >
                전체
              </button>
              {vendorTypes.map(vt => (
                <button
                  key={vt.value}
                  className={clsx('btn', { primary: selectedVendorType === vt.value })}
                  type="button"
                  onClick={() => setSelectedVendorType(vt.value)}
                >
                  {vt.icon} {vt.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 14 }}>가격:</label>
                <input
                  value={minPrice || ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)}
                  type="number"
                  placeholder="최소"
                  style={{ width: 100, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--input-background)', color: 'var(--text)' }}
                />
                <span>~</span>
                <input
                  value={maxPrice || ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                  type="number"
                  placeholder="최대"
                  style={{ width: 100, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--input-background)', color: 'var(--text)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>만원</span>
              </div>
              
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 14 }}>지역:</label>
                <input
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  type="text"
                  placeholder="지역 검색"
                  style={{ width: 150, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--input-background)', color: 'var(--text)' }}
                />
              </div>
              
              {selectedVendorType === 'VENUE_OUTDOOR' && selectedProfile?.style_outdoor && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ fontSize: 14, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={hasRainPlan === true}
                      onChange={(e) => setHasRainPlan(e.target.checked ? true : null)}
                      style={{ marginRight: 6 }}
                    />
                    우천 대안 필수
                  </label>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
                <label style={{ fontSize: 14 }}>정렬:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--input-background)', color: 'var(--text)' }}
                >
                  <option value="score_desc">매칭 점수 높은 순</option>
                  <option value="price_asc">가격 낮은 순</option>
                  <option value="price_desc">가격 높은 순</option>
                  <option value="review_desc">리뷰 많은 순</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                로딩 중...
              </div>
            ) : filteredVendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                추천 업체가 없습니다.
              </div>
            ) : (
              <div className="vendor-grid">
                {filteredVendors.map(item => (
                  <div
                    key={item.vendor.id}
                    className={clsx('vendor-card', { comparing: comparingVendors.includes(item.vendor.id) })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{item.vendor.name}</h3>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
                          {getVendorTypeLabel(item.vendor.vendor_type)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={clsx('compare-btn', { active: comparingVendors.includes(item.vendor.id) })}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCompare(item.vendor.id)
                          }}
                          title={comparingVendors.includes(item.vendor.id) ? '비교에서 제거' : '비교에 추가'}
                        >
                          {comparingVendors.includes(item.vendor.id) ? '✓' : '⚖️'}
                        </button>
                        <button
                          className={clsx('favorite-btn', { active: favorites.includes(item.vendor.id) })}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(item.vendor.id)
                          }}
                        >
                          {favorites.includes(item.vendor.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                    
                    {item.vendor.portfolio_images && item.vendor.portfolio_images.length > 0 && (
                      <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', maxHeight: 150 }}>
                        <img 
                          src={item.vendor.portfolio_images[0]} 
                          alt={item.vendor.name}
                          style={{ width: '100%', height: 150, objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    
                    <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12, lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>
                      {item.vendor.description || '설명 없음'}
                    </div>
                    
                    {item.vendor.vendor_type === 'VENUE_OUTDOOR' && getRainPlanBadges(item.vendor).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {getRainPlanBadges(item.vendor).map(badge => (
                          <span 
                            key={badge}
                            style={{ padding: '4px 8px', background: 'var(--accent)', color: 'white', borderRadius: 4, fontSize: 11 }}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                      <div>📍 {item.vendor.base_location_city} {item.vendor.base_location_district}</div>
                      <div>💰 {formatPrice(item.vendor.min_price)} ~ {formatPrice(item.vendor.max_price)}</div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>⭐ {item.vendor.rating_avg.toFixed(1)}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>({item.vendor.review_count})</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                        매칭 {item.match_score}점
                      </div>
                    </div>
                    
                    <button className="btn primary" style={{ width: '100%', marginTop: 12 }} onClick={(e) => {
                      e.stopPropagation()
                      openVendorDetail(item.vendor)
                    }}>
                      상세보기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            프로필을 선택하거나 생성해주세요.
          </div>
        )}
      </div>

      {showProfileModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowProfileModal(false)
        }}>
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>{editingProfileId ? '프로필 수정' : '프로필 생성'}</h3>
            
            <div className="form-group">
              <label>예식일</label>
              <div className="input-with-icon">
                <input
                  value={profileForm.wedding_date}
                  type="text"
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  required
                  onKeyDown={handleDateKeydown}
                  onChange={handleDateInput}
                  onPaste={handleDatePaste}
                />
                <span className="input-icon">📅</span>
              </div>
            </div>
            
            <div className="form-group">
              <label>규모</label>
              <select value={profileForm.guest_count_category} onChange={(e) => setProfileForm(prev => ({ ...prev, guest_count_category: e.target.value as typeof profileForm.guest_count_category }))}>
                <option value="SMALL">소규모 (50명 미만)</option>
                <option value="MEDIUM">중규모 (50~150명)</option>
                <option value="LARGE">대규모 (150명 이상)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>전체 예산 (원)</label>
              <input value={profileForm.total_budget} onChange={(e) => setProfileForm(prev => ({ ...prev, total_budget: Number(e.target.value) }))} type="number" required />
            </div>
            
            <div className="form-group">
              <label>시/도</label>
              <input value={profileForm.location_city} onChange={(e) => setProfileForm(prev => ({ ...prev, location_city: e.target.value }))} type="text" required />
            </div>
            
            <div className="form-group">
              <label>구/군</label>
              <input value={profileForm.location_district} onChange={(e) => setProfileForm(prev => ({ ...prev, location_district: e.target.value }))} type="text" required />
            </div>
            
            <div className="form-group">
              <label>
                <input type="checkbox" checked={profileForm.style_indoor} onChange={(e) => setProfileForm(prev => ({ ...prev, style_indoor: e.target.checked }))} />
                실내 결혼식
              </label>
            </div>
            
            <div className="form-group">
              <label>
                <input type="checkbox" checked={profileForm.style_outdoor} onChange={(e) => setProfileForm(prev => ({ ...prev, style_outdoor: e.target.checked }))} />
                야외 결혼식
              </label>
            </div>
            
            {profileForm.style_outdoor && (
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={profileForm.outdoor_rain_plan_required} onChange={(e) => setProfileForm(prev => ({ ...prev, outdoor_rain_plan_required: e.target.checked }))} />
                  우천 시 대안 필수
                </label>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn" type="button" onClick={() => setShowProfileModal(false)}>취소</button>
              <button className="btn primary" type="button" onClick={saveProfile}>저장</button>
            </div>
          </div>
        </div>
      )}

      {showVendorDetail && selectedVendor && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowVendorDetail(false)
        }}>
          <div className="modal-card vendor-detail-modal" style={{ maxWidth: 900, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0' }}>{selectedVendor.name}</h2>
                <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                  {getVendorTypeLabel(selectedVendor.vendor_type)}
                </div>
              </div>
              <button className="btn" type="button" onClick={() => setShowVendorDetail(false)} style={{ padding: '8px 12px' }}>✕</button>
            </div>
            
            {selectedVendor.portfolio_images && selectedVendor.portfolio_images.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {selectedVendor.portfolio_images.map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`포트폴리오 ${idx + 1}`}
                      style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: 20, lineHeight: 1.6 }}>{selectedVendor.description}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>위치</div>
                <div>{selectedVendor.base_location_city} {selectedVendor.base_location_district}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>서비스 지역</div>
                <div>{selectedVendor.service_area?.join(', ') || '전국'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>가격</div>
                <div>{formatPrice(selectedVendor.min_price)} ~ {formatPrice(selectedVendor.max_price)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>평점</div>
                <div>⭐ {selectedVendor.rating_avg.toFixed(1)} ({selectedVendor.review_count}개 리뷰)</div>
              </div>
            </div>
            
            {getVendorTypeDetail(selectedVendor) && (
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--soft)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16 }}>상세 정보</h4>
                <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                  {Object.entries(getVendorTypeDetail(selectedVendor)).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong>{' '}
                      {typeof value === 'boolean' ? (value ? '예' : '아니오') : Array.isArray(value) ? value.join(', ') : String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedVendor.vendor_type === 'VENUE_OUTDOOR' && getRainPlanBadges(selectedVendor).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 16 }}>우천 대안</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {getRainPlanBadges(selectedVendor).map(badge => (
                    <span 
                      key={badge}
                      style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', borderRadius: 6, fontSize: 13 }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {selectedVendor.contact_link && (
                <a href={selectedVendor.contact_link} target="_blank" rel="noopener noreferrer" className="btn primary">
                  문의하기
                </a>
              )}
              {selectedVendor.contact_phone && (
                <a href={`tel:${selectedVendor.contact_phone}`} className="btn">
                  전화: {selectedVendor.contact_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {showFavoriteList && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowFavoriteList(false)
        }}>
          <div className="modal-card" style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>찜 목록</h2>
              <button className="btn" type="button" onClick={() => setShowFavoriteList(false)}>✕</button>
            </div>
            
            {favoriteList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                찜한 업체가 없습니다.
              </div>
            ) : (
              <div className="vendor-grid">
                {favoriteList.map(favorite => (
                  <div
                    key={favorite.id}
                    className="vendor-card"
                    onClick={() => openVendorDetail(favorite.vendor)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{favorite.vendor.name}</h3>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                          {getVendorTypeLabel(favorite.vendor.vendor_type)}
                        </div>
                      </div>
                      <button
                        className="favorite-btn active"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(favorite.vendor_id)
                        }}
                      >
                        ❤️
                      </button>
                    </div>
                    
                    <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>
                      {favorite.vendor.description || '설명 없음'}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                      <div>📍 {favorite.vendor.base_location_city}</div>
                      <div>💰 {formatPrice(favorite.vendor.min_price)} ~ {formatPrice(favorite.vendor.max_price)}</div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>⭐ {favorite.vendor.rating_avg.toFixed(1)} ({favorite.vendor.review_count})</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCompareModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowCompareModal(false)
        }}>
          <div className="modal-card" style={{ maxWidth: 1200, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>업체 비교</h2>
              <button className="btn" type="button" onClick={() => setShowCompareModal(false)}>✕</button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>항목</th>
                    {comparingVendorList.map(vendor => (
                      <th key={vendor.id}>{vendor.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>타입</strong></td>
                    {comparingVendorList.map(vendor => (
                      <td key={vendor.id}>{getVendorTypeLabel(vendor.vendor_type)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>위치</strong></td>
                    {comparingVendorList.map(vendor => (
                      <td key={vendor.id}>{vendor.base_location_city} {vendor.base_location_district}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>가격</strong></td>
                    {comparingVendorList.map(vendor => (
                      <td key={vendor.id}>{formatPrice(vendor.min_price)} ~ {formatPrice(vendor.max_price)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>평점</strong></td>
                    {comparingVendorList.map(vendor => (
                      <td key={vendor.id}>⭐ {vendor.rating_avg.toFixed(1)} ({vendor.review_count}개)</td>
                    ))}
                  </tr>
                  {comparingVendorList.some(v => v.vendor_type === 'VENUE_OUTDOOR') && (
                    <tr>
                      <td><strong>우천 대안</strong></td>
                      {comparingVendorList.map(vendor => (
                        <td key={vendor.id}>
                          {vendor.vendor_type === 'VENUE_OUTDOOR' ? (
                            <>
                              {getRainPlanBadges(vendor).length > 0 ? (
                                getRainPlanBadges(vendor).map(badge => (
                                  <div key={badge} style={{ fontSize: 11, margin: '2px 0' }}>• {badge}</div>
                                ))
                              ) : (
                                <div style={{ color: 'var(--muted)' }}>없음</div>
                              )}
                            </>
                          ) : (
                            <div style={{ color: 'var(--muted)' }}>해당 없음</div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <td><strong>설명</strong></td>
                    {comparingVendorList.map(vendor => (
                      <td key={vendor.id} style={{ maxWidth: 200 }}>{vendor.description || '설명 없음'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>문의</strong></td>
                    {comparingVendorList.map(vendor => (
                      <td key={vendor.id}>
                        {vendor.contact_link ? (
                          <a href={vendor.contact_link} target="_blank" rel="noopener noreferrer" className="btn primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                            문의하기
                          </a>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>문의 불가</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
