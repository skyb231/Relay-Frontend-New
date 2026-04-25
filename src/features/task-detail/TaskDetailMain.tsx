import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { BatonTaskDetail } from '../../types/domain'

type TaskDetailMainProps = {
  detail: BatonTaskDetail
  readOnly: boolean
  onEditOverview: () => void
  onEditOwnership: () => void
  onEditDocumentation: () => void
  onEditTechnicalLinks: () => void
  onEditResources: () => void
  onEditReconstructionTime: () => void
  onAddLogEntry: () => void
}

const body = 'text-sm leading-relaxed text-slate-700'
const label = 'text-xs font-medium text-slate-500'

type MetaItemProps = {
  label: string
  value: string
}

function MetaItem({ label: metaLabel, value }: MetaItemProps) {
  return (
    <div>
      <p className={label}>{metaLabel}</p>
      <p className={`mt-0.5 ${body}`}>{value}</p>
    </div>
  )
}

type TextBlockProps = {
  title: string
  value: string
}

function TextBlock({ title, value }: TextBlockProps) {
  const hasValue = value.trim().length > 0
  return (
    <div className={body}>
      <span className="font-semibold text-slate-800">{title}</span>
      <p className="mt-1 whitespace-pre-wrap text-slate-700">
        {hasValue ? value : <span className="italic text-slate-400">Not provided</span>}
      </p>
    </div>
  )
}

const sectionTitle = 'text-sm font-semibold tracking-tight text-slate-800'

export function TaskDetailMain({
  detail,
  readOnly,
  onEditOverview,
  onEditOwnership,
  onEditDocumentation,
  onEditTechnicalLinks,
  onEditResources,
  onEditReconstructionTime,
  onAddLogEntry,
}: TaskDetailMainProps) {
  const visibleDailyLogs = detail.dailyLogs
    .filter((entry) => {
      const note = entry.note.trim()
      return note.length > 0 && !note.startsWith('[OWNER_CHANGE]')
    })
    .slice()
    .reverse()
  const hasDailyLogEntry = visibleDailyLogs.length > 0

  return (
    <div className="space-y-5 text-sm">
      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">{detail.ref}</p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{detail.title}</h2>
          </div>
          {!readOnly ? (
            <Button
              variant="secondary"
              className="h-8 border border-slate-300 bg-white px-3 py-0 text-sm"
              onClick={onEditOverview}
            >
              Edit
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="slate" label={detail.status} className="text-xs font-semibold" />
        </div>
        <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
          <MetaItem label="Created" value={detail.created} />
          <MetaItem label="Last Updated" value={detail.updated} />
          <MetaItem label="Service" value={detail.service} />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={sectionTitle}>Ownership</h3>
          {!readOnly ? (
            <Button variant="secondary" className="h-8 px-3 py-0 text-sm" onClick={onEditOwnership}>
              Reassign
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className={label}>Current owner</p>
            <p className={body}>{detail.ownership.currentOwner}</p>
          </div>
          <div>
            <p className={label}>Successor (next in line)</p>
            <p className={body}>{detail.ownership.successor || 'Unassigned'}</p>
          </div>
        </div>
        <div>
          <p className={`mb-1 ${label}`}>Owner history</p>
          <div className={`whitespace-pre-line rounded-md bg-slate-50 px-3 py-2 ${body} text-slate-600`}>
            {detail.ownership.ownerHistory}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={sectionTitle}>Documentation</h3>
          {!readOnly ? (
            <Button variant="secondary" className="h-8 px-3 py-0 text-sm" onClick={onEditDocumentation}>
              Edit
            </Button>
          ) : null}
        </div>
        <p className={body}>
          {detail.documentation.description.trim() ? (
            detail.documentation.description
          ) : (
            <span className="italic text-slate-400">Not provided</span>
          )}
        </p>
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <TextBlock title="Detailed context" value={detail.documentation.context} />
          <TextBlock title="Implementation state" value={detail.documentation.implementation} />
          <TextBlock title="Dependencies" value={detail.documentation.dependencies.join(', ')} />
          <TextBlock title="Troubleshooting notes" value={detail.documentation.troubleshooting} />
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={sectionTitle}>Estimated reconstruction time</h3>
          </div>
          {!readOnly ? (
            <Button variant="secondary" className="h-8 shrink-0 px-3 py-0 text-sm" onClick={onEditReconstructionTime}>
              Edit
            </Button>
          ) : null}
        </div>
        <p className={`rounded-md border border-slate-100 bg-slate-50/90 px-3 py-2.5 ${body}`}>
          {detail.reconstructionTimeDisplay.trim() ? (
            detail.reconstructionTimeDisplay
          ) : (
            <span className="italic text-slate-400">Not provided</span>
          )}
        </p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={sectionTitle}>Technical links</h3>
          {!readOnly ? (
            <Button variant="secondary" className="h-8 px-3 py-0 text-sm" onClick={onEditTechnicalLinks}>
              Edit
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className={label}>Repository</p>
            <p className={body}>
              {detail.technicalLinks.repository.trim() ? (
                detail.technicalLinks.repository
              ) : (
                <span className="italic text-slate-400">Not provided</span>
              )}
            </p>
          </div>
          <div>
            <p className={label}>Branch</p>
            <p className={body}>
              {detail.technicalLinks.branch.trim() ? (
                detail.technicalLinks.branch
              ) : (
                <span className="italic text-slate-400">Not provided</span>
              )}
            </p>
          </div>
          <div>
            <p className={label}>Environment</p>
            <p className={body}>
              {detail.technicalLinks.environment.trim() ? (
                detail.technicalLinks.environment
              ) : (
                <span className="italic text-slate-400">Not provided</span>
              )}
            </p>
          </div>
          <div>
            <p className={label}>Related systems</p>
            <p className={`mt-1 ${body}`}>
              {detail.technicalLinks.relatedSystems.join(', ').trim() ? (
                detail.technicalLinks.relatedSystems.join(', ')
              ) : (
                <span className="italic text-slate-400">Not provided</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 !pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className={sectionTitle}>Daily log</h3>
          {!readOnly ? (
            <Button
              variant="secondary"
              className="h-8 shrink-0 border border-slate-300 bg-white px-3 py-0 text-sm"
              onClick={onAddLogEntry}
            >
              + Add entry
            </Button>
          ) : null}
        </div>
        {hasDailyLogEntry ? (
          <div className="space-y-2">
            {visibleDailyLogs.map((entry, index) => (
              <div key={`${entry.date}-${entry.author}-${index}`} className={`rounded-md border border-slate-200 bg-slate-50 p-3 ${body} text-slate-600`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800">{entry.author || 'Unknown'}</p>
                  <p className="text-slate-500">{entry.date}</p>
                </div>
                <p className="mt-1">{entry.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">-</p>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={sectionTitle}>Resources</h3>
          {!readOnly ? (
            <Button variant="secondary" className="h-8 px-3 py-0 text-sm" onClick={onEditResources}>
              Edit
            </Button>
          ) : null}
        </div>
        <div className={`space-y-2 ${body} text-slate-600`}>
          {detail.technicalLinks.additionalResources.length ? (
            detail.technicalLinks.additionalResources.map((resource, index) => (
              <div key={`${resource.type}-${resource.title}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                <p className="font-semibold text-slate-800">{resource.title}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{resource.type}</p>
                <p className="mt-1 break-all text-slate-700">{resource.url || 'No URL provided'}</p>
              </div>
            ))
          ) : (
            <p>No resources added.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
