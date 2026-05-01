import { normalizeRole, type UserRole } from '@/roles'
import type { BatonTask, TeamRosterMember } from '@/types/domain'

export function isSelectedTeamLead(args: {
  ownerFilter: number | null
  roster: TeamRosterMember[]
  role: UserRole
  userId: number | null
}): boolean {
  const { ownerFilter, roster, role, userId } = args
  if (ownerFilter == null) return false
  const selectedIsSelfTeamLead =
    userId != null && Number(ownerFilter) === Number(userId) && role === 'team_lead'
  if (selectedIsSelfTeamLead) return true
  const selected = roster.find((member) => member.id === ownerFilter)
  return normalizeRole(selected?.role ?? '') === 'team_lead'
}

export function shouldShowApproveColumn(args: {
  ownerFilter: number | null
  roster: TeamRosterMember[]
  role: UserRole
  userId: number | null
}): boolean {
  const { ownerFilter, role } = args
  if (ownerFilter === null) return role === 'team_lead' || role === 'software_engineer' || role === 'unknown'
  return isSelectedTeamLead(args)
}

export function shouldIncludeTaskForOwnerFilter(args: {
  task: BatonTask
  ownerFilter: number | null
  selectedIsTeamLead: boolean
  successorMatchesFilter: boolean
}): boolean {
  const { task, ownerFilter, selectedIsTeamLead, successorMatchesFilter } = args
  if (ownerFilter == null) return true
  const isDone = task.workflowStatus === 'Done' || task.status === 'Done'
  if (isDone && Number(task.ownerId) !== Number(ownerFilter)) return false
  if (selectedIsTeamLead && task.status === 'Approve handover') return true
  return Number(task.ownerId) === Number(ownerFilter) || successorMatchesFilter
}

