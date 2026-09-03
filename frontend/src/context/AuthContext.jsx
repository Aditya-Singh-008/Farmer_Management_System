import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('sfms_token') || sessionStorage.getItem('sfms_token')
    const stored = localStorage.getItem('sfms_user') || sessionStorage.getItem('sfms_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        clearSession()
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password)
    if (res.success && res.session) {
      const token = res.session.access_token
      const userData = res.user || res.session.user
      localStorage.setItem('sfms_token', token)
      localStorage.setItem('sfms_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    }
    return { success: false, error: res.error || 'Login failed' }
  }, [])

  const signup = useCallback(async (first_name, last_name, email, password) => {
    const res = await api.signup(first_name, last_name, email, password)
    if (res.success) {
      // Auto-login after signup
      return await login(email, password)
    }
    return { success: false, error: res.error || 'Signup failed' }
  }, [login])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    window.location.href = '/login'
  }, [])

  function clearSession() {
    localStorage.removeItem('sfms_token')
    localStorage.removeItem('sfms_user')
    sessionStorage.removeItem('sfms_token')
    sessionStorage.removeItem('sfms_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
