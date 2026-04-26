import type { RelayDataSource } from './relayDataSource'
import { httpRequest, httpRequestList } from './httpClient'
import type {
  BatonTask,
  BatonTaskDetail,
  DivisionRisk,
  RiskTone,
  TeamDetail,
  TeamRisk,
  TeamRosterMember,
} from '../types/domain'
import { BATON_STATUS } from '@/features/baton/batonStatus'

type BatonApi = {
  id: number | string
  title: string
  description: string
  project_id: number
  team_id?: number | null
  division_id?: number | null
  owner_id: number
  owner_name?: string | null
  project_name?: string | null
  successor_ids?: number[] | null
  baton_status: string
  risk_label?: string | null
  risk_score?: number | null
  documentation_completeness?: number | null
  detailed_context: string | null
  implementation_state: string | null
  repo_link: string | null
  branch_name: string | null
  daily_logs: Array<{ date?: string; note?: string; author?: string }>
  additional_resources: Array<{ type?: string; title?: string; url?: string }>
  /** API may return or accept newline-separated strings instead of JSON arrays. */
  dependencies?: string | string[] | null
  related_systems?: string | string[] | null
  troubleshooting_notes?: string | null
  reconstruction_time?: string | number | null
  lifecycle_stage?: string | null
  created_at: string | number | null
  updated_at: string | number | null
}

function normalizeText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function normalizeDateOnly(value: unknown): string {
  const raw = normalizeText(value)
  if (!raw) return '—'
  const [datePart] = raw.split('T')
  return datePart || raw
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  }
  return []
}

function coerceNumericId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw.trim())
    if (Number.isFinite(n)) return n
  }
  return null
}

function normalizeNumericArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => coerceNumericId(item))
    .filter((item): item is number => item != null)
}

/** Integer minutes from API show as "N minutes"; other strings (e.g. ranges) pass through. */
function formatReconstructionTimeDisplay(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'number' && Number.isFinite(raw)) return `${raw} minutes`
  const s = normalizeText(raw)
  if (!s) return ''
  if (/^\d+$/.test(s)) return `${s} minutes`
  return s
}

function hasRelatedSystemsContent(baton: BatonApi): boolean {
  if (normalizeStringArray(baton.related_systems).length > 0) return true
  const resources = baton.additional_resources || []
  return resources.some(
    (r) => (r.type ?? '').toLowerCase() === 'related_system' && normalizeText(r.title).length > 0,
  )
}

