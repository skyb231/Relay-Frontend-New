import { NavLink } from 'react-router-dom'
import { normalizeRole, showBatonBoardNav, showResilienceDashboardNav } from '../../roles'
import { ROUTES } from '../../app/routes'
import { useAuthSession } from '../../app/AuthSessionProvider'
import { ProfileMenu } from './ProfileMenu'

export function Navbar() {
  const { user } = useAuthSession()
  const role = normalizeRole(user?.role)

  const links: Array<{ to: string; label: string }> = []
  if (showBatonBoardNav(role)) {
    links.push({ to: ROUTES.batons, label: 'Baton Board' })
  }
  if (showResilienceDashboardNav(role)) {
    links.push({ to: ROUTES.resilienceDashboard, label: 'Resilience Dashboard' })
  }

  return (
    <header className="border-b border-white/10 bg-[var(--relay-navy)] shadow-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 md:px-6">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold tracking-tight text-white">Relay</h1>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <ProfileMenu />
      </div>
    </header>
  )
}
