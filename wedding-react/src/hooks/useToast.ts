import { useState, useCallback } from 'react'

interface ToastOptions {
  duration?: number
  type?: 'success' | 'error' | 'info' | 'warning'
}

type ToastPayload = Required<ToastOptions> & { message: string }

let toastQueue: ToastPayload[] = []
let hideTimeout: ReturnType<typeof setTimeout> | null = null
let resetTimeout: ReturnType<typeof setTimeout> | null = null

let setToastMessage: ((msg: string) => void) | null = null
let setToastVisible: ((visible: boolean) => void) | null = null
let setToastType: ((type: 'success' | 'error' | 'info' | 'warning') => void) | null = null

function processQueue() {
  if (!setToastVisible || !setToastMessage || !setToastType) {
    return
  }

  if (toastQueue.length === 0) {
    return
  }

  const payload = toastQueue.shift()!
  setToastMessage(payload.message)
  setToastType(payload.type)
  setToastVisible(true)

  hideTimeout = setTimeout(() => {
    setToastVisible?.(false)
    hideTimeout = null

    resetTimeout = setTimeout(() => {
      setToastMessage?.('')
      resetTimeout = null
      processQueue()
    }, 250)
  }, payload.duration)
}

export function useToast() {
  const [toastMessage, setToastMessageState] = useState<string>('')
  const [toastVisible, setToastVisibleState] = useState(false)
  const [toastType, setToastTypeState] = useState<'success' | 'error' | 'info' | 'warning'>('info')

  // 전역 함수에 setter 등록
  setToastMessage = setToastMessageState
  setToastVisible = setToastVisibleState
  setToastType = setToastTypeState

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const { duration = 3000, type = 'info' } = options

    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    if (resetTimeout) {
      clearTimeout(resetTimeout)
      resetTimeout = null
    }

    toastQueue.push({ message, duration, type })
    processQueue()
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'success', duration })
  }, [showToast])

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'error', duration })
  }, [showToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'info', duration })
  }, [showToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'warning', duration })
  }, [showToast])

  return {
    toastMessage,
    toastVisible,
    toastType,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }
}

