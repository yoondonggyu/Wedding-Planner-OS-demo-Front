export interface UserProfile {
  id: number
  nickname: string
  profileImageUrl?: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