function normalizeBatonStatus(status: string | undefined | null): string {
  return (status ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
}

function mapStatus(status: string): BatonTask['status'] {
  const s = normalizeBatonStatus(status)
  if (s === BATON_STATUS.HANDOVER_PENDING_APPROVAL) return 'Approve handover'
  if (s === BATON_STATUS.AWAITING_HANDOVER) return 'Awaiting Handover'
  if (s === BATON_STATUS.IN_PROGRESS) return 'In Progress'
  if (s === BATON_STATUS.DONE || s === 'completed' || s === 'complete') return 'Done'
  if (s === BATON_STATUS.ENRICH_TICKET || s === 'enrich') return 'Enrich Baton'
  return 'Waiting to Be Accepted'
}

function toneFromRiskLabel(label: string): RiskTone {
  const normalized = label.trim().toLowerCase()
  if (normalized === 'low risk') return 'green'
  if (normalized === 'medium risk') return 'amber'
  return 'red'
}

function normalizedRiskLabelFromApi(raw: unknown): string {
  const normalized = normalizeText(raw).toLowerCase()
  if (normalized === 'low risk') return 'Low Risk'
  if (normalized === 'medium risk') return 'Medium Risk'
  if (normalized === 'high risk' || normalized === 'critical risk') return 'High Risk'
  return 'Medium Risk'
}

/**
 * Matches backend `determine_lifecycle_stage`: `baton` when description + successors exist;
 * `imported_ticket` otherwise. If `lifecycle_stage` is omitted, infer from fields.
 * Related systems must be documented or the baton stays in Enrich.
 */
function isBatonPromotedPastEnrich(baton: BatonApi): boolean {
  const stage = (baton.lifecycle_stage ?? '').trim().toLowerCase()
  if (stage === 'imported_ticket') return false
  if (stage === 'baton') return true
  const hasDescription = Boolean(normalizeText(baton.description))
  const hasSuccessors = normalizeNumericArray(baton.successor_ids).length > 0
  const hasRelated = hasRelatedSystemsContent(baton)
  return hasDescription && hasSuccessors && hasRelated
}

function effectiveBatonColumn(args: {
  workflow: BatonTask['workflowStatus']
  documentationComplete: boolean
  ownerInOffice: boolean
}): BatonTask['status'] {
  const { workflow, documentationComplete, ownerInOffice } = args
  if (workflow === 'Done') return 'Done'
  if (!documentationComplete) return 'Enrich Baton'
  if (!ownerInOffice && workflow === 'Waiting to Be Accepted') return 'Waiting to Be Accepted'
  return workflow
}

/** Visual risk level for estimated reconstruction time: green = favorable, orange = medium, red = severe. */
function reconstructionRiskTone(raw: string | null | undefined): RiskTone {
  const v = normalizeText(raw).toLowerCase()
  if (!v || v === '—' || v === 'not set' || v === 'n/a' || v === 'unknown') return 'orange'
  if (/\b(week|month|year)s?\b|\b\d+\s*days?\b/i.test(v)) return 'red'
  const range = v.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (range) {
    const hi = Math.max(Number(range[1]), Number(range[2]))
    if (hi <= 4) return 'green'
    if (hi <= 24) return 'orange'
    return 'red'
  }
  const single = v.match(/^(\d+)\s*h/)
  if (single) {
    const h = Number(single[1])
    if (h <= 4) return 'green'
    if (h <= 24) return 'orange'
    return 'red'
  }
  if (/\b(low|minutes?|quick|short)\b/i.test(v)) return 'green'
  if (/\b(high|long|slow|severe)\b/i.test(v)) return 'red'
  return 'orange'
}

/**
 * FastAPI often types `dependencies` / `related_systems` as `str`; sending `[]` fails validation.
 * Accept UI arrays and serialize to newline-separated strings (empty → "").
 */
function normalizeBatonPatchBody(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload }
  if (Array.isArray(out.dependencies)) {
    out.dependencies = (out.dependencies as string[]).join('\n')
  }
  if (Array.isArray(out.related_systems)) {
    out.related_systems = (out.related_systems as string[]).join('\n')
  }
  if (typeof out.reconstruction_time === 'string') {
    const trimmed = out.reconstruction_time.trim()
    if (!trimmed) {
      out.reconstruction_time = null
    } else if (/^\d+$/.test(trimmed)) {
      out.reconstruction_time = Number(trimmed)
    } else {
      out.reconstruction_time = null
    }
  }
  return out
}

/** GET may return the baton object or a wrapper (`data`, `baton`). PATCH often returns an empty body — caller must GET after update. */
function unwrapBatonResponse(raw: unknown): BatonApi | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if ('owner_id' in r && ('id' in r || 'title' in r)) {
    return raw as BatonApi
  }
  const data = r.data
  if (data != null && typeof data === 'object' && 'owner_id' in data) {
    return data as BatonApi
  }
  const baton = r.baton
  if (baton != null && typeof baton === 'object' && 'owner_id' in baton) {
    return baton as BatonApi
  }
  return null
}

async function getBatonDetailMapped(id: string): Promise<BatonTaskDetail> {
  const raw = await httpRequest<unknown>({
    path: `/batons/${id}`,
    method: 'GET',
  })
  const baton = unwrapBatonResponse(raw)
  if (!baton) {
    throw new Error('Invalid or empty baton response from API.')
  }
  const mapped = mapBatonDetail(baton)
  return enrichBatonDetailSuccessorNames(mapped)
}

