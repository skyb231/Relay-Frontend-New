import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthUser, BatonTask, TeamRosterMember } from '@/types/domain'
import type { UserRole } from '@/roles'
import { relayService } from '@/services/relayService'
import { normalizeRole } from '@/roles'
import type { WorkforcePerson } from '@/features/baton/WorkforceSnapshot'
import { isSuccessorLinkedHandoverTask } from './baton.constants'
import { isSelectedTeamLead, shouldIncludeTaskForOwnerFilter } from './model/visibility'

type ProjectOption = {
  projectId: number
  label: string
}

function buildProjectOptions(teamTasks: BatonTask[]): ProjectOption[] {
  return Array.from(new Set(teamTasks.map((task) => task.projectId))).map((projectId) => {
    const labelFromTask = teamTasks.find((task) => task.projectId === projectId)?.project
    return {
      projectId,
      label: labelFromTask ?? `Project ${projectId}`,
    }
  })
}

function resolvePersonInOffice(args: {
  ownerFilter: number | null
  roster: TeamRosterMember[]
  workforce: WorkforcePerson[]
}): boolean {
  const { ownerFilter, roster, workforce } = args
  if (ownerFilter == null) return true
  const fromRoster = roster.find((r) => r.id === ownerFilter)
  if (fromRoster) return fromRoster.in_office
  const fromWorkforce = workforce.find((p) => p.ownerId === ownerFilter)
  if (fromWorkforce) return fromWorkforce.inOffice
  return true
}

function buildWorkforce(args: {
  teamTasks: BatonTask[]
  roster: TeamRosterMember[]
  userId: number | null
  role: ReturnType<typeof normalizeRole>
}): WorkforcePerson[] {
  const { teamTasks, roster, userId, role } = args
  const counts = new Map<number, number>()
  teamTasks.forEach((task) => {
    counts.set(task.ownerId, (counts.get(task.ownerId) ?? 0) + 1)
  })

  let list: WorkforcePerson[]
  if (roster.length > 0) {
    list = roster.map((member) => ({
      ownerId: member.id,
      name: member.name,
      role: member.role,
      batons: counts.get(member.id) ?? 0,
      inOffice: member.in_office,
    }))
  } else {
    const taskByOwner = new Map<number, BatonTask>()
    teamTasks.forEach((task) => {
      if (!taskByOwner.has(task.ownerId)) taskByOwner.set(task.ownerId, task)
    })
    list = Array.from(counts.entries()).map(([ownerId, batons]) => {
      const ownerTask = taskByOwner.get(ownerId)
      const nameFromTask = ownerTask?.owner
      const inOffice = ownerTask?.ownerInOffice ?? true
      return {
        ownerId,
        name: nameFromTask ?? `User ${ownerId}`,
        role: '',
        batons,
        inOffice,
      }
    })
  }

  list = list.filter((person) => normalizeRole(person.role) !== 'resilience_manager')

  return [...list].sort((a, b) => {
    const tier = (p: WorkforcePerson) => {
      if (userId != null && p.ownerId === userId) return 0
      if (role === 'software_engineer' && normalizeRole(p.role) === 'team_lead') return 1
      if (!p.inOffice) return 2
      return 3
    }
    const d = tier(a) - tier(b)
    if (d !== 0) return d
    return a.name.localeCompare(b.name)
  })
}

function buildVisibleTasks(args: {
  teamTasks: BatonTask[]
  projectFilter: number | null
  ownerFilter: number | null
  personInOffice: boolean
  roster: TeamRosterMember[]
  role: ReturnType<typeof normalizeRole>
  userId: number | null
}): BatonTask[] {
  const { teamTasks, projectFilter, ownerFilter, personInOffice, roster, role, userId } = args
  const selectedIsTeamLead = isSelectedTeamLead({ ownerFilter, roster, role, userId })

  return teamTasks.filter((task) => {
    if (projectFilter !== null && task.projectId !== projectFilter) return false
    if (ownerFilter === null) return true

    const successorMatchesFilter = isSuccessorLinkedHandoverTask(task, Number(ownerFilter))
    if (!personInOffice) {
      return shouldIncludeTaskForOwnerFilter({
        task,
        ownerFilter,
        selectedIsTeamLead,
        successorMatchesFilter,
      })
    }

    return shouldIncludeTaskForOwnerFilter({
      task,
      ownerFilter,
      selectedIsTeamLead,
      successorMatchesFilter,
    })
  })
}

