import { useMemo } from 'react'
import type { BatonTask } from '../../types/domain'
import { BatonTaskCard } from './BatonTaskCard'
import {
  INDIVIDUAL_BATON_COLUMNS,
  TEAM_BOARD_COLUMNS,
  columnKeyForBoardView,
  columnKeyForIndividualLens,
  type BatonColumn,
  type BoardViewMode,
  type IndividualBoardLens,
} from './baton.constants'

type BatonColumnBoardProps = {
  tasks: BatonTask[]
  viewMode: BoardViewMode
  showApproveHandoverColumn: boolean
  /** When set (individual view + person selected), adjusts columns for OOO owner vs first-successor lens. */
  individualLens?: IndividualBoardLens | null
  onAdvanceStatus: (
    task: BatonTask,
    nextStatus: 'in_progress' | 'done' | 'approve_handover' | 'decline_handover',
  ) => Promise<void>
  /** Whether Mark done / Accept may appear (owner, successor context, or team lead — not resilience manager). */
  showBoardActions: (task: BatonTask) => boolean
  /** Overrides default Accept modal body (e.g. team lead accepting for a successor). */
  acceptBatonMessage?: string
}

export function BatonColumnBoard({
  tasks,
  viewMode,
  showApproveHandoverColumn,
  individualLens,
  onAdvanceStatus,
  showBoardActions,
  acceptBatonMessage,
}: BatonColumnBoardProps) {
  const baseColumns = viewMode === 'team' ? TEAM_BOARD_COLUMNS : INDIVIDUAL_BATON_COLUMNS
  const columns = showApproveHandoverColumn
    ? baseColumns
    : baseColumns.filter((column) => column !== 'Approve handover')

  const tasksByColumn = useMemo(() => {
    const grouped: Partial<Record<BatonColumn, BatonTask[]>> = {}
    columns.forEach((column) => {
      grouped[column] = []
    })

    tasks.forEach((task) => {
      let key =
        viewMode === 'individual' && individualLens
          ? columnKeyForIndividualLens(task, individualLens)
          : columnKeyForBoardView(task.status, viewMode)
      if (!showApproveHandoverColumn && key === 'Approve handover') {
        key = 'Awaiting Handover'
      }
      grouped[key]?.push(task)
    })

    return grouped
  }, [tasks, viewMode, columns, individualLens, showApproveHandoverColumn])

  const colCount = columns.length
  const minBoardWidth = colCount * 200 + Math.max(0, colCount - 1) * 14

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid gap-3.5"
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(200px, 1fr))`,
          minWidth: minBoardWidth,
        }}
      >
      {columns.map((column) => {
        const columnTasks = tasksByColumn[column] ?? []

        return (
          <section
            key={column}
            className="overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/95 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-inset ring-slate-200/55"
          >
            <header className="flex items-center justify-between border-b border-slate-200/90 bg-white px-3 py-2.5">
              <h3 className="text-sm font-medium text-slate-800">{column}</h3>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">
                {columnTasks.length}
              </span>
            </header>
            <div className="min-h-[260px] space-y-2 p-2">
              {columnTasks.map((task) => (
                <BatonTaskCard
                  key={task.id}
                  task={task}
                  column={column}
                  boardViewMode={viewMode}
                  onAdvanceStatus={onAdvanceStatus}
                  showBoardActions={showBoardActions(task)}
                  acceptBatonMessage={acceptBatonMessage}
                />
              ))}
            </div>
          </section>
        )
      })}
      </div>
    </div>
  )
}
