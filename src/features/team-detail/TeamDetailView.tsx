import { useState } from 'react'
import { PageBackNav } from '../../components/navigation/PageBackNav'
import { ROUTES } from '../../app/routes'
import type { TeamDetail } from '../../types/domain'
import { TeamBatonsTable } from './TeamBatonsTable'
import { TeamMetricsGrid } from './TeamMetricsGrid'
import { TeamStaffCard } from './TeamStaffCard'

type TeamDetailViewProps = {
  detail: TeamDetail
}

export function TeamDetailView({ detail }: TeamDetailViewProps) {
  const [staffFilter, setStaffFilter] = useState('')

  return (
    <div className="space-y-6">
      <PageBackNav to={ROUTES.resilienceDashboard}>Back</PageBackNav>

      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{detail.name}</h1>

      <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch lg:gap-6">
        <div className="flex min-h-0 flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Team availability</h2>
          <TeamStaffCard
            staff={detail.staff}
            batons={detail.batons}
            selectedStaffName={staffFilter}
            onSelectStaff={setStaffFilter}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-2 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Risk metrics</h2>
          <TeamMetricsGrid metrics={detail.metrics} />
        </div>
      </div>

      <TeamBatonsTable
        batons={detail.batons}
        teamId={detail.id}
        preselectedStaff={staffFilter}
        onStaffFilterChange={setStaffFilter}
      />
    </div>
  )
}
