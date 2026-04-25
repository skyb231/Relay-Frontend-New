export const BATON_STATUS = {
  ENRICH_TICKET: 'enrich_ticket',
  IN_PROGRESS: 'in_progress',
  AWAITING_HANDOVER: 'awaiting_handover',
  DONE: 'done',
  HANDOVER_PENDING_APPROVAL: 'handover_pending_approval',
} as const

export type BatonStatusValue = (typeof BATON_STATUS)[keyof typeof BATON_STATUS]
