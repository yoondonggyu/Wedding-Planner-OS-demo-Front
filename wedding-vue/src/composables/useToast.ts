import { ref } from 'vue'

interface ToastOptions {
  duration?: number
  type?: 'success' | 'error' | 'info' | 'warning'
}

const toastMessage = ref<string>('')
const toastVisible = ref(false)
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('info')

type ToastPayload = Required<ToastOptions> & { message: string }

const toastQueue: ToastPayload[] = []
let hideTimeout: ReturnType<typeof setTimeout> | null = null
let resetTimeout: ReturnType<typeof setTimeout> | null = null

function processQueue() {
  if (toastVisible.value || toastQueue.length === 0) {
    return
  }

  const payload = toastQueue.shift()!
  toastMessage.value = payload.message
  toastType.value = payload.type
  toastVisible.value = true

  hideTimeout = setTimeout(() => {
    toastVisible.value = false
    hideTimeout = null

    resetTimeout = setTimeout(() => {
      toastMessage.value = ''
      resetTimeout = null
      processQueue()
    }, 250)
  }, payload.duration)
}

export function useToast() {
  function showToast(message: string, options: ToastOptions = {}) {
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
  }

  function showSuccess(message: string, duration?: number) {
    showToast(message, { type: 'success', duration })
  }

  function showError(message: string, duration?: number) {
    showToast(message, { type: 'error', duration })
  }

  function showInfo(message: string, duration?: number) {
    showToast(message, { type: 'info', duration })
  }

  function showWarning(message: string, duration?: number) {
    showToast(message, { type: 'warning', duration })
  }

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

