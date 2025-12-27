import React, { useState, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import './CoupleInviteModal.css'

interface CoupleInviteModalProps {
  isOpen: boolean
  onClose: () => void
  coupleKey: string | null
  userGender: 'BRIDE' | 'GROOM' | null
}

export default function CoupleInviteModal({
  isOpen,
  onClose,
  coupleKey,
  userGender,
}: CoupleInviteModalProps) {
  const { request } = useApi()
  const { showToast } = useToast()
  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [connectionMessageType, setConnectionMessageType] = useState<'success' | 'error' | 'info'>('info')

  const partnerGenderLabel = useMemo(() => {
    if (userGender === 'BRIDE') return '신랑'
    if (userGender === 'GROOM') return '신부'
    return '파트너'
  }, [userGender])

  const inviteLink = useMemo(() => {
    if (!coupleKey) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}?invite=${coupleKey}`
  }, [coupleKey])

  if (!isOpen) return null

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      showToast('초대 링크가 복사되었습니다!', 'success')
    }
  }

  const copyKey = () => {
    if (coupleKey) {
      navigator.clipboard.writeText(coupleKey)
      showToast('커플 키가 복사되었습니다!', 'success')
    }
  }

  const enterPartnerCode = async () => {
    if (!partnerCodeInput.trim()) {
      setConnectionMessage('코드를 입력해주세요.')
      setConnectionMessageType('error')
      return
    }

    setIsConnecting(true)
    setConnectionMessage('')

    try {
      await request('/couple/connect', {
        method: 'POST',
        body: {
          partner_couple_key: partnerCodeInput.trim().toUpperCase(),
        },
      })

      setConnectionMessage('연결 요청이 전송되었습니다! 상대방도 당신의 코드를 입력하면 연결이 완료됩니다.')
      setConnectionMessageType('success')
      setPartnerCodeInput('')
    } catch (error: any) {
      console.error('커플 연결 오류:', error)
      if (error?.data?.error) {
        setConnectionMessage(error.data.error)
      } else {
        setConnectionMessage('연결에 실패했습니다. 코드를 확인해주세요.')
      }
      setConnectionMessageType('error')
    } finally {
      setIsConnecting(false)
    }
  }

  const hideToday = () => {
    localStorage.setItem('hideCoupleInviteModal', new Date().toDateString())
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="couple-invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💕 {partnerGenderLabel} 초대하기</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="invite-description">
            {partnerGenderLabel}을 초대하여 커플 기능을 사용해보세요!
          </p>
          
          <div className="invite-section">
            <label>초대 링크</label>
            <div className="link-box">
              <code className="invite-link">{inviteLink}</code>
              <button className="btn-copy" onClick={copyLink}>
                복사
              </button>
            </div>
          </div>
          
          <div className="invite-section">
            <label>또는 커플 키</label>
            <div className="link-box">
              <code className="couple-key">{coupleKey}</code>
              <button className="btn-copy" onClick={copyKey}>
                복사
              </button>
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="enter-code-section">
            <h4>내 반쪽 코드 입력하기</h4>
            <p className="enter-code-description">
              상대방의 코드를 입력하면 서로 매칭됩니다. 상대방도 당신의 코드를 입력해야 연결이 완료됩니다.
            </p>
            <div className="code-input-box">
              <input
                type="text"
                value={partnerCodeInput}
                onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                placeholder="상대방의 코드를 입력하세요"
                className="code-input"
                maxLength={8}
              />
              <button
                className="btn-connect"
                onClick={enterPartnerCode}
                disabled={!partnerCodeInput.trim() || isConnecting}
              >
                {isConnecting ? '연결 중...' : '입력하기'}
              </button>
            </div>
            {connectionMessage && (
              <div className={`connection-message ${connectionMessageType}`}>
                {connectionMessage}
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            <button className="btn-secondary" onClick={hideToday}>
              오늘 하루 그만 보기
            </button>
            <button className="btn-primary" onClick={onClose}>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