type TeamRiskApi = {
  team_id: number
  team_name: string
  division_id: number
  division_name: string
  staff_availability_percentage: number
  unassigned_baton_count: number
  total_baton_count?: number
  unassigned_baton_percentage?: number
  delivery_delay_risk: string
  overall_risk_score: number
}

type DivisionRiskApi = {
  division_id: number
  division_name: string
  staff_availability_percentage: number
  batons_ready_for_handover: number
  batons_unassigned: number
  overall_risk_score: number
}

type TeamPersonApi = {
  id: number
  name: string
  role: string
  in_office: boolean
}

type PersonApi = {
  id: number
  name?: string | null
  team_id?: number | null
  division_id?: number | null
  role?: string | null
  in_office?: boolean
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

function successorLabel(baton: BatonApi): string {
  return baton.successor_ids?.length ? 'Assigned' : 'Unassigned'
}

async function fetchPersonOfficeFlags(personIds: number[]): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>()
  const unique = [...new Set(personIds)].filter((id) => Number.isFinite(id))
  if (unique.length === 0) return map
  await Promise.all(
    unique.map(async (id) => {
      try {
        const p = await httpRequest<PersonApi>({
          path: `/person/${id}`,
          method: 'GET',
        })
        map.set(id, p.in_office !== false)
      } catch {
        map.set(id, true)
      }
    }),
  )
  return map
}

async function resolveSuccessorNames(successorIds: number[]): Promise<string[]> {
  const unique = [...new Set(successorIds)].filter((id) => Number.isFinite(id))
  if (unique.length === 0) return []
  const names = await Promise.all(
    unique.map(async (id) => {
      try {
        const person = await httpRequest<PersonApi>({
          path: `/person/${id}`,
          method: 'GET',
        })
        return person.name?.trim() || `User ${id}`
      } catch {
        return ''
      }
    }),
  )
  return names.filter((name): name is string => Boolean(name))
}

async function enrichBatonDetailSuccessorNames(detail: BatonTaskDetail): Promise<BatonTaskDetail> {
  const successorNames = await resolveSuccessorNames(detail.ownership.successorIds)
  return {
    ...detail,
    ownership: {
      ...detail.ownership,
      successor: successorNames.length > 0 ? successorNames.join(', ') : detail.ownership.successor,
    },
  }
}

function firstInOfficeSuccessorId(successorIds: number[], officeMap: Map<number, boolean>): number | null {
  for (const id of successorIds) {
    if (officeMap.get(id) !== false) return id
  }
  return null
}

async function applyBoardPlacement(tasks: BatonTask[]): Promise<BatonTask[]> {
  if (tasks.length === 0) return tasks
  const allIds: number[] = []
  tasks.forEach((t) => {
    allIds.push(t.ownerId)
    t.successorIds.forEach((id) => allIds.push(id))
  })
  const officeMap = await fetchPersonOfficeFlags(allIds)
  return tasks.map((task) => {
    const ownerInOffice = officeMap.get(task.ownerId) ?? true
    const handoverTargetId = firstInOfficeSuccessorId(task.successorIds, officeMap)
    const status = effectiveBatonColumn({
      workflow: task.workflowStatus,
      documentationComplete: task.documentationComplete,
      ownerInOffice,
    })
    return {
      ...task,
      ownerInOffice,
      handoverTargetId,
      status,
    }
  })
}


