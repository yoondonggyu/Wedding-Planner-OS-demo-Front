import { defineStore } from 'pinia'
import type { LoginPayload, UserProfile } from '@/types/auth'
import { loginRequest, refreshTokenRequest } from '@/services/authService'
import { ApiError } from '@/services/apiClient'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  loginModalOpen: boolean
  loading: boolean
  error: string | null
}

const ACCESS_KEY = 'wedding_access_token'
const REFRESH_KEY = 'wedding_refresh_token'
const USER_KEY = 'wedding_user'

function persist(key: string, value: string | null) {
  if (value) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    loginModalOpen: false,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && state.accessToken),
  },
  actions: {
    hydrate() {
      this.accessToken = localStorage.getItem(ACCESS_KEY)
      this.refreshToken = localStorage.getItem(REFRESH_KEY)
      const userRaw = localStorage.getItem(USER_KEY)
      this.user = userRaw ? (JSON.parse(userRaw) as UserProfile) : null
    },
    openLoginModal() {
      this.loginModalOpen = true
      this.error = null
    },
    closeLoginModal() {
      this.loginModalOpen = false
      this.error = null
    },
    setSession(data: {
      accessToken?: string | null
      refreshToken?: string | null
      user?: UserProfile | null
    }) {
      if (data.accessToken !== undefined) {
        this.accessToken = data.accessToken
        persist(ACCESS_KEY, data.accessToken)
      }
      if (data.refreshToken !== undefined) {
        this.refreshToken = data.refreshToken ?? null
        persist(REFRESH_KEY, this.refreshToken)
      }
      if (data.user !== undefined) {
        this.user = data.user
        persist(USER_KEY, data.user ? JSON.stringify(data.user) : null)
        console.log('setSession - 사용자 정보 업데이트:', this.user)
      }
    },
    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      persist(ACCESS_KEY, null)
      persist(REFRESH_KEY, null)
      persist(USER_KEY, null)
    },
    async login(payload: LoginPayload) {
      this.loading = true
      this.error = null
      try {
        const response = await loginRequest(payload)
        const data = response.data
        const user: UserProfile = {
          id: data.user_id,
          nickname: data.nickname,
          profileImageUrl: data.profile_image_url,
        }
        this.setSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? null,
          user,
        })
        this.loginModalOpen = false
      } catch (error) {
        if (error instanceof ApiError) {
          this.error = error.message
        } else {
          this.error = '로그인 중 오류가 발생했습니다.'
        }
        throw error
      } finally {
        this.loading = false
      }
    },
    async tryRefreshToken() {
      if (!this.refreshToken) {
        return false
      }
      try {
        const response = await refreshTokenRequest(this.refreshToken)
        const data = response.data
        this.setSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? this.refreshToken,
        })
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },
    async refreshUser() {
      // 사용자 정보를 다시 가져오는 로직
      // 현재는 로컬 스토리지의 사용자 정보를 업데이트하는 것으로 대체
      // 실제로는 API를 호출하여 최신 사용자 정보를 가져와야 함
      const userRaw = localStorage.getItem(USER_KEY)
      if (userRaw) {
        this.user = JSON.parse(userRaw) as UserProfile
      }
    },
  },
})

