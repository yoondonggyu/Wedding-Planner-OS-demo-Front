import React from 'react'
import './LoginRequiredModal.css'

interface LoginRequiredModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function LoginRequiredModal({ isOpen, onCancel, onConfirm }: LoginRequiredModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onCancel()
    }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="icon">🔒</div>
        <h3>로그인이 필요합니다</h3>
        <p>
          이 기능을 사용하려면 로그인이 필요합니다.
          <br />
          지금 로그인하시겠습니까?
        </p>
        <div className="actions">
          <button className="btn" type="button" onClick={onCancel}>나중에</button>
          <button className="btn primary" type="button" onClick={onConfirm}>로그인하기</button>
        </div>
      </div>
    </div>
  )
}

