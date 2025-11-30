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

  const response = await fetch(url, {
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
  })

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