function mapBatonTask(baton: BatonApi): BatonTask | null {
  if (baton == null) {
    console.warn('[relay] Skipping invalid baton row:', baton)
    return null
  }

  const numericId = coerceNumericId(baton.id)
  if (numericId == null) {
    console.warn('[relay] Skipping baton with invalid id:', baton)
    return null
  }

  const ownerName = baton.owner_name?.trim() || `User ${baton.owner_id}`
  const projectLabel = baton.project_name?.trim() || `Project ${baton.project_id}`
  const teamLabel = baton.team_id != null ? `Team ${baton.team_id}` : `Team ${baton.project_id}`
  const successorIds = normalizeNumericArray(baton.successor_ids)
  const updatedAt = normalizeText(baton.updated_at)
  const createdAt = normalizeText(baton.created_at)
  const apiBatonStatus =
    typeof baton.baton_status === 'string' ? baton.baton_status : String(baton.baton_status ?? '')
  const workflowStatus = mapStatus(apiBatonStatus)
  const documentationComplete = isBatonPromotedPastEnrich(baton)
  const lifecycleStage = baton.lifecycle_stage != null ? String(baton.lifecycle_stage).trim() : null
  const resolvedRiskLabel = normalizedRiskLabelFromApi(baton.risk_label)

  return {
    id: String(numericId),
    ref: `BAT-${numericId}`,
    projectId: baton.project_id,
    teamId: baton.team_id ?? null,
    divisionId: baton.division_id ?? null,
    ownerId: coerceNumericId(baton.owner_id) ?? baton.owner_id,
    title: baton.title,
    team: teamLabel,
    project: projectLabel,
    owner: ownerName,
    successorIds,
    successor: successorLabel(baton),
    risk: resolvedRiskLabel,
    tone: toneFromRiskLabel(resolvedRiskLabel),
    apiBatonStatus,
    age: new Date(updatedAt || createdAt || Date.now()).toLocaleDateString(),
    workflowStatus,
    documentationComplete,
    ownerInOffice: true,
    handoverTargetId: null,
    lifecycleStage,
    status: workflowStatus,
  }
}

function withResolvedSuccessors(tasks: BatonTask[]): BatonTask[] {
  const ownerNamesById = new Map<number, string>()
  tasks.forEach((task) => {
    ownerNamesById.set(task.ownerId, task.owner)
  })

  return tasks.map((task) => {
    const names = task.successorIds
      .map((id) => {
        const knownName = ownerNamesById.get(id)?.trim()
        return knownName && knownName.length > 0 ? knownName : `User ${id}`
      })
      .filter((name): name is string => Boolean(name))
    return {
      ...task,
      successor: names.length ? names.join(', ') : 'Unassigned',
    }
  })
}

async function withResolvedSuccessorsFromPeople(tasks: BatonTask[]): Promise<BatonTask[]> {
  const missingIds = [
    ...new Set(
      tasks.flatMap((task) =>
        task.successorIds.filter((id) => !tasks.some((candidate) => Number(candidate.ownerId) === Number(id))),
      ),
    ),
  ]

  if (missingIds.length === 0) return withResolvedSuccessors(tasks)

  const namesById = new Map<number, string>()
  await Promise.all(
    missingIds.map(async (id) => {
      try {
        const person = await httpRequest<PersonApi>({
          path: `/person/${id}`,
          method: 'GET',
        })
        const name = person.name?.trim()
        if (name) namesById.set(id, name)
      } catch {
        // Keep fallback behavior if person lookup fails.
      }
    }),
  )

  const base = withResolvedSuccessors(tasks)
  return base.map((task) => {
    if (task.successorIds.length === 0) return task
    const names = task.successorIds.map((id) => {
      const fromPeople = namesById.get(id)?.trim()
      if (fromPeople) return fromPeople
      const fromTasks = base.find((candidate) => Number(candidate.ownerId) === Number(id))?.owner?.trim()
      if (fromTasks) return fromTasks
      return `User ${id}`
    })
    return {
      ...task,
      successor: names.join(', '),
    }
  })
}

function mapPersonToRosterMember(person: PersonApi): TeamRosterMember {
  return {
    id: person.id,
    name: person.name?.trim() || `User ${person.id}`,
    role: person.role?.trim() ?? '',
    in_office: person.in_office !== false,
  }
}

