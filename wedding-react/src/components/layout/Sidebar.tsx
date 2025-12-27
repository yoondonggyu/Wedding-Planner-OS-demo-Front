import React, { useState } from 'react'
import type { SidebarLink } from '@/types/navigation'
import logoImage from '@/assets/logo.png'
import './Sidebar.css'

interface SidebarProps {
  collapsed: boolean
  publicLinks: SidebarLink[]
  protectedLinks: SidebarLink[]
  currentUser?: { nickname: string; profileImageUrl?: string | null } | null
  onToggle: () => void
  onNavigate: (link: SidebarLink) => void
  onOpenProfile: () => void
}

export default function Sidebar({
  collapsed,
  publicLinks,
  protectedLinks,
  currentUser,
  onToggle,
  onNavigate,
  onOpenProfile,
}: SidebarProps) {
  const [isHoveringButton, setIsHoveringButton] = useState(false)

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isHoveringButton && collapsed ? 'button-hover' : ''}`}>
      <div className="sidebar-header">
        <img src={logoImage} alt="PromiseMarry Lab Logo" className="logo-image" />
        <strong>PromiseMarry Lab</strong>
        <button
          className="sidebar-expand-btn"
          type="button"
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          onClick={onToggle}
          onMouseEnter={() => setIsHoveringButton(true)}
          onMouseLeave={() => setIsHoveringButton(false)}
        >
          <span className="arrow" aria-hidden="true">{collapsed ? '»' : '«'}</span>
        </button>
      </div>

      <nav className="sidebar-menu">
        {publicLinks.map((item) => (
          <button
            key={item.label}
            className={`sidebar-menu-item ${item.active ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate(item)}
          >
            <span className="icon">{item.icon}</span>
            <span className="text">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-divider"></div>

      <nav className="sidebar-menu">
        <div className="sidebar-section-title">주요 기능</div>
        {protectedLinks.map((item) => (
          <button
            key={item.label}
            className={`sidebar-menu-item ${item.active ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate(item)}
          >
            <span className="icon">{item.icon}</span>
            <span className="text">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-menu" style={{ marginTop: 'auto', paddingTop: 0 }}>
        {currentUser && (
          <button
            className="sidebar-menu-item"
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={onOpenProfile}
          >
            <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentUser.profileImageUrl ? (
                <img
                  src={currentUser.profileImageUrl}
                  alt="프로필"
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span>👤</span>
              )}
            </span>
            <span className="text">{currentUser.nickname}님</span>
          </button>
        )}
      </div>
    </aside>
  )
}

