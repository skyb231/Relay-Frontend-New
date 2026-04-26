import { InsightStatCard, type InsightVariant } from '../../components/ui/InsightStatCard'
import type { TeamDetail } from '../../types/domain'

type TeamMetricsGridProps = {
  metrics: TeamDetail['metrics']
}

type Tone = 'green' | 'yellow' | 'orange' | 'red' | 'slate'

function parsePercent(value: string): number | null {
  const m = value.match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function handoverTone(value: string): Tone {
  const n = parsePercent(value)
  if (n == null) return 'slate'
  if (n >= 70) return 'green'
  if (n >= 40) return 'yellow'
  return 'red'
}

function unassignedTone(value: string): Tone {
  const n = parsePercent(value)
  if (n == null) return 'slate'
  if (n <= 15) return 'green'
  if (n <= 35) return 'yellow'
  return 'red'
}

function reconstructionTone(value: string): Tone {
  const v = value.trim().toLowerCase()
  if (!v || v === '—' || v === 'n/a') return 'orange'
  if (/\b(week|month|year)s?\b|\b\d+\s*days?\b/i.test(v)) return 'red'
  const range = v.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (range) {
    const hi = Math.max(Number(range[1]), Number(range[2]))
    if (hi <= 4) return 'green'
    if (hi <= 12) return 'orange'
    return 'red'
  }
  const single = v.match(/^(\d+)\s*h/)
  if (single) {
    const h = Number(single[1])
    if (h <= 4) return 'green'
    if (h <= 12) return 'orange'
    return 'red'
  }
  return 'orange'
}

function delayLabelTone(value: string): Tone {
  const low = value.trim().toLowerCase()
  if (low === 'low' || low === 'none') return 'green'
  if (low === 'medium') return 'yellow'
  if (low === 'high') return 'orange'
  return 'slate'
}

function toneToVariant(tone: Tone): InsightVariant {
  if (tone === 'green') return 'success'
  if (tone === 'yellow' || tone === 'orange') return 'warning'
  if (tone === 'red') return 'danger'
  return 'neutral'
}

export function TeamMetricsGrid({ metrics }: TeamMetricsGridProps) {
  const items: Array<{ label: string; value: string; tone: Tone }> = [
    { label: '% Handover Ready', value: metrics.handoverReady, tone: handoverTone(metrics.handoverReady) },
    { label: '% Unassigned', value: metrics.unassigned, tone: unassignedTone(metrics.unassigned) },
    {
      label: 'Avg Reconstruction Time',
      value: metrics.reconstructionTime && metrics.reconstructionTime !== '—' ? `${metrics.reconstructionTime} minutes` : metrics.reconstructionTime,
      tone: reconstructionTone(metrics.reconstructionTime),
    },
    { label: 'Critical Delays', value: metrics.criticalDelays, tone: delayLabelTone(metrics.criticalDelays) },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
      {items.map((item) => (
        <InsightStatCard
          key={item.label}
          label={item.label}
          value={item.value}
          variant={toneToVariant(item.tone)}
          className="min-h-[124px] items-center"
        />
      ))}
    </div>
  )
}
