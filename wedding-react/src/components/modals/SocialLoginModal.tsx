import React from 'react'
import './SocialLoginModal.css'

interface SocialLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onKakaoLogin: () => void
  onGoogleLogin: () => void
}

export default function SocialLoginModal({ isOpen, onClose, onKakaoLogin, onGoogleLogin }: SocialLoginModalProps) {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="social-login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="social-login-modal-header">
          <h3>로그인 방법 선택</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="social-login-content">
          <p className="social-login-description">
            소셜 로그인을 통해 간편하게 시작하세요
          </p>
          <div className="social-login-buttons">
            <button className="social-login-btn kakao-btn" onClick={onKakaoLogin}>
              <span className="social-icon">💬</span>
              <span>카카오 로그인</span>
            </button>
            <button className="social-login-btn google-btn" onClick={onGoogleLogin}>
              <span className="social-icon">G</span>
              <span>Sign in with Google</span>
            </button>
          </div>
          <div className="social-login-divider">
            <span>또는</span>
          </div>
          <p className="social-login-note">
            소셜 로그인을 사용하면 빠르고 안전하게 서비스를 이용할 수 있습니다.
            <br />
            회원가입 시 예비 부부 또는 제휴 업체 중 선택할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}

