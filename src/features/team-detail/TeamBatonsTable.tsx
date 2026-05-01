import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES, type TeamDetailLocationState } from '../../app/routes'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { Table } from '../../components/ui/Table'
import type { TeamDetail } from '../../types/domain'

const teamHeaders = ['Baton ID', 'Title', 'Owner', 'Successor', 'State', 'Risk', 'Docs']

const cell = 'px-3 py-3.5 text-sm text-slate-600 sm:px-4'

type TeamBatonsTableProps = {
  batons: TeamDetail['batons']
  teamId: string
  preselectedStaff?: string
  onStaffFilterChange?: (owner: string) => void
}

export function TeamBatonsTable({ batons, teamId, preselectedStaff = '', onStaffFilterChange }: TeamBatonsTableProps) {
  const location = useLocation()
  const teamNav = location.state as TeamDetailLocationState | undefined
  const viaDashboard = teamNav?.from === 'dashboard'

  const [riskFilter, setRiskFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')

  useEffect(() => {
    setStaffFilter(preselectedStaff)
  }, [preselectedStaff])

  const riskOptions = useMemo(() => {
    const unique = [...new Set(batons.map((b) => b.risk))].sort()
    return unique
  }, [batons])

  const staffOptions = useMemo(() => {
    const unique = [...new Set(batons.map((b) => b.owner))].sort((a, b) => a.localeCompare(b))
    return unique
  }, [batons])

  const filteredBatons = useMemo(() => {
    return batons.filter((baton) => {
      if (riskFilter && baton.risk !== riskFilter) return false
      if (staffFilter && baton.owner !== staffFilter) return false
      return true
    })
  }, [batons, riskFilter, staffFilter])

  const linkState = { from: 'team' as const, teamId, ...(viaDashboard ? { viaDashboard: true as const } : {}) }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Batons</h2>
        <p className="mt-0.5 text-xs text-slate-500">Team batons and handover status</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Select
            className="h-9 border-slate-200 bg-white text-sm"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="">Risk: All</option>
            {riskOptions.map((risk) => (
              <option key={risk} value={risk}>
                {risk}
              </option>
            ))}
          </Select>
          <Select
            className="h-9 border-slate-200 bg-white text-sm"
            value={staffFilter}
            onChange={(event) => {
              const next = event.target.value
              setStaffFilter(next)
              onStaffFilterChange?.(next)
            }}
          >
            <option value="">Staff: All</option>
            {staffOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Table className="rounded-none border-0 shadow-none" headers={teamHeaders}>
        {filteredBatons.map((baton) => (
          <tr key={baton.id} className="transition-colors hover:bg-slate-50/90">
            <td className={cell}>
              <Link
                to={ROUTES.batonDetail(baton.taskId)}
                state={linkState}
                className="text-sm text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
              >
                {baton.id}
              </Link>
            </td>
            <td className={cell}>{baton.title}</td>
            <td className={cell}>
              <span>{baton.owner}</span>
              <Badge
                tone={baton.ownerStatus === 'Active' ? 'green' : 'red'}
                label={baton.ownerStatus === 'Active' ? 'In office' : 'Out of office'}
                className="ml-2 text-[11px] font-semibold"
              />
            </td>
            <td className={cell}>{baton.successor}</td>
            <td className={cell}>{baton.state}</td>
            <td className={cell}>
              <Badge
                tone={
                  baton.risk === 'Low Risk' ? 'green' : baton.risk === 'Medium Risk' ? 'yellow' : baton.risk === 'High Risk' ? 'red' : 'red'
                }
                label={baton.risk}
                className="text-[11px] font-semibold"
              />
            </td>
            <td className={cell}>
              <Badge
                tone={baton.docs === 'Complete' ? 'green' : baton.docs === 'Partial' ? 'yellow' : 'red'}
                label={baton.docs}
                className="text-[11px] font-semibold"
              />
            </td>
          </tr>
        ))}
      </Table>
    </section>
  )
}