function ownerHistoryFromLogs(
  dailyLogs: Array<{ date?: string; note?: string; author?: string }>,
  currentOwner: string,
  createdDate: string,
): string {
  const ownerTransitions = dailyLogs
    .map((entry) => ({
      date: normalizeDateOnly(entry.date) || '—',
      note: normalizeText(entry.note),
    }))
    .filter((entry) => entry.note.startsWith('[OWNER_CHANGE] '))
    .map((entry) => `${entry.date}: ${entry.note.replace('[OWNER_CHANGE] ', '')}`)

  if (ownerTransitions.length === 0) {
    return `Created ${createdDate}\nCurrent owner: ${currentOwner}`
  }

  const firstTransition = ownerTransitions[0]
  const inferredInitialOwner = firstTransition.split(': ')[1]?.split(' -> ')[0] ?? '—'

  return [
    `Created ${createdDate}`,
    `Initial owner: ${inferredInitialOwner}`,
    ...ownerTransitions.map((line) => `Reassigned ${line}`),
    `Current owner: ${currentOwner}`,
  ].join('\n')
}

/** Short successor line: one is good; two or more is excellent. */
function successorCoverageLabel(successorCount: number): string {
  if (successorCount <= 0) return 'None'
  if (successorCount === 1) return 'Good'
  return 'Excellent'
}

function mapBatonDetail(baton: BatonApi): BatonTaskDetail {
  const mappedTask = mapBatonTask(baton)
  if (!mappedTask) {
    throw new Error('Invalid baton payload from API.')
  }
  const resolvedRiskLabel = normalizedRiskLabelFromApi(baton.risk_label)
  const resolvedRiskTone = toneFromRiskLabel(resolvedRiskLabel)
  const apiRiskScore = typeof baton.risk_score === 'number' && Number.isFinite(baton.risk_score) ? baton.risk_score : null
  const apiDocPct =
    typeof baton.documentation_completeness === 'number' && Number.isFinite(baton.documentation_completeness)
      ? baton.documentation_completeness
      : null
  const docPct = Math.max(0, Math.min(100, apiDocPct ?? 0))
  const resources = baton.additional_resources || []
  const dependencyFromResources = resources.filter((item) => (item.type ?? '').toLowerCase() === 'dependency')
  const relatedSystemFromResources = resources.filter((item) => (item.type ?? '').toLowerCase() === 'related_system')
  const troubleshootingResource = resources.find((item) => (item.type ?? '').toLowerCase() === 'troubleshooting_note')

  const apiDependencies = normalizeStringArray(baton.dependencies)
  const apiRelatedSystems = normalizeStringArray(baton.related_systems)
  const successorIds = normalizeNumericArray(baton.successor_ids)
  const createdDate = normalizeDateOnly(baton.created_at)
  const updatedDate = normalizeDateOnly(baton.updated_at)
  const reconstructionTime = normalizeText(baton.reconstruction_time)
  const sanitizedTroubleshooting = normalizeText(baton.troubleshooting_notes)
  const sanitizedTroubleshootingResource = normalizeText(troubleshootingResource?.title)
  const reconstructionDisplay = formatReconstructionTimeDisplay(baton.reconstruction_time)
  const sanitizedImplementation = normalizeText(baton.implementation_state)
  const sanitizedRepository = normalizeText(baton.repo_link)
  const sanitizedBranch = normalizeText(baton.branch_name)
  const sanitizedContext = normalizeText(baton.detailed_context)
  const sanitizedDescription = normalizeText(baton.description)
  return {
    id: mappedTask.id,
    ref: mappedTask.ref,
    projectId: baton.project_id,
    teamId: baton.team_id ?? null,
    title: mappedTask.title,
    status: mappedTask.workflowStatus,
    tone: resolvedRiskTone,
    riskLabel: resolvedRiskLabel,
    riskScore: apiRiskScore ?? 0,
    riskBand: resolvedRiskLabel.replace(/\s*Risk$/i, ''),
    created: createdDate,
    updated: updatedDate,
    service: mappedTask.project,
    reconstructionTime,
    reconstructionTimeDisplay: reconstructionDisplay || '-',
    ownership: {
      ownerId: baton.owner_id,
      successorIds,
      currentOwner: mappedTask.owner,
      successor: mappedTask.successor,
      ownerHistory: ownerHistoryFromLogs(baton.daily_logs ?? [], mappedTask.owner, createdDate),
    },
    documentation: {
      description: sanitizedDescription || '',
      context: sanitizedContext || '',
      implementation: sanitizedImplementation || '',
      dependencies:
        apiDependencies.length > 0
          ? apiDependencies
          : dependencyFromResources.length > 0
            ? dependencyFromResources.map((item) => item.title ?? 'Dependency')
            : [],
      operational: '',
      troubleshooting: sanitizedTroubleshooting || sanitizedTroubleshootingResource || '',
    },
    riskAnalysis: [
      {
        title: 'Delivery risk',
        value: resolvedRiskLabel,
        helper: '',
        tone: resolvedRiskTone,
      },
      {
        title: 'Successor coverage',
        value: successorCoverageLabel(successorIds.length),
        helper: '',
        tone: successorIds.length ? 'green' : 'red',
      },
      {
        title: 'Documentation completeness',
        value: `${docPct}%`,
        helper: '',
        tone: docPct >= 70 ? 'green' : docPct >= 40 ? 'amber' : 'red',
      },
      {
        title: 'Reconstruction time',
        value: reconstructionDisplay || '',
        helper: '',
        tone: reconstructionRiskTone(reconstructionTime),
      },
    ],
    technicalLinks: {
      repository: sanitizedRepository || '',
      branch: sanitizedBranch || '',
      environment: sanitizedImplementation || '',
      relatedSystems:
        apiRelatedSystems.length > 0
          ? apiRelatedSystems
          : relatedSystemFromResources.map((item) => item.title ?? 'Related system'),
      additionalResources: resources.map((item) => ({
        type: item.type ?? 'resource',
        title: item.title ?? 'Resource',
        url: item.url ?? '',
      })),
    },
    dailyLog: {
      author: baton.daily_logs?.[0]?.author ?? '',
      message: baton.daily_logs?.[0]?.note ?? '',
      time: '',
      blockers: '',
      date: normalizeDateOnly(baton.daily_logs?.[0]?.date) || '',
    },
    dailyLogs: (baton.daily_logs ?? []).map((entry) => ({
      date: normalizeDateOnly(entry.date) || updatedDate,
      note: entry.note ?? '',
      author: entry.author ?? mappedTask.owner,
    })),
  }
}

