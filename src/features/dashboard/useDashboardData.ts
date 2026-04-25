import { useEffect, useMemo, useState } from 'react'
import { relayService } from '../../services/relayService'
import type { DivisionRisk, TeamRisk } from '../../types/domain'
import { ALL_DIVISIONS_OPTION } from './dashboard.constants'

function continuityRiskLabel(score: number): string {
  if (score >= 70) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}

type UseDashboardDataOptions = {
  /** When set (e.g. team lead), only that division’s teams and metrics are shown. */
  lockedDivisionId?: number | null
  /** When division_id is absent, derive division from this team after teams load. */
  lockedTeamId?: string | null
}

type ResolvedDivisionLock =
  | { pending: true; label: string }
  | {
      pending: false
      divisionId: number | null
      divisionName: string
      label: string
    }

export function useDashboardData(options?: UseDashboardDataOptions) {
  const lockedDivisionId = options?.lockedDivisionId ?? null
  const lockedTeamId = options?.lockedTeamId ?? null

  const [teams, setTeams] = useState<TeamRisk[]>([])
  const [divisions, setDivisions] = useState<DivisionRisk[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [divisionFilter, setDivisionFilter] = useState<string>(ALL_DIVISIONS_OPTION)

  const resolvedLock = useMemo((): ResolvedDivisionLock | null => {
    if (lockedDivisionId != null) {
      const row = divisions.find((d) => d.division_id === lockedDivisionId)
      return {
        pending: false,
        divisionId: lockedDivisionId,
        divisionName: row?.division_name ?? '',
        label: row?.division_name ?? '—',
      }
    }
    if (lockedTeamId != null) {
      const t = teams.find((x) => x.id === lockedTeamId)
      if (!t) {
        return { pending: true, label: 'Loading…' }
      }
      return {
        pending: false,
        divisionId: t.divisionId ?? null,
        divisionName: t.division,
        label: t.division,
      }
    }
    return null
  }, [lockedDivisionId, lockedTeamId, divisions, teams])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [divisionRows, teamRows] = await Promise.all([
          relayService.getDivisionRisk(),
          relayService.getTeamsAtRisk(),
        ])
        if (!mounted) return
        setDivisions(divisionRows)
        setTeams(teamRows)
        setError(null)
      } catch (loadError) {
        if (!mounted) return
        setDivisions([])
        setTeams([])
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data')
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
  }, [])

  useEffect(() => {
    if (resolvedLock == null || resolvedLock.pending) return
    setDivisionFilter(resolvedLock.label)
  }, [resolvedLock])

  const divisionOptions = useMemo(() => {
    if (resolvedLock != null) {
      return [resolvedLock.label]
    }
    const fromDivisions = divisions.map((division) => division.division_name)
    const fromTeams = teams.map((team) => team.division)
    const unique = [...new Set([...fromDivisions, ...fromTeams])].sort()
    return [ALL_DIVISIONS_OPTION, ...unique]
  }, [divisions, teams, resolvedLock])

  const filteredTeams = useMemo(() => {
    if (resolvedLock != null && !resolvedLock.pending) {
      if (resolvedLock.divisionId != null) {
        return teams.filter((team) => team.divisionId === resolvedLock.divisionId)
      }
      return teams.filter((team) => team.division === resolvedLock.divisionName)
    }
    if (divisionFilter === ALL_DIVISIONS_OPTION) {
      return teams
    }

    return teams.filter((team) => team.division === divisionFilter)
  }, [divisionFilter, teams, resolvedLock])

  const teamsSortedByRisk = useMemo(() => {
    const score = (t: TeamRisk) => {
      const n = Number.parseFloat(String(t.riskScore))
      return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY
    }
    return [...filteredTeams].sort((a, b) => score(b) - score(a))
  }, [filteredTeams])

  const summaryCards = useMemo<Array<{ label: string; value: string }>>(() => {
    let relevantDivisions: DivisionRisk[]
    if (resolvedLock != null && !resolvedLock.pending) {
      if (resolvedLock.divisionId != null) {
        relevantDivisions = divisions.filter((division) => division.division_id === resolvedLock.divisionId)
      } else {
        relevantDivisions = divisions.filter(
          (division) => division.division_name === resolvedLock.divisionName,
        )
      }
    } else if (divisionFilter === ALL_DIVISIONS_OPTION) {
      relevantDivisions = divisions
    } else {
      relevantDivisions = divisions.filter((division) => division.division_name === divisionFilter)
    }

    if (relevantDivisions.length === 0) {
      return [
        { label: 'Staff availability', value: '—' },
        { label: 'Awaiting handover batons', value: '—' },
        { label: 'At-risk batons', value: '—' },
        { label: 'Continuity risk', value: '—' },
      ]
    }

    const count = relevantDivisions.length
    const avgStaffAvailability = Math.round(
      relevantDivisions.reduce((sum, division) => sum + division.staff_availability_percentage, 0) / count,
    )
    const awaitingHandover = relevantDivisions.reduce((sum, division) => sum + division.batons_ready_for_handover, 0)
    const atRiskBatons = relevantDivisions.reduce((sum, division) => sum + division.batons_unassigned, 0)
    const avgRiskScore = Math.round(
      relevantDivisions.reduce((sum, division) => sum + division.overall_risk_score, 0) / count,
    )

    return [
      { label: 'Staff availability', value: `${avgStaffAvailability}%` },
      { label: 'Awaiting handover batons', value: String(awaitingHandover) },
      { label: 'At-risk batons', value: String(atRiskBatons) },
      { label: 'Continuity risk', value: continuityRiskLabel(avgRiskScore) },
    ]
  }, [divisionFilter, divisions, resolvedLock])

  return {
    loading,
    error,
    divisionFilter,
    setDivisionFilter,
    divisionOptions,
    filteredTeams: teamsSortedByRisk,
    summaryCards,
    divisionFilterLocked: lockedDivisionId != null || lockedTeamId != null,
  }
}
