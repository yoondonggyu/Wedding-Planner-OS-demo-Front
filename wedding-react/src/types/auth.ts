export interface UserProfile {
  id: number
  nickname: string
  profileImageUrl?: string | null
  role?: string
}

export interface LoginPayload {
  email: string
  password: string
}



