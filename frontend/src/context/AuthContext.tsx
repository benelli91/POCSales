import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, TOKEN_KEY, type User } from '../api/client'

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (orgName: string, email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false)
      return
    }
    try {
      const u = await api.get<User>('/me')
      setUser(u)
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, res.token)
    setUser(res.user)
  }

  const register = async (organization_name: string, email: string, password: string, name: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', {
      organization_name,
      email,
      password,
      name,
    })
    localStorage.setItem(TOKEN_KEY, res.token)
    setUser(res.user)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
