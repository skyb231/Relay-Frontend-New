import { InsightStatCard, type InsightVariant } from '../../components/ui/InsightStatCard'

type DashboardSummaryCardsProps = {
  summaryCards: Array<{ label: string; value: string }>
}

function parseLeadingInt(value: string): number | null {
  const m = String(value).trim().match(/^(\d+)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function parsePercent(value: string): number | null {
  const m = value.match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function metricVariant(label: string, value: string): InsightVariant {
  const lower = label.toLowerCase()
  const v = value.trim()

  if (lower.includes('staff availability')) {
    const n = parsePercent(v)
    if (n == null) return 'neutral'
    if (n >= 70) return 'success'
    if (n >= 45) return 'warning'
    return 'danger'
  }

  if (lower.includes('awaiting handover')) {
    const n = parseLeadingInt(v)
    if (n == null) return 'neutral'
    if (n === 0) return 'success'
    if (n <= 3) return 'warning'
    return 'danger'
  }

  if (lower.includes('at-risk')) {
    const n = parseLeadingInt(v)
    if (n == null) return 'neutral'
    if (n === 0) return 'success'
    if (n <= 5) return 'warning'
    return 'danger'
  }

  if (lower.includes('continuity risk')) {
    const low = v.toLowerCase()
    if (low === 'low') return 'success'
    if (low === 'medium') return 'warning'
    if (low === 'high') return 'danger'
    return 'neutral'
  }

  return 'neutral'
}

export function DashboardSummaryCards({ summaryCards }: DashboardSummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <InsightStatCard
          key={card.label}
          label={card.label}
          value={card.value}
          variant={metricVariant(card.label, card.value)}
        />
      ))}
    </section>
  )
}
