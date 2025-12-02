import { apiFetch } from './apiClient'
import type { LoginPayload } from '@/types/auth'

interface LoginResponse {
  message: string
  data: {
    access_token: string
    refresh_token?: string | null
    token_type: string
    user_id: number
    nickname: string
    profile_image_url?: string | null
    role?: string
  }
}

interface RefreshResponse {
  message: string
  data: {
    access_token: string
    refresh_token?: string | null
  }
}

export function loginRequest(payload: LoginPayload) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuthHeader: true,
  })
}

export function refreshTokenRequest(refreshToken: string) {
  return apiFetch<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
    skipAuthHeader: true,
  })
}

interface SignupPayload {
  email: string
  password: string
  password_check: string
  nickname: string
  profile_image_url: string
}

interface SignupResponse {
  message: string
  data: {
    user_id: number
  }
}

export function signupRequest(payload: SignupPayload) {
  return apiFetch<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: payload,
    skipAuthHeader: true,
  })
}

