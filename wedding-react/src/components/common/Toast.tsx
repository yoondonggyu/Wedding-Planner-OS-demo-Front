import React from 'react'
import { useToast } from '@/hooks/useToast'
import './Toast.css'

export default function Toast() {
  const { toastMessage, toastVisible, toastType } = useToast()

  if (!toastVisible) return null

  const getIcon = () => {
    switch (toastType) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={`toast toast-${toastType}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{toastMessage}</span>
    </div>
  )
}

