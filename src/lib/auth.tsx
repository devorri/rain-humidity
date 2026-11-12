import { createContext, useContext, useState, type ReactNode } from 'react'
import { supabase, friendlyError } from './supabase'

export type Admin = { id: number; username: string }

type AuthCtx = {
  admin: Admin | null
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
}

const STORAGE_KEY = 'rh_admin'
const Ctx = createContext<AuthCtx | null>(null)

function loadSaved(): Admin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Admin) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(loadSaved)

  async function login(username: string, password: string) {
    const { data, error } = await supabase.rpc('admin_login', {
      p_username: username.trim(),
      p_password: password,
    })
    if (error) return friendlyError(error)
    const row = Array.isArray(data) ? data[0] : null
    if (!row) return 'Invalid username or password.'
    const next = { id: row.id, username: row.username } as Admin
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setAdmin(next)
    return null
  }

  function logout() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setAdmin(null)
  }

  return <Ctx.Provider value={{ admin, login, logout }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
