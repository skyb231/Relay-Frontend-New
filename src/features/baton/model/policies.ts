import type { AuthUser, BatonTask } from '@/types/domain'
import { normalizeRole } from '@/roles'

export function isSuccessorEligibleForAccept(userId: number | null, task: BatonTask): boolean {
  if (userId == null) return false
  if (task.handoverTargetId != null && Number(task.handoverTargetId) === Number(userId)) return true
  return task.successorIds[0] != null && Number(task.successorIds[0]) === Number(userId)
}

export function canShowTaskActions(user: AuthUser | null, task: BatonTask): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (role === 'team_lead') {
    return task.teamId != null && user.team_id != null && task.teamId === user.team_id
  }
  const uid = Number(user.user_id)
  if (Number(task.ownerId) === uid) return true
  if (task.handoverTargetId != null && Number(task.handoverTargetId) === uid) return true
  if (task.successorIds?.[0] != null && Number(task.successorIds[0]) === uid && task.ownerInOffice === false) {
    return true
  }
  return false
}