function deliveryRiskTone(risk: string): RiskTone {
  const normalized = risk.toLowerCase()
  if (normalized === 'high') return 'red'
  if (normalized === 'medium') return 'amber'
  return 'green'
}

/** Same formula as team detail `% Handover ready` (from overall risk score). */
function handoverReadyPercentFromRiskScore(overallRiskScore: number): string {
  return `${Math.max(0, 100 - Math.round(overallRiskScore * 0.7))}%`
}

function mapTeamRiskRow(row: TeamRiskApi): TeamRisk {
  const staffPct = row.staff_availability_percentage
  const unassignedPctRaw = Number(row.unassigned_baton_percentage)
  const unassignedPct = Number.isFinite(unassignedPctRaw) ? Math.max(0, Math.min(100, Math.round(unassignedPctRaw))) : 0
  const delayRisk = (row.delivery_delay_risk ?? 'low').toLowerCase()

  return {
    id: String(row.team_id),
    divisionId: row.division_id,
    name: row.team_name,
    division: row.division_name,
    staffAvailability: `${Math.round(staffPct)}%`,
    documentationReadiness: handoverReadyPercentFromRiskScore(row.overall_risk_score),
    unassignedResponsibilities: unassignedPct,
    deliveryDelays: delayRisk.charAt(0).toUpperCase() + delayRisk.slice(1),
    riskScore: String(row.overall_risk_score),
    tone: deliveryRiskTone(delayRisk),
  }
}

function mapDivisionRiskRow(row: DivisionRiskApi): DivisionRisk {
  return {
    division_id: row.division_id,
    division_name: row.division_name,
    staff_availability_percentage: row.staff_availability_percentage,
    batons_ready_for_handover: row.batons_ready_for_handover,
    batons_unassigned: row.batons_unassigned,
    overall_risk_score: row.overall_risk_score,
  }
}

