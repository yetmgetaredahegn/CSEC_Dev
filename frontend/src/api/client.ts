export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL

const ACCESS_TOKEN_KEY = 'csec_access_token'
const REFRESH_TOKEN_KEY = 'csec_refresh_token'

export const tokenStore = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

async function refreshAccessToken() {
  const refresh = tokenStore.getRefreshToken()
  if (!refresh) {
    return null
  }

  const response = await fetch(`${API_BASE_URL}/auth/jwt/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) {
    tokenStore.clear()
    return null
  }

  const data = await response.json()
  if (data?.access) {
    tokenStore.setTokens(data.access, refresh)
    return data.access as string
  }

  return null
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  const isFormData = options.body instanceof FormData
  if (!isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  const access = tokenStore.getAccessToken()
  if (access) {
    headers.set('Authorization', `Bearer ${access}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && retry) {
    const newAccess = await refreshAccessToken()
    if (newAccess) {
      return apiRequest(path, options, false)
    }
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiLogin(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/jwt/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Login failed')
  }

  return response.json() as Promise<{ access: string; refresh: string }>
}

export async function apiRegister(email: string, username: string, password: string) {
  return apiRequest('/auth/users/', {
    method: 'POST',
    body: JSON.stringify({ email, username, password, re_password: password }),
  })
}

export function getWebSocketUrl(path: string) {
  if (WS_BASE_URL) {
    return `${WS_BASE_URL}${path}`
  }

  const base = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')
  return `${base}${path}`
}

export async function apiFetchDocuments() {
  return apiRequest<
    Array<{
      id: number
      title: string
      file: string
      processed: boolean
      created_at: string
    }>
  >('/api/documents/')
}

export async function apiUploadDocument(title: string, file: File) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('file', file)

  return apiRequest('/api/documents/', {
    method: 'POST',
    body: formData,
  })
}

export async function apiDeleteDocument(id: number) {
  return apiRequest(`/api/documents/${id}/`, {
    method: 'DELETE',
  })
}

export async function apiFetchChatSessions() {
  return apiRequest<
    Array<{
      id: number
      created_at: string
      last_message?: { role: string; content: string; timestamp: string } | null
    }>
  >('/api/chat/sessions/')
}

export async function apiFetchChatSessionDetail(id: number) {
  return apiRequest<{
    id: number
    created_at: string
    messages: Array<{ id: number; role: string; content: string; timestamp: string }>
  }>(`/api/chat/sessions/${id}/`)
}
