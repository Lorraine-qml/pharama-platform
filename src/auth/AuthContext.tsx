import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react'
import type { AuthUser, OrgKind, UserRole } from './types'

const STORAGE_SESSION = 'pharma-platform-auth'
const STORAGE_PERSIST = 'pharma-platform-auth-persist'

const DEFAULT_USER: AuthUser = {
  role: 'platform',
  orgKind: 'physical',
  displayName: '平台管理员 · 演示全功能',
}

export type LoginPayload = { role: UserRole; orgKind: OrgKind }

function parseStored(): AuthUser | null {
  try {
    const raw =
      sessionStorage.getItem(STORAGE_SESSION) ?? localStorage.getItem(STORAGE_PERSIST)
    if (!raw) return null
    const data = JSON.parse(raw) as AuthUser
    if (!data?.role || !data?.orgKind || !data?.displayName) return null
    return data
  } catch {
    return null
  }
}

let memoryUser: AuthUser | null = parseStored() ?? DEFAULT_USER
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return memoryUser
}

function emit() {
  listeners.forEach((l) => l())
}

function persist(user: AuthUser | null, remember = false) {
  memoryUser = user
  sessionStorage.removeItem(STORAGE_SESSION)
  localStorage.removeItem(STORAGE_PERSIST)
  if (user) {
    const raw = JSON.stringify(user)
    if (remember) localStorage.setItem(STORAGE_PERSIST, raw)
    else sessionStorage.setItem(STORAGE_SESSION, raw)
  }
  emit()
}

function buildDisplayName(_orgKind: OrgKind, _role: UserRole) {
  return '平台管理员 · 演示全功能'
}

type AuthContextValue = {
  user: AuthUser | null
  login: (payload: LoginPayload, options?: { remember?: boolean }) => void
  logout: () => void
}

const AuthCtx = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, () => null)

  const login = useCallback((payload: LoginPayload, options?: { remember?: boolean }) => {
    const next: AuthUser = {
      role: payload.role,
      orgKind: payload.orgKind,
      displayName: buildDisplayName(payload.orgKind, payload.role),
    }
    persist(next, options?.remember ?? false)
  }, [])

  const logout = useCallback(() => {
    persist(DEFAULT_USER)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with AuthProvider
export function useAuth() {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
