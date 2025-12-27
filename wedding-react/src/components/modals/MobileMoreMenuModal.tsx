import React from 'react'
import type { SidebarLink } from '@/types/navigation'
import './MobileMoreMenuModal.css'

interface MobileMoreMenuModalProps {
  isOpen: boolean
  publicLinks: SidebarLink[]
  protectedLinks: SidebarLink[]
  isAuthenticated: boolean
  onClose: () => void
  onNavigate: (link: SidebarLink) => void
  onOpenProfile?: () => void
}

export default function MobileMoreMenuModal({
  isOpen,
  publicLinks,
  protectedLinks,
  isAuthenticated,
  onClose,
  onNavigate,
}: MobileMoreMenuModalProps) {
  if (!isOpen) return null

  const handleNavigate = (link: SidebarLink) => {
    onNavigate(link)
    onClose()
  }

  return (
    <div className="mobile-more-modal" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>메뉴</h3>
          <button className="close-btn" type="button" onClick={onClose}>✕</button>
        </div>
        
        <div className="menu-sections">
          {publicLinks.length > 0 && (
            <div className="menu-section">
              <div className="section-title">일반</div>
              {publicLinks.map((link) => (
                <button
                  key={link.label}
                  className="menu-item"
                  type="button"
                  onClick={() => handleNavigate(link)}
                >
                  <span className="menu-icon">{link.icon}</span>
                  <span className="menu-label">{link.label}</span>
                  <span className="menu-arrow">›</span>
                </button>
              ))}
            </div>
          )}

          {isAuthenticated && protectedLinks.length > 0 && (
            <div className="menu-section">
              <div className="section-title">주요 기능</div>
              {protectedLinks.map((link) => (
                <button
                  key={link.label}
                  className="menu-item"
                  type="button"
                  onClick={() => handleNavigate(link)}
                >
                  <span className="menu-icon">{link.icon}</span>
                  <span className="menu-label">{link.label}</span>
                  <span className="menu-arrow">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

