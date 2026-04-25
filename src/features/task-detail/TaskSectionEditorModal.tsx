import type { ReactNode } from 'react'
import { Button } from '../../components/ui/Button'

type TaskSectionEditorModalProps = {
  title: string
  isOpen: boolean
  children: ReactNode
  onCancel: () => void
  onSave: () => void | Promise<void>
  saving?: boolean
}

export function TaskSectionEditorModal({
  title,
  isOpen,
  children,
  onCancel,
  onSave,
  saving = false,
}: TaskSectionEditorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
        <div className="space-y-3 overflow-y-auto pr-1">{children}</div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" className="h-9 px-4 py-0 text-sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="h-9 px-4 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            onClick={() => void Promise.resolve(onSave())}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
