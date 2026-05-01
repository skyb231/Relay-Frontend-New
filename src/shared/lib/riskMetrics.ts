import type { InsightVariant } from '@/components/ui/InsightStatCard'

export type RiskTone = 'green' | 'yellow' | 'orange' | 'red' | 'slate'

export function parsePercent(value: string): number | null {
  const m = value.match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function parseLeadingInt(value: string): number | null {
  const m = String(value).trim().match(/^(\d+)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function continuityRiskTone(value: string): RiskTone {
  const low = value.trim().toLowerCase()
  if (low === 'low' || low === 'none') return 'green'
  if (low === 'medium') return 'yellow'
  if (low === 'high') return 'orange'
  return 'slate'
}

export function reconstructionTone(value: string, mediumHourUpperBound: number): RiskTone {
  const v = value.trim().toLowerCase()
  if (!v || v === '—' || v === 'n/a' || v === 'unknown' || v === 'not set') return 'orange'
  if (/\b(week|month|year)s?\b|\b\d+\s*days?\b/i.test(v)) return 'red'
  const range = v.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (range) {
    const hi = Math.max(Number(range[1]), Number(range[2]))
    if (hi <= 4) return 'green'
    if (hi <= mediumHourUpperBound) return 'orange'
    return 'red'
  }
  const single = v.match(/^(\d+)\s*h/)
  if (single) {
    const h = Number(single[1])
    if (h <= 4) return 'green'
    if (h <= mediumHourUpperBound) return 'orange'
    return 'red'
  }
  if (/\b(low|minutes?|quick|short)\b/i.test(v)) return 'green'
  if (/\b(high|long|slow|severe)\b/i.test(v)) return 'red'
  return 'orange'
}

export function toneToInsightVariant(tone: RiskTone): InsightVariant {
  if (tone === 'green') return 'success'
  if (tone === 'yellow' || tone === 'orange') return 'warning'
  if (tone === 'red') return 'danger'
  return 'neutral'
}

