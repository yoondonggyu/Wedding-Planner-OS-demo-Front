import { API_BASE_URL } from '@/config/env'

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: HeadersInit
  body?: any
  token?: string | null
  skipAuthHeader?: boolean
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const { method = 'GET', body, headers, token, skipAuthHeader } = options

  const finalHeaders = new Headers(headers ?? {})
  if (!(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  if (!skipAuthHeader && token) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  // 디버깅을 위한 로그
  if (import.meta.env.DEV) {
    console.log(`[API] ${method} ${url}`, { 
      hasToken: !!token, 
      tokenLength: token?.length || 0,
      body: body instanceof FormData ? '[FormData]' : body 
    })
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body:
        body instanceof FormData
          ? body
          : body
          ? typeof body === 'string'
            ? body
            : JSON.stringify(body)
          : undefined,
      credentials: 'include', // CORS 쿠키 포함
    })
  } catch (error) {
    // 네트워크 에러 처리
    console.error('[API Error]', error)
    if (error instanceof TypeError) {
      // CORS 에러인지 확인
      if (error.message.includes('fetch') || error.message.includes('CORS')) {
        throw new ApiError(
          '네트워크 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.',
          0,
          { error: 'Failed to fetch', originalError: error.message, url }
        )
      }
    }
    throw error
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload?.message) ||
      `API 요청 실패 (${response.status})`
    throw new ApiError(message as string, response.status, payload)
  }

  return payload as T
}

// axios 스타일 클라이언트 객체 (default export)
const apiClient = {
  async get<T = any>(endpoint: string, options: Omit<ApiFetchOptions, 'method' | 'body'> = {}) {
    const token = localStorage.getItem('wedding_token')
    const response = await apiFetch<T>(endpoint, { ...options, method: 'GET', token })
    return { data: response }
  },

  async post<T = any>(endpoint: string, body?: any, options: Omit<ApiFetchOptions, 'method' | 'body'> = {}) {
    const token = localStorage.getItem('wedding_token')
    const response = await apiFetch<T>(endpoint, { ...options, method: 'POST', body, token })
    return { data: response }
  },

  async put<T = any>(endpoint: string, body?: any, options: Omit<ApiFetchOptions, 'method' | 'body'> = {}) {
    const token = localStorage.getItem('wedding_token')
    const response = await apiFetch<T>(endpoint, { ...options, method: 'PUT', body, token })
    return { data: response }
  },

  async patch<T = any>(endpoint: string, body?: any, options: Omit<ApiFetchOptions, 'method' | 'body'> = {}) {
    const token = localStorage.getItem('wedding_token')
    const response = await apiFetch<T>(endpoint, { ...options, method: 'PATCH', body, token })
    return { data: response }
  },

  async delete<T = any>(endpoint: string, options: Omit<ApiFetchOptions, 'method' | 'body'> = {}) {
    const token = localStorage.getItem('wedding_token')
    const response = await apiFetch<T>(endpoint, { ...options, method: 'DELETE', token })
    return { data: response }
  }
}

export default apiClient

