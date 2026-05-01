import { BATON_STATUS } from '@/features/baton/batonStatus'
import type { BatonTask } from '@/types/domain'

export function normalizeBatonStatus(status: string | undefined | null): string {
  return (status ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
}

export function mapApiStatusToWorkflow(status: string): BatonTask['status'] {
  // Keep backend baton states aligned with board columns used by operations teams.
  const s = normalizeBatonStatus(status)
  if (s === BATON_STATUS.HANDOVER_PENDING_APPROVAL) return 'Approve handover'
  if (s === BATON_STATUS.AWAITING_HANDOVER) return 'Awaiting Handover'
  if (s === BATON_STATUS.IN_PROGRESS) return 'In Progress'
  if (s === BATON_STATUS.DONE || s === 'completed' || s === 'complete') return 'Done'
  if (s === BATON_STATUS.ENRICH_TICKET || s === 'enrich') return 'Enrich Baton'
  return 'Waiting to Be Accepted'
}

export function isAwaitingAcceptFlow(task: Pick<BatonTask, 'workflowStatus' | 'status'>): boolean {
  // Successor acceptance actions are allowed only in awaiting-accept states.
  return (
    task.workflowStatus === 'Awaiting Handover' ||
    task.workflowStatus === 'Waiting to Be Accepted' ||
    task.status === 'Waiting to Be Accepted'
  )
}

