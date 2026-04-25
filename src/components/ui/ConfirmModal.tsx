import type { ReactNode } from 'react'
import { Button } from './Button'

type ConfirmModalProps = {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-2 text-sm text-slate-600">{message}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" type="button" className="h-9 px-4 text-sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" className="h-9 px-4 text-sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
