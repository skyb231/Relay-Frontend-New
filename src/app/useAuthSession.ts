import { useContext } from 'react'
import { AuthSessionContext } from './AuthSessionProvider'

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext)
  if (ctx == null) {
    throw new Error('useAuthSession must be used within AuthSessionProvider.')
  }
  return ctx
}

