import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { apiLogin, apiRegister, tokenStore } from '../api/client'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(tokenStore.getAccessToken()))

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiLogin(username, password)
    tokenStore.setTokens(data.access, data.refresh)
    setIsAuthenticated(true)
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    await apiRegister(email, username, password)
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, login, register, logout }),
    [isAuthenticated, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
