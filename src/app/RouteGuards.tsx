import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { normalizeRole, type UserRole } from '@/roles'
import { useAuthSession } from '@/app/useAuthSession'
import { ROUTES } from '@/app/routes'

export function RequireAuth() {
  const { user } = useAuthSession()
  const location = useLocation()
  if (user == null) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }
  return <Outlet />
}

export function RequireRole({ allowed }: { allowed: UserRole[] }) {
  const { user } = useAuthSession()
  const role = normalizeRole(user?.role)
  if (!allowed.includes(role)) {
    return <Navigate to={ROUTES.batons} replace />
  }
  return <Outlet />
}
