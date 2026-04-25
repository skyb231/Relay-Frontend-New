import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  canAccessBatonBoard,
  canShowBatonBoardActions,
} from '../../roles'
import { useAuthSession } from '../../app/AuthSessionProvider'
import { ROUTES } from '../../app/routes'
import { pageBackButtonClass } from '../../components/navigation/PageBackNav'
import { Select } from '../../components/ui/Select'
import type { BatonTask } from '../../types/domain'
import { BatonColumnBoard } from './BatonColumnBoard'
import { WorkforceSnapshot } from './WorkforceSnapshot'
import { useBatonBoardData } from './useBatonBoardData'
import { advanceBatonStatus } from './workflow/advanceBatonStatus'
import { shouldShowApproveHandoverColumn } from './workflow/visibilityRules'

export function BatonBoardView() {
  const { user } = useAuthSession()
  const {
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
    refresh,
  } = useBatonBoardData(user)

  const hasOwnerFilter = ownerFilter !== null
  const boardViewMode = ownerFilter === null ? 'team' : 'individual'

  async function handleAdvanceStatus(
    task: BatonTask,
    nextStatus: 'in_progress' | 'done' | 'approve_handover' | 'decline_handover',
  ) {
    const sessionUser = user
    if (!sessionUser) return
    try {
      await advanceBatonStatus({
        task,
        nextStatus,
        role,
        userId: sessionUser.user_id,
        ownerFilter,
        roster,
      })
      await refresh()
      setError(null)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update baton status')
    }
  }

  const showBoardActionsForTask = (task: BatonTask) => canShowBatonBoardActions(user, task)

  const showApproveHandoverColumn = useMemo(() => {
    return shouldShowApproveHandoverColumn({
      ownerFilter,
      roster,
      role,
      userId: user?.user_id ?? null,
    })
  }, [ownerFilter, roster, role, user?.user_id])

  if (!canAccessBatonBoard(role)) {
    return <Navigate to={ROUTES.resilienceDashboard} replace />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          className="h-8 w-full px-2 py-1 text-xs sm:w-[180px]"
          value={projectFilter ?? ''}
          onChange={(event) => setProjectFilter(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">All Projects</option>
          {projectOptions.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.label}
            </option>
          ))}
        </Select>
        {hasOwnerFilter ? (
          <button
            type="button"
            className={`${pageBackButtonClass} w-full sm:w-auto`}
            onClick={() => setOwnerFilter(null)}
          >
            Back to Project/Team View
          </button>
        ) : null}
      </div>

      <WorkforceSnapshot
        people={workforce}
        selectedOwnerId={ownerFilter}
        onSelectOwner={(ownerId) => setOwnerFilter(ownerId)}
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {!error && teamTasks.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p className="font-medium">No batons loaded</p>
        </div>
      ) : null}
      <div className="space-y-2 pt-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Baton status</h2>
        <BatonColumnBoard
          tasks={visibleTasks}
          viewMode={boardViewMode}
          showApproveHandoverColumn={showApproveHandoverColumn}
          individualLens={individualLens}
          onAdvanceStatus={handleAdvanceStatus}
          showBoardActions={showBoardActionsForTask}
        />
      </div>
    </div>
  )
}
