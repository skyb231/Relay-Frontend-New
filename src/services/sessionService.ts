import type { AuthUser } from '../types/domain'

const SESSION_KEY = 'relay.currentUser'

export const sessionService = {
  setCurrentUser(user: AuthUser) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  },
  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },
  clearCurrentUser() {
    localStorage.removeItem(SESSION_KEY)
  },
}
