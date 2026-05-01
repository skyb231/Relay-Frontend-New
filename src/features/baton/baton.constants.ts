import type { BatonTask } from '../../types/domain'

export const INDIVIDUAL_BATON_COLUMNS = [
  'Approve handover',
  'Waiting to Be Accepted',
  'Enrich Baton',
  'In Progress',
  'Awaiting Handover',
  'Done',
] as const

export const TEAM_BOARD_COLUMNS = [
  'Approve handover',
  'Awaiting Handover',
  'Enrich Baton',
  'In Progress',
  'Done',
] as const

export type IndividualBatonColumn = (typeof INDIVIDUAL_BATON_COLUMNS)[number]
export type TeamBoardColumn = (typeof TEAM_BOARD_COLUMNS)[number]
export type BatonColumn = IndividualBatonColumn | TeamBoardColumn

export type BoardViewMode = 'team' | 'individual'

export function isSuccessorLinkedHandoverTask(task: BatonTask, personId: number): boolean {
  return (
    (task.workflowStatus === 'Awaiting Handover' || task.status === 'Waiting to Be Accepted') &&
    (task.handoverTargetId === personId || task.successorIds.some((id) => id === personId))
  )
}

export function columnKeyForBoardView(
  taskStatus: string,
  viewMode: BoardViewMode,
): BatonColumn {
  if (viewMode === 'team') {
    if (taskStatus === 'Approve handover') {
      return 'Approve handover'
    }
    if (taskStatus === 'Waiting to Be Accepted' || taskStatus === 'Awaiting Handover') {
      return 'Awaiting Handover'
    }
    if ((TEAM_BOARD_COLUMNS as readonly string[]).includes(taskStatus)) {
      return taskStatus as TeamBoardColumn
    }
    return 'Awaiting Handover'
  }
  if ((INDIVIDUAL_BATON_COLUMNS as readonly string[]).includes(taskStatus)) {
    return taskStatus as IndividualBatonColumn
  }
  return 'Waiting to Be Accepted'
}

export type IndividualBoardLens = {
  filterPersonId: number
  filterPersonInOffice: boolean
}
export function columnKeyForIndividualLens(task: BatonTask, lens: IndividualBoardLens): BatonColumn {
  const { filterPersonId, filterPersonInOffice } = lens

  if (!filterPersonInOffice && task.ownerId === filterPersonId) {
    const s = task.status
    if (s === 'Waiting to Be Accepted') return 'Awaiting Handover'
    return columnKeyForBoardView(s, 'individual')
  }

  if (isSuccessorLinkedHandoverTask(task, filterPersonId)) {
    return 'Waiting to Be Accepted'
  }

  return columnKeyForBoardView(task.status, 'individual')
}
