import { apiFetch, ApiError, type ApiFetchOptions } from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'

export function useApi() {
  const authStore = useAuthStore()

  async function request<T = any>(endpoint: string, options: ApiFetchOptions = {}) {
    const token = options.skipAuthHeader ? null : authStore.accessToken
    try {
      return await apiFetch<T>(endpoint, { ...options, token })
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        !options.skipAuthHeader &&
        authStore.refreshToken
      ) {
        const refreshed = await authStore.tryRefreshToken()
        if (refreshed && authStore.accessToken) {
          return apiFetch<T>(endpoint, { ...options, token: authStore.accessToken })
        }
      }
      throw error
    }
  }

  return { request }
}

