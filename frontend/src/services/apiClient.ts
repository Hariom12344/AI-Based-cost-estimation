const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

let accessToken = localStorage.getItem('accessToken')
let refreshToken = localStorage.getItem('refreshToken')

export const setTokens = (nextAccessToken: string | null, nextRefreshToken?: string | null) => {
  accessToken = nextAccessToken
  if (nextRefreshToken !== undefined) {
    refreshToken = nextRefreshToken
  }

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken)
  } else {
    localStorage.removeItem('accessToken')
  }

  if (nextRefreshToken !== undefined) {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
  }
}

export const clearTokens = () => setTokens(null, null)

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshToken) return null

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) {
    clearTokens()
    return null
  }

  const payload = await response.json()
  setTokens(payload.access_token)
  return payload.access_token
}

export const apiFetch = async (path: string, init: RequestInit = {}, retry = true): Promise<Response> => {
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', 'Bearer ' + accessToken)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiFetch(path, init, false)
    }
  }

  return response
}
