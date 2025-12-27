import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  isAuthenticated: boolean
  hydrate: () => void
  openLoginModal: () => void
  closeLoginModal: () => void
  setSession: (data: {
    accessToken?: string | null
    refreshToken?: string | null
    user?: UserProfile | null
  }) => void
  logout: () => void
  login: (payload: LoginPayload) => Promise<void>
  tryRefreshToken: () => Promise<boolean>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loginModalOpen: false,
      loading: false,
      error: null,
      isAuthenticated: false,

      hydrate: () => {
        // Zustand persist middleware가 자동으로 처리
        const state = get()
        const newIsAuthenticated = Boolean(state.user && state.accessToken)
        // 값이 변경된 경우에만 업데이트
        if (state.isAuthenticated !== newIsAuthenticated) {
          set({ isAuthenticated: newIsAuthenticated })
        }
      },

      openLoginModal: () => {
        set({ loginModalOpen: true, error: null })
      },

      closeLoginModal: () => {
        set({ loginModalOpen: false, error: null })
      },

      setSession: (data) => {
        const updates: Partial<AuthState> = {}
        if (data.accessToken !== undefined) {
          updates.accessToken = data.accessToken
        }
        if (data.refreshToken !== undefined) {
          updates.refreshToken = data.refreshToken ?? null
        }
        if (data.user !== undefined) {
          updates.user = data.user
          console.log('setSession - 사용자 정보 업데이트:', data.user)
        }
        updates.isAuthenticated = Boolean(updates.user || get().user) && Boolean(updates.accessToken || get().accessToken)
        set(updates)
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      login: async (payload: LoginPayload) => {
        set({ loading: true, error: null })
        try {
          const response = await loginRequest(payload)
          const data = response.data
          const user: UserProfile = {
            id: data.user_id,
            nickname: data.nickname,
            profileImageUrl: data.profile_image_url,
            role: data.role,
          }
          get().setSession({
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? null,
            user,
          })
          set({ loginModalOpen: false })
        } catch (error) {
          if (error instanceof ApiError) {
            set({ error: error.message })
          } else {
            set({ error: '로그인 중 오류가 발생했습니다.' })
          }
          throw error
        } finally {
          set({ loading: false })
        }
      },

      tryRefreshToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          return false
        }
        try {
          const response = await refreshTokenRequest(refreshToken)
          const data = response.data
          get().setSession({
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
          })
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      refreshUser: async () => {
        // 사용자 정보를 다시 가져오는 로직
        const userRaw = localStorage.getItem('wedding_user')
        if (userRaw) {
          const user = JSON.parse(userRaw) as UserProfile
          get().setSession({ user })
        }
      },
    }),
    {
      name: 'wedding-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

