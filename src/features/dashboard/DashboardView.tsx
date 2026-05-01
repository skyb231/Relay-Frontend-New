import { Navigate } from 'react-router-dom'
import { canAccessResilienceDashboard, normalizeRole } from '../../roles'
import { useAuthSession } from '../../app/useAuthSession'
import { ROUTES } from '../../app/routes'
import { Select } from '../../components/ui/Select'
import { DashboardSummaryCards } from './DashboardSummaryCards'
import { TeamsAtRiskTable } from './TeamsAtRiskTable'
import { useDashboardData } from './useDashboardData'

export function DashboardView() {
  const { user } = useAuthSession()
  const role = normalizeRole(user?.role)
  const lockedDivisionId = role === 'team_lead' ? user?.division_id ?? null : null
  const lockedTeamId =
    role === 'team_lead' && lockedDivisionId == null && user?.team_id != null
      ? String(user.team_id)
      : null

  const {
    loading,
    divisionFilter,
    setDivisionFilter,
    divisionOptions,
    filteredTeams,
    summaryCards,
    divisionFilterLocked,
  } = useDashboardData({ lockedDivisionId, lockedTeamId })

  if (!canAccessResilienceDashboard(role)) {
    return <Navigate to={ROUTES.batons} replace />
  }

  return (
    <div className="space-y-5">
      {divisionFilterLocked ? (
        <p className="text-sm font-medium text-slate-800">
          Division: <span className="text-slate-600">{divisionOptions[0] ?? '—'}</span>
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
          <Select
            className="h-8 px-2 py-1 text-xs"
            value={divisionFilter}
            onChange={(event) => setDivisionFilter(event.target.value)}
          >
            {divisionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      )}

      {loading ? <p className="text-sm text-slate-500">Loading dashboard data...</p> : null}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Key metrics</h2>
        <div className="mt-3">
          <DashboardSummaryCards summaryCards={summaryCards} />
        </div>
      </div>

      <TeamsAtRiskTable teams={filteredTeams} />
    </div>
  )
}
