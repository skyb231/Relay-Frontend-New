import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from '@/types/domain'
import { sessionService } from '@/services/sessionService'

type AuthSessionContextValue = {
  user: AuthUser | null
  setUser: (next: AuthUser) => void
  clearUser: () => void
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)
export { AuthSessionContext }

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => sessionService.getCurrentUser())

  const setUser = useCallback((next: AuthUser) => {
    sessionService.setCurrentUser(next)
    setUserState(next)
  }, [])

  const clearUser = useCallback(() => {
    sessionService.clearCurrentUser()
    setUserState(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      clearUser,
    }),
    [clearUser, setUser, user],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}
