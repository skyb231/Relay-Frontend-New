import { InsightIconTile, insightCardFrameClassName } from '../../components/ui/InsightStatCard'
import { cn } from '../../components/ui/cn'
import { formatWorkforceRole } from './workforceRole'

type WorkforceCardProps = {
  ownerId: number
  name: string
  roleLabel: string
  batons: number
  inOffice: boolean
  isFiltered: boolean
  onSelect: (ownerId: number) => void
}

function WorkforceCard({
  ownerId,
  name,
  roleLabel,
  batons,
  inOffice,
  isFiltered,
  onSelect,
}: WorkforceCardProps) {
  const variant = inOffice ? 'success' : 'danger'

  return (
    <button
      type="button"
      className={cn(
        insightCardFrameClassName(
          variant,
          'min-w-[168px] max-w-[200px] shrink-0 items-start gap-2 p-2.5 text-left transition hover:brightness-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500/45',
        ),
        isFiltered &&
          'z-[1] border-blue-400/70 ring-2 ring-blue-400/45 shadow-[0_2px_10px_rgba(37,99,235,0.14)]',
      )}
      onClick={() => onSelect(ownerId)}
    >
      <InsightIconTile
        variant={variant}
        className="!h-8 !w-8 shrink-0 [&_svg]:!h-4 [&_svg]:!w-4"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 self-stretch py-0.5">
        <div className="min-w-0">
          <p className="line-clamp-2 text-left text-sm font-semibold leading-tight text-slate-800">{name}</p>
          {roleLabel.trim() ? (
            <p className="mt-0.5 text-[11px] font-medium capitalize leading-snug text-slate-500">{roleLabel}</p>
          ) : null}
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
            {inOffice ? 'In office' : 'Out of office'}
          </p>
        </div>
        <div className="mt-auto border-t border-slate-100/90 pt-1.5">
          <p className="text-xl font-semibold tabular-nums tracking-tight text-slate-900">{batons}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Batons</p>
        </div>
      </div>
    </button>
  )
}

export type WorkforcePerson = {
  ownerId: number
  name: string
  role: string
  batons: number
  inOffice: boolean
}

type WorkforceSnapshotProps = {
  people: WorkforcePerson[]
  selectedOwnerId: number | null
  onSelectOwner: (ownerId: number) => void
}

export function WorkforceSnapshot({ people, selectedOwnerId, onSelectOwner }: WorkforceSnapshotProps) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Team Workforce Snapshot</p>
      <div className="workforce-scroll overflow-x-auto pb-1">
        <div className="flex min-w-max gap-3">
          {people.map((person) => (
            <WorkforceCard
              key={person.ownerId}
              ownerId={person.ownerId}
              name={person.name}
              roleLabel={formatWorkforceRole(person.role)}
              batons={person.batons}
              inOffice={person.inOffice}
              isFiltered={selectedOwnerId === person.ownerId}
              onSelect={onSelectOwner}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
