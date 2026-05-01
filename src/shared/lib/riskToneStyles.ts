import type { RiskTone } from '@/types/domain'

export function riskToneBackgroundClass(tone: RiskTone | 'slate'): string {
  if (tone === 'red') return 'bg-rose-50/90'
  if (tone === 'amber' || tone === 'yellow') return 'bg-amber-50/90'
  if (tone === 'orange') return 'bg-orange-50/90'
  if (tone === 'green') return 'bg-emerald-50/90'
  return 'bg-amber-50/70'
}

export function riskToneTextClass(tone: RiskTone | 'slate'): string {
  if (tone === 'red') return 'text-rose-700'
  if (tone === 'amber' || tone === 'yellow') return 'text-amber-800'
  if (tone === 'orange') return 'text-orange-800'
  if (tone === 'green') return 'text-emerald-800'
  return 'text-slate-900'
}