async function loadRosterWithRoles(teamId: number): Promise<TeamRosterMember[]> {
  const raw = await relayService.getTeamRoster(String(teamId))
  return Promise.all(
    raw.map(async (member) => {
      if (member.role?.trim()) return member
      try {
        const person = await relayService.getPerson(member.id)
        return { ...member, role: person.role?.trim() ?? '' }
      } catch {
        return member
      }
    }),
  )
}

async function loadBatonBoardSnapshot(
  user: AuthUser | null,
  role: UserRole,
): Promise<{ tasks: BatonTask[]; roster: TeamRosterMember[] }> {
  if (role === 'team_lead' && user?.team_id == null) {
    throw new Error('Your profile has no team assigned.')
  }

  const filters =
    user?.team_id != null
      ? { teamId: user.team_id }
      : role === 'software_engineer' && user
        ? { ownerId: user.user_id }
        : undefined

  const [response, roster] = await Promise.all([
    relayService.getBatonTasks(filters),
    user?.team_id != null ? loadRosterWithRoles(user.team_id) : Promise.resolve([] as TeamRosterMember[]),
  ])

  let tasks = response
  if (user?.division_id != null && (role === 'team_lead' || role === 'software_engineer')) {
    tasks = tasks.filter((t) => t.divisionId == null || t.divisionId === user.division_id)
  }

  return { tasks, roster }
}

export function useBatonBoardData(user: AuthUser | null) {
  const role = normalizeRole(user?.role)
  const [teamTasks, setTeamTasks] = useState<BatonTask[]>([])
  const [roster, setRoster] = useState<TeamRosterMember[]>([])
  const [error, setError] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<number | null>(null)
  const [ownerFilter, setOwnerFilter] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const snapshot = await loadBatonBoardSnapshot(user, role)
      setRoster(snapshot.roster)
      setTeamTasks(snapshot.tasks)
      setError(null)
    } catch (loadError) {
      setTeamTasks([])
      setRoster([])
      setError(loadError instanceof Error ? loadError.message : 'Failed to load baton tasks')
    }
  }, [role, user])

  useEffect(() => {
    let mounted = true
    void (async () => {
      await load()
      if (!mounted) return
    })()
    return () => {
      mounted = false
    }
  }, [load])

  const projectOptions = useMemo(() => buildProjectOptions(teamTasks), [teamTasks])

  const workforce = useMemo((): WorkforcePerson[] => {
    return buildWorkforce({
      teamTasks,
      roster,
      userId: user?.user_id ?? null,
      role,
    })
  }, [teamTasks, roster, user?.user_id, role])

  const personInOffice = useMemo(() => {
    return resolvePersonInOffice({ ownerFilter, roster, workforce })
  }, [ownerFilter, roster, workforce])

  const individualLens = useMemo(() => {
    if (ownerFilter == null) return null
    return {
      filterPersonId: ownerFilter,
      filterPersonInOffice: personInOffice,
    }
  }, [ownerFilter, personInOffice])

  const visibleTasks = useMemo(() => {
    return buildVisibleTasks({
      teamTasks,
      projectFilter,
      ownerFilter,
      personInOffice,
      roster,
      role,
      userId: user?.user_id ?? null,
    })
  }, [teamTasks, projectFilter, ownerFilter, personInOffice, roster, role, user])

  return {
    role,
    teamTasks,
    roster,
    error,
    setError,
    projectFilter,
    setProjectFilter,
    ownerFilter,
    setOwnerFilter,
    projectOptions,
    workforce,
    individualLens,
    visibleTasks,
    refresh: load,
  }
}
