import { normalizeRole, type UserRole } from '@/roles'
import type { TeamRosterMember } from '@/types/domain'

type ShowApproveColumnArgs = {
  ownerFilter: number | null
  roster: TeamRosterMember[]
  role: UserRole
  userId: number | null
}

/** Approve column on full team lead view, or when selected person is a team lead. */
export function shouldShowApproveHandoverColumn({
  ownerFilter,
  roster,
  role,
  userId,
}: ShowApproveColumnArgs): boolean {
  if (ownerFilter === null) return role === 'team_lead' || role === 'software_engineer' || role === 'unknown'
  if (userId != null && Number(ownerFilter) === Number(userId) && role === 'team_lead') {
    return true
  }
  const selected = roster.find((m) => m.id === ownerFilter)
  if (!selected) return false
  return normalizeRole(selected.role ?? '') === 'team_lead'
}
