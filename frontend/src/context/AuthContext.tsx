import { createContext, useContext, useMemo, useState } from 'react'

import { apiFetch, clearTokens, setTokens } from '../services/apiClient'
import type { LoginResponse, User } from '../types/auth'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const storedUser = localStorage.getItem('user')

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(storedUser ? JSON.parse(storedUser) : null)
  const [loading, setLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setLoading(true)
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      setLoading(false)
      throw new Error('Invalid credentials')
    }

    const payload = (await response.json()) as LoginResponse
    setTokens(payload.access_token, payload.refresh_token)
    setUser(payload.user)
    localStorage.setItem('user', JSON.stringify(payload.user))
    setLoading(false)
  }

  const logout = () => {
    clearTokens()
    setUser(null)
    localStorage.removeItem('user')
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
