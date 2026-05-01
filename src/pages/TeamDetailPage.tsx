import { Navigate, useParams } from 'react-router-dom'
import { normalizeRole } from '../roles'
import { useAuthSession } from '../app/useAuthSession'
import { ROUTES } from '../app/routes'
import { TeamDetailView } from '../features/team-detail/TeamDetailView'
import { useTeamDetail } from '../features/team-detail/hooks/useTeamDetail'

export function TeamDetailPage() {
  const { id } = useParams()
  const { user: sessionUser } = useAuthSession()
  const { detail, error, loading } = useTeamDetail(id)

  if (loading) {
    return <p className="text-sm text-slate-500">Loading team detail...</p>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Team detail unavailable right now.
      </div>
    )
  }

  if (!detail) {
    return <p className="text-sm text-slate-500">No team detail available.</p>
  }

  const sessionRole = normalizeRole(sessionUser?.role)
  if (
    sessionRole === 'team_lead' &&
    sessionUser?.division_id != null &&
    detail.divisionId != null &&
    detail.divisionId !== sessionUser.division_id
  ) {
    return <Navigate to={ROUTES.resilienceDashboard} replace />
  }

  return <TeamDetailView detail={detail} />
}
