import React, { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import './VendorInfoModal.css'

interface VendorInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (vendorInfo: VendorInfo) => void
}

export interface VendorInfo {
  vendorName: string
  vendorType: string
  businessNumber: string
  contactPhone: string
  contactEmail: string
  address: string
  description: string
}

const vendorTypes = [
  { value: 'IPHONE_SNAP', label: '스냅사진' },
  { value: 'MC', label: 'MC' },
  { value: 'SINGER', label: '가수' },
  { value: 'STUDIO_PREWEDDING', label: '스튜디오 (스드메)' },
  { value: 'VENUE_OUTDOOR', label: '야외 예식장' },
  { value: 'VENUE_INDOOR', label: '실내 예식장' },
  { value: 'CATERING', label: '케이터링' },
  { value: 'FLOWER', label: '플로리스트' },
  { value: 'MAKEUP', label: '메이크업' },
  { value: 'DRESS', label: '드레스샵' },
  { value: 'SUIT', label: '턱시도샵' },
  { value: 'INVITATION', label: '청첩장' },
  { value: 'HONEYMOON', label: '허니문' },
  { value: 'WEDDING_GIFT', label: '예물' },
  { value: 'ETC', label: '기타' },
]

export default function VendorInfoModal({ isOpen, onClose, onSubmit }: VendorInfoModalProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<VendorInfo>({
    vendorName: '',
    vendorType: '',
    businessNumber: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    description: '',
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vendorName || !formData.vendorType || !formData.contactPhone || !formData.contactEmail) {
      showToast('필수 항목을 모두 입력해주세요.', 'error')
      return
    }

    onSubmit(formData)
    // 폼 초기화
    setFormData({
      vendorName: '',
      vendorType: '',
      businessNumber: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      description: '',
    })
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="vendor-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vendor-info-modal-header">
          <h3>제휴 업체 정보 입력</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <form className="vendor-info-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="vendor-name">
              업체명 <span className="required">*</span>
            </label>
            <input
              id="vendor-name"
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleChange}
              placeholder="업체명을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendor-type">
              업체 유형 <span className="required">*</span>
            </label>
            <select
              id="vendor-type"
              name="vendorType"
              value={formData.vendorType}
              onChange={handleChange}
              required
            >
              <option value="">선택하세요</option>
              {vendorTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="business-number">사업자 등록번호</label>
            <input
              id="business-number"
              type="text"
              name="businessNumber"
              value={formData.businessNumber}
              onChange={handleChange}
              placeholder="000-00-00000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-phone">
              연락처 <span className="required">*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="010-0000-0000"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-email">
              이메일 <span className="required">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="contact@vendor.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">주소</label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="업체 주소를 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">업체 소개</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="업체에 대한 소개를 작성해주세요"
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              제출하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