async function tryFetchTeamPeople(teamId: string): Promise<TeamPersonApi[]> {
  const paths = [`/teams/${teamId}/people`, `/people?team_id=${encodeURIComponent(teamId)}`]
  for (const path of paths) {
    try {
      const data = await httpRequestList<TeamPersonApi>({
        path,
        method: 'GET',
      })
      if (data.length > 0) return data
    } catch {
      continue
    }
  }
  return []
}

async function fetchBatonsForTeam(teamNumericId: number): Promise<BatonApi[]> {
  const direct = await httpRequestList<BatonApi>({
    path: `/batons${buildQuery({ team_id: teamNumericId })}`,
    method: 'GET',
  })
  if (direct.length > 0) return direct

  const all = await httpRequestList<BatonApi>({ path: '/batons', method: 'GET' })
  return all.filter((baton) => baton.team_id === teamNumericId)
}

function mapTeamBatonRow(
  baton: BatonApi,
  ownerOfficeMap: Map<number, boolean>,
): TeamDetail['batons'][number] {
  const task = mapBatonTask(baton)
  const ownerInOffice = ownerOfficeMap.get(baton.owner_id) !== false
  const ownerStatus: TeamDetail['batons'][number]['ownerStatus'] = ownerInOffice ? 'Active' : 'Out'

  if (!task) {
    return {
      id: `BAT-${baton.id}`,
      taskId: String(baton.id),
      ownerId: baton.owner_id,
      title: baton.title ?? 'Untitled',
      owner: baton.owner_name?.trim() ?? `User ${baton.owner_id}`,
      ownerStatus,
      successor: '—',
      state: 'Unknown',
      risk: 'Low Risk',
      docs: 'Missing',
    }
  }
  return {
    id: task.ref,
    taskId: task.id,
    ownerId: task.ownerId,
    title: task.title,
    owner: task.owner,
    ownerStatus,
    successor: task.successor,
    state: task.workflowStatus,
    risk:
      task.risk === 'High Risk' ||
      task.risk === 'Medium Risk' ||
      task.risk === 'Low Risk'
        ? task.risk
        : 'Medium Risk',
    docs: baton.description ? 'Complete' : 'Missing',
  }
}

function buildStaffFromBatonsFallback(
  batons: BatonApi[],
  ownerOfficeMap: Map<number, boolean>,
): TeamDetail['staff'] {
  const byOwner = new Map<number, TeamDetail['staff'][number]>()
  batons.forEach((baton) => {
    if (!byOwner.has(baton.owner_id)) {
      const ownerInOffice = ownerOfficeMap.get(baton.owner_id) !== false
      byOwner.set(baton.owner_id, {
        id: baton.owner_id,
        name: baton.owner_name?.trim() || `User ${baton.owner_id}`,
        role: '',
        status: ownerInOffice ? 'Active' : 'Out',
        successor: 'No Successor',
      })
    }
  })
  return Array.from(byOwner.values())
}

