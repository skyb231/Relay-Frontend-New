import { cn } from './cn'
import type { InsightVariant } from './InsightStatCard'

export function insightCardFrameClassName(variant: InsightVariant, className?: string) {
  const shell: Record<InsightVariant, { ring: string }> = {
    success: { ring: 'ring-emerald-100/90' },
    warning: { ring: 'ring-amber-100/90' },
    danger: { ring: 'ring-rose-100/90' },
    neutral: { ring: 'ring-slate-200/80' },
  }
  return cn(
    'flex gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-inset',
    shell[variant].ring,
    className,
  )
}

