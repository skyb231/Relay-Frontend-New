import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { normalizeRole } from '../roles'
import { useAuthSession } from '../app/AuthSessionProvider'
import { ROUTES } from '../app/routes'
import { TeamDetailView } from '../features/team-detail/TeamDetailView'
import type { TeamDetail } from '../types/domain'
import { relayService } from '../services/relayService'

export function TeamDetailPage() {
  const { id } = useParams()
  const { user: sessionUser } = useAuthSession()
  const [detail, setDetail] = useState<TeamDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const teamId = id
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const response = await relayService.getTeamDetail(teamId)
        if (!mounted) return
        setDetail(response)
        setError(null)
      } catch (loadError) {
        if (!mounted) return
        setDetail(null)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load team detail')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [id])

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