export const apiRelayDataSource: RelayDataSource = {
  login: async (credentials) => {
    const auth = await httpRequest<{ user_id: number; name: string; role: string }>({
      path: '/auth/login',
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    try {
      const person = await httpRequest<PersonApi>({
        path: `/person/${auth.user_id}`,
        method: 'GET',
      })
      return {
        user_id: auth.user_id,
        name: auth.name,
        role: auth.role,
        team_id: person.team_id ?? undefined,
        division_id: person.division_id ?? undefined,
      }
    } catch {
      return {
        user_id: auth.user_id,
        name: auth.name,
        role: auth.role,
      }
    }
  },

  getDivisionRisk: async (divisionId) => {
    const query = buildQuery({ division_id: divisionId })
    const response = await httpRequestList<DivisionRiskApi>({
      path: `/division/risk${query}`,
      method: 'GET',
    })
    return response.map(mapDivisionRiskRow)
  },

  getTeamsAtRisk: async (filters) => {
    const query = buildQuery({ team_id: filters?.teamId })
    const response = await httpRequestList<TeamRiskApi>({
      path: `/teams/risk${query}`,
      method: 'GET',
    })
    return response.map(mapTeamRiskRow)
  },

  getBatonTasks: async (filters) => {
    const query = buildQuery({
      owner_id: filters?.ownerId,
      project_id: filters?.projectId,
      team_id: filters?.teamId,
    })
    const response = await httpRequestList<BatonApi>({
      path: `/batons${query}`,
      method: 'GET',
    })
    const tasks = response.map(mapBatonTask).filter((task): task is BatonTask => task != null)
    const withNames = await withResolvedSuccessorsFromPeople(tasks)
    return applyBoardPlacement(withNames)
  },

  getTeamRoster: async (teamId: string) => {
    const rows = await tryFetchTeamPeople(teamId)
    return rows.map((person) => ({
      id: person.id,
      name: person.name?.trim() || `User ${person.id}`,
      role: person.role?.trim() || '',
      in_office: person.in_office !== false,
    }))
  },

  getPerson: async (personId: number) => {
    const person = await httpRequest<PersonApi>({
      path: `/person/${personId}`,
      method: 'GET',
    })
    return mapPersonToRosterMember(person)
  },

  getBatonTaskDetail: async (id: string) => getBatonDetailMapped(id),

  getTeamDetail: async (id: string) => {
    const teamNumericId = Number(id)
    if (!Number.isFinite(teamNumericId)) {
      throw new Error('Invalid team id.')
    }

    const [riskRows, batons, people] = await Promise.all([
      httpRequestList<TeamRiskApi>({
        path: `/teams/risk${buildQuery({ team_id: teamNumericId })}`,
        method: 'GET',
      }),
      fetchBatonsForTeam(teamNumericId),
      tryFetchTeamPeople(id),
    ])

    const risk = riskRows[0]
    if (!risk) {
      throw new Error('Team not found or no risk data returned.')
    }

    const ownerIds = [...new Set(batons.map((b) => b.owner_id))]
    const peopleIds = people.map((p) => p.id)
    const officeIds = [...new Set([...ownerIds, ...peopleIds])]
    const ownerOfficeMap = await fetchPersonOfficeFlags(officeIds)

    const staff: TeamDetail['staff'] =
      people.length > 0
        ? people.map((person) => {
            const io = ownerOfficeMap.get(person.id)
            const inOffice = io !== undefined ? io : person.in_office !== false
            return {
              id: person.id,
              name: person.name,
              role: person.role,
              status: inOffice ? 'Active' : 'Out',
              successor: 'No Successor',
            }
          })
        : buildStaffFromBatonsFallback(batons, ownerOfficeMap)

    const delayRisk = (risk.delivery_delay_risk ?? 'low').toLowerCase()
    const riskLabel = delayRisk.charAt(0).toUpperCase() + delayRisk.slice(1)

    return {
      id: String(risk.team_id),
      name: risk.team_name,
      divisionId: risk.division_id ?? null,
      riskLabel,
      tone: deliveryRiskTone(delayRisk),
      staff,
      metrics: {
        handoverReady: handoverReadyPercentFromRiskScore(risk.overall_risk_score),
        unassigned: `${Math.max(0, Math.min(100, Math.round(risk.unassigned_baton_percentage ?? 0)))}%`,
        reconstructionTime: normalizeText(batons.find((b) => b.reconstruction_time)?.reconstruction_time) || '—',
        criticalDelays: riskLabel,
      },
      batons: batons.map((b) => mapTeamBatonRow(b, ownerOfficeMap)),
    }
  },

  updateBaton: async (id, payload) => {
    const body = normalizeBatonPatchBody(payload as Record<string, unknown>)
    const raw = await httpRequest<unknown>({
      path: `/batons/${id}`,
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    const fromPatch = unwrapBatonResponse(raw)
    if (fromPatch) {
      const mapped = mapBatonDetail(fromPatch)
      return enrichBatonDetailSuccessorNames(mapped)
    }
    return getBatonDetailMapped(id)
  },
}
