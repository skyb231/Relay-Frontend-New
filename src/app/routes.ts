export const ROUTES = {
  login: '/login',
  resilienceDashboard: '/resilience-dashboard',
  batons: '/batons',
  teamDetail: (teamId: string) => `/teams/${teamId}`,
  batonDetail: (batonId: string) => `/batons/${batonId}`,
} as const

/** Pass as `navigate(..., { state })` so baton detail can prioritize contextual back links. */
export type BatonDetailLocationState = {
  from?: 'baton-board' | 'team' | 'dashboard'
  /** Set when opening a baton from a team’s baton table */
  teamId?: string
  /** True when the team page was opened from the resilience dashboard (chain: dashboard → team → baton). */
  viaDashboard?: boolean
  /** Opens the matching section editor after load (e.g. from baton board “Reassign”). */
  openEditor?: 'ownership'
}

export type TeamDetailLocationState = {
  from?: 'dashboard'
}
