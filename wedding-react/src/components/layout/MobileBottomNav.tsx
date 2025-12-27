import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { SidebarLink } from '@/types/navigation'
import './MobileBottomNav.css'

interface MobileBottomNavProps {
  publicLinks: SidebarLink[]
  protectedLinks: SidebarLink[]
  currentUser?: { nickname: string; profileImageUrl?: string | null } | null
  onNavigate: (link: SidebarLink) => void
  onOpenProfile: () => void
  onOpenAIMenu?: () => void
}

export default function MobileBottomNav({
  publicLinks,
  protectedLinks,
  currentUser,
  onNavigate,
  onOpenProfile,
  onOpenAIMenu,
}: MobileBottomNavProps) {
  const location = useLocation()

  const mobileMenuItems = useMemo(() => {
    return [
      { label: '홈', icon: '🏠', route: '/' },
      { label: '게시판', icon: '📋', route: '/board' },
      { label: 'AI', icon: '🤖', route: '/ai', isAIMenu: true },
      { label: '업체 예약', icon: '📅', route: '/vendor-message' },
      { label: '추천 업체', icon: '💍', route: '/vendor' },
    ]
  }, [])

  const isActive = (link: SidebarLink & { isAIMenu?: boolean }) => {
    if (link.route) {
      if (link.isAIMenu) {
        return ['/invitation-design', '/chat', '/document-vault'].includes(location.pathname)
      }
      if (link.route === '/vendor-message') {
        return location.pathname === '/vendor-message'
      }
      return location.pathname === link.route
    }
    return false
  }

  const handleClick = (link: SidebarLink & { isAIMenu?: boolean }) => {
    console.log('메뉴 클릭:', link.label, link)
    if (link.isAIMenu) {
      // AI 메뉴 클릭 시 서브메뉴 표시
      console.log('AI 메뉴 클릭됨 - 서브메뉴 열기')
      if (onOpenAIMenu) {
        onOpenAIMenu()
      }
    } else if (link.isMoreMenu) {
      // 더보기 메뉴 처리
    } else {
      onNavigate(link)
    }
  }

  return (
    <nav className="mobile-bottom-nav">
      {mobileMenuItems.map((item) => (
        <button
          key={item.label}
          className={`nav-item ${isActive(item) ? 'active' : ''}`}
          type="button"
          onClick={() => handleClick(item)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

