import { BATON_STATUS } from '@/features/baton/batonStatus'
import { mapApiStatusToWorkflow } from '@/features/baton/model/status'
import type { BatonTask, RiskTone } from '@/types/domain'
import { reconstructionTone } from '@/shared/lib/riskMetrics'

export function mapStatus(status: string): BatonTask['status'] {
  return mapApiStatusToWorkflow(status)
}

export function toneFromRiskLabel(label: string): RiskTone {
  const normalized = label.trim().toLowerCase()
  if (normalized === 'low risk') return 'green'
  if (normalized === 'medium risk') return 'amber'
  return 'red'
}

export function normalizedRiskLabelFromApi(raw: unknown): string {
  const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (normalized === 'low risk') return 'Low Risk'
  if (normalized === 'medium risk') return 'Medium Risk'
  if (normalized === 'high risk' || normalized === 'critical risk') return 'High Risk'
  return 'Medium Risk'
}

export function normalizeBatonStatus(status: string | undefined | null): string {
  return (status ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
}

export function isHandoverPendingApproval(status: string | undefined | null): boolean {
  return normalizeBatonStatus(status) === BATON_STATUS.HANDOVER_PENDING_APPROVAL
}

export function reconstructionRiskTone(raw: string | null | undefined): RiskTone {
  const tone = reconstructionTone(raw ?? '', 24)
  return tone === 'slate' ? 'orange' : tone
}

