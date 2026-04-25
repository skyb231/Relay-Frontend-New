import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  children: ReactNode
  className?: string
  labelClassName?: string
}

export function FormField({
  label,
  children,
  className = 'space-y-1.5',
  labelClassName = 'block text-sm font-medium text-slate-600',
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className={labelClassName}>{label}</label>
      {children}
    </div>
  )
}
