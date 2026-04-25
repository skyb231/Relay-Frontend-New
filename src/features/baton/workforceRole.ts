import { normalizeRole } from '../../roles'

/** Short label for roster / API role strings. */
export function formatWorkforceRole(raw: string | undefined | null): string {
  const r = normalizeRole(raw ?? '')
  if (r === 'team_lead') return 'Team lead'
  if (r === 'software_engineer') return 'Software engineer'
  if (r === 'resilience_manager') return 'Resilience manager'
  return (raw ?? '').trim()
}
