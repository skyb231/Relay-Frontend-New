export const ROUTES = {
  login: '/login',
  resilienceDashboard: '/resilience-dashboard',
  batons: '/batons',
  teamDetail: (teamId: string) => `/teams/${teamId}`,
  batonDetail: (batonId: string) => `/batons/${batonId}`,
} as const

export type BatonDetailLocationState = {
  from?: 'baton-board' | 'team' | 'dashboard'
  teamId?: string
  viaDashboard?: boolean
  openEditor?: 'ownership'
}

export type TeamDetailLocationState = {
  from?: 'dashboard'
}
