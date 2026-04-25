import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import type { TeamDetail } from '../../types/domain'

type TeamStaffCardProps = {
  staff: TeamDetail['staff']
  batons: TeamDetail['batons']
  selectedStaffName: string
  onSelectStaff: (name: string) => void
}

export function TeamStaffCard({ staff, batons, selectedStaffName, onSelectStaff }: TeamStaffCardProps) {
  const orderedStaff = [...staff].sort((a, b) => {
    const aOut = a.status !== 'Active'
    const bOut = b.status !== 'Active'
    if (aOut !== bOut) return aOut ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <Card className="!flex min-h-[124px] !max-h-[min(260px,50vh)] !flex-1 !flex-col !overflow-hidden !p-0">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-200">
          {orderedStaff.map((person) => {
            const pid = person.id
            const ticketCount =
              pid != null ? batons.filter((b) => b.ownerId === pid).length : 0
            const inOffice = person.status === 'Active'
            const isSelected = selectedStaffName === person.name
            return (
              <div key={pid ?? person.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectStaff(isSelected ? '' : person.name)}
                    className={`text-sm ${
                      isSelected
                        ? 'font-semibold text-blue-800 underline decoration-blue-300 underline-offset-2'
                        : 'text-slate-900 hover:text-blue-700 hover:underline hover:decoration-blue-300 hover:underline-offset-2'
                    }`}
                  >
                    {person.name}
                  </button>
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    tone={inOffice ? 'green' : 'red'}
                    label={inOffice ? 'In office' : 'Out of office'}
                    className="text-[11px] font-semibold"
                  />
                  <p className="mt-1 text-sm tabular-nums text-slate-600">{ticketCount} tickets</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
