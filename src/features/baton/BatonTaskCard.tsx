import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTeamLeadForBaton } from '../../roles'
import { useAuthSession } from '../../app/useAuthSession'
import { ROUTES } from '../../app/routes'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import type { BatonTask } from '../../types/domain'
import type { BatonColumn, BoardViewMode } from './baton.constants'
import { isSuccessorEligibleForAccept } from './model/policies'

type BatonTaskCardProps = {
  task: BatonTask
  column: BatonColumn
  boardViewMode: BoardViewMode
  onAdvanceStatus: (
    task: BatonTask,
    nextStatus: 'in_progress' | 'done' | 'approve_handover' | 'decline_handover',
  ) => Promise<void>
  showBoardActions: boolean
  acceptBatonMessage?: string
}

export function BatonTaskCard({
  task,
  column,
  boardViewMode,
  onAdvanceStatus,
  showBoardActions,
  acceptBatonMessage,
}: BatonTaskCardProps) {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState<null | 'accept' | 'done' | 'approve' | 'decline'>(null)

  const { user } = useAuthSession()
  const uid = user?.user_id
  const teamLead = isTeamLeadForBaton(user, task)

  const successorCanAccept = isSuccessorEligibleForAccept(uid ?? null, task)

  const inAcceptColumn =
    (boardViewMode === 'team' && column === 'Awaiting Handover') ||
    (boardViewMode === 'individual' && column === 'Waiting to Be Accepted')

  const canAccept = showBoardActions && inAcceptColumn && (teamLead || successorCanAccept)

  const canDeclineAwaitingHandover =
    showBoardActions &&
    inAcceptColumn &&
    task.workflowStatus !== 'Done' &&
    (teamLead || successorCanAccept)

  const canMarkDone =
    showBoardActions &&
    column === 'In Progress' &&
    task.workflowStatus === 'In Progress' &&
    (teamLead || (uid != null && task.ownerId === uid))

  const inApproveHandoverColumn = column === 'Approve handover'

  const canApproveHandover =
    showBoardActions &&
    inApproveHandoverColumn &&
    teamLead &&
    task.workflowStatus !== 'Done' &&
    (task.handoverTargetId != null || task.successorIds.length > 0)

  const canDeclineHandover =
    showBoardActions &&
    inApproveHandoverColumn &&
    teamLead &&
    task.workflowStatus !== 'Done'

  const markDoneButtonClass =
    'mt-3 h-7 w-full px-2 py-0 text-sm bg-emerald-600 hover:bg-emerald-700 text-white'
  const approveHandoverButtonClass =
    'h-6 flex-1 px-2 py-0 text-xs bg-purple-950 hover:bg-purple-900 text-white'
  const declineHandoverButtonClass =
    'h-6 flex-1 px-2 py-0 text-xs !bg-slate-100 border-slate-300 !text-slate-700 hover:!bg-slate-200'

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="w-full rounded-xl border border-slate-200/90 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-inset ring-slate-100/80 transition hover:shadow-sm"
        onClick={() => {
          void navigate(ROUTES.batonDetail(task.id), { state: { from: 'baton-board' } })
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            void navigate(ROUTES.batonDetail(task.id), { state: { from: 'baton-board' } })
          }
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">{task.ref}</p>
          <Badge tone={task.tone} label={task.risk} className="text-sm" />
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-700">{task.title}</p>
        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <p>
            Owner: <span className="text-slate-800">{task.owner}</span>
          </p>
          <p>
            Successor: <span className="text-slate-800">{task.successor}</span>
          </p>
          <p className="text-slate-400">{task.age}</p>
        </div>
        {canMarkDone ? (
          <Button
            className={markDoneButtonClass}
            onClick={(event) => {
              event.stopPropagation()
              setConfirm('done')
            }}
          >
            Mark as Done
          </Button>
        ) : null}
        {canAccept || canDeclineAwaitingHandover ? (
          <div className="mt-3 flex items-center gap-2">
            {canAccept ? (
              <Button
                className="h-6 flex-1 px-2 py-0 text-xs bg-blue-950 hover:bg-slate-950 text-white"
                onClick={(event) => {
                  event.stopPropagation()
                  setConfirm('accept')
                }}
              >
                Accept
              </Button>
            ) : null}
            {canDeclineAwaitingHandover ? (
              <Button
                variant="secondary"
                className={declineHandoverButtonClass}
                onClick={(event) => {
                  event.stopPropagation()
                  setConfirm('decline')
                }}
              >
                Decline
              </Button>
            ) : null}
          </div>
        ) : null}
        {canApproveHandover || canDeclineHandover ? (
          <div className="mt-3 flex items-center gap-2">
            {canApproveHandover ? (
              <Button
                className={approveHandoverButtonClass}
                onClick={(event) => {
                  event.stopPropagation()
                  setConfirm('approve')
                }}
              >
                Approve
              </Button>
            ) : null}
            {canDeclineHandover ? (
              <Button
                variant="secondary"
                className={declineHandoverButtonClass}
                onClick={(event) => {
                  event.stopPropagation()
                  setConfirm('decline')
                }}
              >
                Decline
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={confirm === 'accept'}
        title="Accept Baton"
        message={
          acceptBatonMessage ??
          'Confirming will assign you as the owner of this baton. If no successors remain it will move into "Enrich Baton" else will go into "In Progress".'
        }
        confirmLabel="Accept"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void onAdvanceStatus(task, 'in_progress')
        }}
      />
      <ConfirmModal
        isOpen={confirm === 'done'}
        title="Make Baton as Done"
        message="Confirming will record this Baton as done."
        confirmLabel="Mark complete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void onAdvanceStatus(task, 'done')
        }}
      />
      <ConfirmModal
        isOpen={confirm === 'approve'}
        title="Approve Handover"
        message="Confirming will send this baton to the first in-office successor for acceptance."
        confirmLabel="Approve"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void onAdvanceStatus(task, 'approve_handover')
        }}
      />
      <ConfirmModal
        isOpen={confirm === 'decline'}
        title="Decline Handover"
        message={
          teamLead
            ? 'Confirming will keep this Baton as "In Progress" for the owner.'
            : 'Confirming will remove you as a successor and require approval from the team lead to assign to the next in-office successor.'
        }
        confirmLabel="Decline"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          void onAdvanceStatus(task, 'decline_handover')
        }}
      />
    </>
  )
}
