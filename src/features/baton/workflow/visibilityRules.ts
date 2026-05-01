import type { UserRole } from '@/roles'
import type { TeamRosterMember } from '@/types/domain'
import { shouldShowApproveColumn } from '@/features/baton/model/visibility'

type ShowApproveColumnArgs = {
  ownerFilter: number | null
  roster: TeamRosterMember[]
  role: UserRole
  userId: number | null
}

export function shouldShowApproveHandoverColumn({
  ownerFilter,
  roster,
  role,
  userId,
}: ShowApproveColumnArgs): boolean {
  return shouldShowApproveColumn({ ownerFilter, roster, role, userId })
}
