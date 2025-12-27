import React, { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import './ContactModal.css'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setName('')
    setEmail('')
    setMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('모든 필드를 입력해주세요.', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      showToast('문의가 전송되었습니다. 감사합니다!', 'success')
      onClose()
      resetForm()
    } catch (error) {
      console.error('문의 전송 오류:', error)
      showToast('문의 전송 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const fillSample = () => {
    setName('김웨딩')
    setEmail('wedding@example.com')
    setMessage('AI 일정 추천 베타 테스트 참여를 희망합니다.')
  }

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) handleClose()
    }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <p className="modal-label">CONTACT</p>
            <h3>문의하기</h3>
          </div>
          <button className="icon-btn" type="button" onClick={handleClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <p className="description">
          테스트 유저, 제휴, 제품 문의 등 무엇이든 남겨주세요. 1 영업일 내 회신 드립니다.
        </p>

        <form onSubmit={handleSubmit} className="contact-form">
          <label>
            <span>이름</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </label>

          <label>
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </label>

          <label>
            <span>문의 내용</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="문의/협업 내용을 입력해주세요"
              required
            />
          </label>

          <div className="actions">
            <button className="btn" type="button" onClick={fillSample}>
              샘플 채우기
            </button>
            <button className="btn primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '전송 중...' : '문의하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

