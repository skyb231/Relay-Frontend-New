import type { AuthUser, BatonTask, BatonTaskDetail } from './types/domain'

export type UserRole = 'resilience_manager' | 'team_lead' | 'software_engineer' | 'unknown'
export function normalizeRole(role: string | undefined | null): UserRole {
  const r = (role ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (r.includes('resilience') && r.includes('manager')) return 'resilience_manager'
  if (r === 'resilience_manager') return 'resilience_manager'
  if (r.includes('team') && r.includes('lead')) return 'team_lead'
  if (r === 'team_lead') return 'team_lead'
  if (r.includes('software') || r.includes('engineer')) return 'software_engineer'
  if (r === 'software_engineer') return 'software_engineer'
  return 'unknown'
}

export function postLoginPath(role: UserRole): string {
  if (role === 'resilience_manager') return '/resilience-dashboard'
  return '/batons'
}

export function showBatonBoardNav(role: UserRole): boolean {
  return role === 'team_lead' || role === 'software_engineer' || role === 'unknown'
}

export function showResilienceDashboardNav(role: UserRole): boolean {
  return role === 'resilience_manager' || role === 'team_lead'
}

export function canAccessBatonBoard(role: UserRole): boolean {
  return role === 'team_lead' || role === 'software_engineer' || role === 'unknown'
}

export function canAccessResilienceDashboard(role: UserRole): boolean {
  return role === 'resilience_manager' || role === 'team_lead'
}

export function canEditBaton(user: AuthUser | null, detail: BatonTaskDetail): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (role === 'team_lead') {
    return detail.teamId != null && user.team_id != null && detail.teamId === user.team_id
  }
  if (role === 'software_engineer') {
    return detail.ownership.ownerId === user.user_id
  }
  return false
}

export function canShowBatonBoardActions(user: AuthUser | null, task: BatonTask): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (role === 'team_lead') {
    return task.teamId != null && user.team_id != null && task.teamId === user.team_id
  }
  if (role === 'software_engineer' || role === 'unknown') {
    const uid = Number(user.user_id)
    if (Number(task.ownerId) === uid) return true
    if (task.handoverTargetId != null && Number(task.handoverTargetId) === uid) return true
    if (
      task.successorIds?.[0] != null &&
      Number(task.successorIds[0]) === uid &&
      task.ownerInOffice === false
    ) {
      return true
    }
    return false
  }
  return false
}

export function isTeamLeadForBaton(user: AuthUser | null, task: { teamId: number | null }): boolean {
  if (!user || task.teamId == null || user.team_id == null) return false
  return normalizeRole(user.role) === 'team_lead' && user.team_id === task.teamId
}

export function canReassignBaton(
  user: AuthUser | null,
  task: { teamId: number | null; ownerId: number },
): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (role === 'team_lead') {
    return task.teamId != null && user.team_id != null && task.teamId === user.team_id
  }
  if (role === 'software_engineer') {
    return task.ownerId === user.user_id
  }
  return false
}

export function canAdvanceBatonStatus(
  user: AuthUser | null,
  task: {
    ownerId: number
    teamId: number | null
    handoverTargetId?: number | null
    successorIds?: number[]
    ownerInOffice?: boolean
  },
): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (role === 'team_lead') {
    return task.teamId != null && user.team_id != null && task.teamId === user.team_id
  }
  if (role === 'software_engineer') {
    if (task.ownerId === user.user_id) return true
    if (task.handoverTargetId != null && task.handoverTargetId === user.user_id) return true
    if (task.successorIds?.[0] === user.user_id && task.ownerInOffice === false) {
      return true
    }
    return false
  }
  return false
}
