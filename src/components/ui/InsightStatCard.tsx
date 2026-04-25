import { cn } from './cn'
import type { ReactElement } from 'react'

export type InsightVariant = 'success' | 'warning' | 'danger' | 'neutral'

type InsightStatCardProps = {
  label: string
  value: string
  variant: InsightVariant
  className?: string
}

type InsightIconComponent = (props: { className?: string }) => ReactElement

function IconSuccess({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function IconWarning({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  )
}

/** Bell — used as a soft “alarm” cue for poor metrics */
function IconAlarm({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconNeutral({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12h7.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
      />
    </svg>
  )
}

const shell: Record<InsightVariant, { ring: string; iconBg: string; iconInk: string }> = {
  success: {
    ring: 'ring-emerald-100/90',
    iconBg: 'bg-emerald-100/80',
    iconInk: 'text-emerald-700',
  },
  warning: {
    ring: 'ring-amber-100/90',
    iconBg: 'bg-amber-100/80',
    iconInk: 'text-amber-800',
  },
  danger: {
    ring: 'ring-rose-100/90',
    iconBg: 'bg-rose-100/85',
    iconInk: 'text-rose-700',
  },
  neutral: {
    ring: 'ring-slate-200/80',
    iconBg: 'bg-slate-100/90',
    iconInk: 'text-slate-600',
  },
}

const iconByVariant: Record<InsightVariant, InsightIconComponent> = {
  success: IconSuccess,
  warning: IconWarning,
  danger: IconAlarm,
  neutral: IconNeutral,
}

/** Outer frame classes shared with dashboard / team risk metric cards. */
// eslint-disable-next-line react-refresh/only-export-components
export function insightCardFrameClassName(variant: InsightVariant, className?: string) {
  const s = shell[variant]
  return cn(
    'flex gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-inset',
    s.ring,
    className,
  )
}

/** Pastel icon tile (check / warning / bell / neutral) for a given variant. */
export function InsightIconTile({ variant, className }: { variant: InsightVariant; className?: string }) {
  const s = shell[variant]
  const Icon = iconByVariant[variant]
  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
        s.iconBg,
        className,
      )}
    >
      <Icon className={cn('h-6 w-6', s.iconInk)} />
    </div>
  )
}

export function InsightStatCard({ label, value, variant, className }: InsightStatCardProps) {
  return (
    <div className={insightCardFrameClassName(variant, className)}>
      <InsightIconTile variant={variant} />
      <div className="min-w-0 flex-1">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      </div>
    </div>
  )
}
