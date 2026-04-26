export type RiskTone = 'green' | 'amber' | 'yellow' | 'orange' | 'red'

export type DivisionRisk = {
  division_id: number
  division_name: string
  staff_availability_percentage: number
  batons_ready_for_handover: number
  batons_unassigned: number
  overall_risk_score: number
}

export type TeamRisk = {
  id: string
  divisionId?: number
  name: string
  division: string
  staffAvailability: string
  documentationReadiness: string
  unassignedResponsibilities: number
  deliveryDelays: string
  riskScore: string
  tone: RiskTone
}

export type BatonColumnStatus =
  | 'Approve handover'
  | 'Waiting to Be Accepted'
  | 'Enrich Baton'
  | 'In Progress'
  | 'Awaiting Handover'
  | 'Done'

export type TeamRosterMember = {
  id: number
  name: string
  role: string
  in_office: boolean
}

export type BatonTask = {
  id: string
  ref: string
  projectId: number
  teamId: number | null
  divisionId: number | null
  ownerId: number
  title: string
  team: string
  project: string
  owner: string
  successorIds: number[]
  successor: string
  risk: string
  tone: RiskTone
  /** Raw `baton_status` from the API — board column uses workflow + docs + OOO rules; risk badge uses composite score. */
  apiBatonStatus: string
  age: string
  /** Column placement on the board (accounts for out-of-office + documentation rules). */
  status: BatonColumnStatus
  /** Workflow state from `baton_status` before board rules. */
  workflowStatus: BatonColumnStatus
  /** True when the baton is promoted past “imported” (API `lifecycle_stage` or description+successors heuristic). */
  documentationComplete: boolean
  /** From `GET /person/{owner_id}`; drives board column when false. */
  ownerInOffice: boolean
  /** When the owner is out of office, first in-office successor in order (for handover). */
  handoverTargetId: number | null
  /** API `lifecycle_stage` (`imported_ticket` stays in Enrich until docs + backend promotion). */
  lifecycleStage: string | null
}

export type BatonTaskDetail = {
  id: string
  ref: string
  projectId: number
  teamId: number | null
  title: string
  status: string
  tone: RiskTone
  riskLabel: string
  /** 0–100 composite operational risk (higher = worse). */
  riskScore: number
  /** Short band aligned with `riskScore` (e.g. Low, Medium, High, Critical). */
  riskBand: string
  created: string
  updated: string
  service: string
  /** Estimated time to recreate / restore service (from API `reconstruction_time`). */
  reconstructionTime: string
  /** Human-readable reconstruction estimate for display (e.g. minutes suffix for numeric API values). */
  reconstructionTimeDisplay: string
  ownership: {
    ownerId: number
    successorIds: number[]
    currentOwner: string
    successor: string
    ownerHistory: string
  }
  documentation: {
    description: string
    context: string
    implementation: string
    dependencies: string[]
    operational: string
    troubleshooting: string
  }
  riskAnalysis: Array<{
    title: string
    value: string
    helper: string
    tone: RiskTone | 'slate'
  }>
  technicalLinks: {
    repository: string
    branch: string
    environment: string
    relatedSystems: string[]
    additionalResources: Array<{ type: string; title: string; url: string }>
  }
  dailyLog: {
    author: string
    message: string
    time: string
    blockers: string
    date: string
  }
  dailyLogs: Array<{ date: string; note: string; author: string }>
}

export type TeamDetail = {
  id: string
  name: string
  divisionId: number | null
  riskLabel: string
  tone: RiskTone
  staff: Array<{
    id?: number
    name: string
    role: string
    status: 'Active' | 'Out'
    successor: 'Successor' | 'No Successor'
  }>
  metrics: {
    handoverReady: string
    unassigned: string
    reconstructionTime: string
    criticalDelays: string
  }
  batons: Array<{
    id: string
    taskId: string
    ownerId: number
    title: string
    owner: string
    ownerStatus: 'Active' | 'Out'
    successor: string
    state: string
    risk: 'Low Risk' | 'Medium Risk' | 'High Risk'
    docs: 'Missing' | 'Partial' | 'Complete'
  }>
}

export type AuthUser = {
  user_id: number
  name: string
  role: string
  team_id?: number
  division_id?: number
}
