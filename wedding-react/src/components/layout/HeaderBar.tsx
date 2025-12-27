import React from 'react'
import logoImage from '@/assets/logo.png'
import './HeaderBar.css'

interface HeaderBarProps {
  theme: 'dark' | 'light'
  isAuthenticated: boolean
  nickname?: string
  profileImageUrl?: string | null
  showContactButton?: boolean
  onLogin: () => void
  onNavigate: (href: string) => void
  onLogout: () => void
  onOpenProfile: () => void
  onOpenContact: () => void
}

export default function HeaderBar({
  theme,
  isAuthenticated,
  nickname,
  profileImageUrl,
  showContactButton = true,
  onLogin,
  onNavigate,
  onLogout,
  onOpenProfile,
  onOpenContact,
}: HeaderBarProps) {
  return (
    <header>
      <div className="container nav">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logoImage} alt="PromiseMarry Lab Logo" className="logo-image" />
          <strong>PromiseMarry Lab</strong>
        </div>
        <div className="header-actions">
          {showContactButton && (
            <button
              className="btn mobile-hide"
              type="button"
              onClick={onOpenContact}
            >
              <span className="btn-text">✉️ 문의하기</span>
            </button>
          )}
          <div className="action-group">
            {!isAuthenticated ? (
              <button
                className="btn primary"
                type="button"
                onClick={onLogin}
              >
                로그인
              </button>
            ) : (
              <div className="user-section">
                <button
                  type="button"
                  className="profile-btn"
                  onClick={onOpenProfile}
                >
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="프로필"
                      className="profile-image"
                    />
                  ) : (
                    <span className="profile-icon">👤</span>
                  )}
                  <span className="profile-name">{nickname}님</span>
                </button>
                <button className="btn logout-btn" type="button" onClick={onLogout}>
                  <span className="btn-text">로그아웃</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

