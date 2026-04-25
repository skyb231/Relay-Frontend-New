import { cn } from './cn'

type BadgeTone = 'green' | 'amber' | 'red' | 'slate'

type BadgeProps = {
  tone?: BadgeTone
  label: string
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  green: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border border-amber-200 bg-amber-50 text-amber-700',
  red: 'border border-rose-200 bg-rose-50 text-rose-700',
  slate: 'border border-slate-200 bg-slate-100 text-slate-700',
}

export function Badge({ tone = 'slate', label, className = '' }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold leading-none', toneClasses[tone], className)}>
      {label}
    </span>
  )
}
