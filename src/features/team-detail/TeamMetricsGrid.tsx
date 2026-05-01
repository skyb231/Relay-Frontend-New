import { InsightStatCard } from '../../components/ui/InsightStatCard'
import type { TeamDetail } from '../../types/domain'
import { continuityRiskTone, parsePercent, reconstructionTone, toneToInsightVariant } from '@/shared/lib/riskMetrics'

type TeamMetricsGridProps = {
  metrics: TeamDetail['metrics']
}

type Tone = 'green' | 'yellow' | 'orange' | 'red' | 'slate'

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

function delayLabelTone(value: string): Tone {
  const tone = continuityRiskTone(value)
  return tone === 'slate' ? 'slate' : tone
}

export function TeamMetricsGrid({ metrics }: TeamMetricsGridProps) {
  const items: Array<{ label: string; value: string; tone: Tone }> = [
    { label: '% Handover Ready', value: metrics.handoverReady, tone: handoverTone(metrics.handoverReady) },
    { label: '% Unassigned', value: metrics.unassigned, tone: unassignedTone(metrics.unassigned) },
    {
      label: 'Avg Reconstruction Time',
      value: metrics.reconstructionTime && metrics.reconstructionTime !== '—' ? `${metrics.reconstructionTime} minutes` : metrics.reconstructionTime,
      tone: reconstructionTone(metrics.reconstructionTime, 12),
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
          variant={toneToInsightVariant(item.tone)}
          className="min-h-[124px] items-center"
        />
      ))}
    </div>
  )
}
