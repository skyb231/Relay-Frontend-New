import type { BatonTask } from '../../types/domain'

/** Full board when a person is selected on the workforce snapshot. */
export const INDIVIDUAL_BATON_COLUMNS = [
  'Approve handover',
  'Waiting to Be Accepted',
  'Enrich Baton',
  'In Progress',
  'Awaiting Handover',
  'Done',
] as const

/** Team-wide board: “Waiting” + “Awaiting handover” share one column. */
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

/**
 * Reusable predicate for "show this baton in successor acceptance lens".
 * Keeps workforce filtering and column assignment behavior aligned.
 */
export function isSuccessorLinkedHandoverTask(task: BatonTask, personId: number): boolean {
  return (
    (task.workflowStatus === 'Awaiting Handover' ||
      task.status === 'Waiting to Be Accepted' ||
      task.workflowStatus === 'Approve handover' ||
      task.status === 'Approve handover') &&
    (task.handoverTargetId === personId || task.successorIds.some((id) => id === personId))
  )
}

/** Map effective `task.status` into the column header for the current view. */
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
  /** From roster: false when the selected member is out of office. */
  filterPersonInOffice: boolean
}

/**
 * Workforce “individual” view: an OOO owner’s batons are grouped under Awaiting Handover;
 * an in-office **first successor** (owner OOO) appears under Waiting to Be Accepted.
 */
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
