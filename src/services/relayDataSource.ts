import type {
  AuthUser,
  BatonTask,
  BatonTaskDetail,
  DivisionRisk,
  TeamDetail,
  TeamRisk,
  TeamRosterMember,
} from '../types/domain'

export type { TeamRosterMember }

export type RelayDataSource = {
  login: (credentials: { username: string; password: string }) => Promise<AuthUser>
  getDivisionRisk: (divisionId?: number) => Promise<DivisionRisk[]>
  getTeamsAtRisk: (filters?: { teamId?: number }) => Promise<TeamRisk[]>
  getBatonTasks: (filters?: {
    ownerId?: number
    projectId?: number
    teamId?: number
    divisionId?: number
  }) => Promise<BatonTask[]>
  getBatonTaskDetail: (id: string) => Promise<BatonTaskDetail>
  updateBaton: (
    id: string,
    payload: Partial<{
      baton_status: string
      owner_id: number
      successor_ids: number[]
      title: string
      description: string
      detailed_context: string
      implementation_state: string
      repo_link: string
      branch_name: string
      dependencies: string[]
      related_systems: string[]
      troubleshooting_notes: string
      reconstruction_time: string
      additional_resources: Array<{ type: string; title: string; url: string }>
      daily_logs: Array<{ date: string; note: string; author: string }>
    }>,
  ) => Promise<BatonTaskDetail>
  getTeamDetail: (id: string) => Promise<TeamDetail>
  /** Team members for workforce UI; falls back to empty if API has no roster route. */
  getTeamRoster: (teamId: string) => Promise<TeamRosterMember[]>
  getPerson: (personId: number) => Promise<TeamRosterMember>
}
