import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { canEditBaton } from '../roles'
import { useAuthSession } from '../app/AuthSessionProvider'
import type { BatonDetailLocationState } from '../app/routes'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { TaskSectionEditorModal } from '../features/task-detail/TaskSectionEditorModal'
import { TaskDetailView } from '../features/task-detail/TaskDetailView'
import { relayService } from '../services/relayService'
import type { BatonTaskDetail } from '../types/domain'

type TaskDetailForm = {
  title: string
  reconstructionTime: string
  description: string
  context: string
  implementation: string
  dependenciesText: string
  troubleshootingNotes: string
  ownerId: string
  successorIds: string[]
  repoLink: string
  branchName: string
  techEnvironment: string
  relatedSystemsText: string
  resourcesText: string
  dailyLogNote: string
}

const EMPTY_TASK_DETAIL_FORM: TaskDetailForm = {
  title: '',
  reconstructionTime: '',
  description: '',
  context: '',
  implementation: '',
  dependenciesText: '',
  troubleshootingNotes: '',
  ownerId: '',
  successorIds: [],
  repoLink: '',
  branchName: '',
  techEnvironment: '',
  relatedSystemsText: '',
  resourcesText: '',
  dailyLogNote: '',
}

function resourcesTextFromDetail(detail: BatonTaskDetail): string {
  return detail.technicalLinks.additionalResources
    .filter((resource) => {
      const type = resource.type.toLowerCase()
      return type !== 'dependency' && type !== 'related_system'
    })
    .map((resource) => `${resource.title}${resource.url ? ` | ${resource.url}` : ''}`)
    .join('\n')
}

function formFromTaskDetail(detail: BatonTaskDetail): TaskDetailForm {
  return {
    title: detail.title,
    reconstructionTime: detail.reconstructionTime,
    description: detail.documentation.description,
    context: detail.documentation.context,
    implementation: detail.documentation.implementation,
    dependenciesText: detail.documentation.dependencies.join('\n'),
    troubleshootingNotes: detail.documentation.troubleshooting === '—' ? '' : detail.documentation.troubleshooting,
    ownerId: String(detail.ownership.ownerId),
    successorIds: detail.ownership.successorIds.map(String),
    repoLink: detail.technicalLinks.repository,
    branchName: detail.technicalLinks.branch,
    techEnvironment: detail.technicalLinks.environment,
    relatedSystemsText: detail.technicalLinks.relatedSystems.join('\n'),
    resourcesText: resourcesTextFromDetail(detail),
    dailyLogNote: '',
  }
}

function mergeTaskDetailIntoForm(prev: TaskDetailForm, detail: BatonTaskDetail): TaskDetailForm {
  const next = formFromTaskDetail(detail)
  return {
    ...prev,
    ...next,
    dailyLogNote: prev.dailyLogNote,
  }
}

function canPromoteFromEnrich(detail: BatonTaskDetail, successorIds: number[]): boolean {
  return (
    detail.status === 'Enrich Baton' &&
    successorIds.length > 0 &&
    detail.documentation.description.trim().length > 0 &&
    detail.technicalLinks.relatedSystems.length > 0
  )
}

function normalizeLogDateOrToday(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return new Date().toISOString().slice(0, 10)
}

export function TaskDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user: sessionUser } = useAuthSession()
  const openedEditorFromNav = useRef(false)
  const [detail, setDetail] = useState<BatonTaskDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [availablePeople, setAvailablePeople] = useState<Array<{ id: number; name: string; inOffice: boolean }>>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [ownershipSaveConfirm, setOwnershipSaveConfirm] = useState<{
    ownerId: number
    successorIds: number[]
  } | null>(null)
  const [editor, setEditor] = useState<
    null | 'overview' | 'ownership' | 'documentation' | 'technical' | 'resources' | 'reconstruction' | 'dailyLog'
  >(
    null,
  )
  const [form, setForm] = useState<TaskDetailForm>(EMPTY_TASK_DETAIL_FORM)

  useEffect(() => {
    const batonId = id?.trim() ?? ''
    if (!batonId) {
      setLoading(false)
      setLoadError('missing-id')
      setDetail(null)
      return
    }

    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const response = await relayService.getBatonTaskDetail(batonId)
        if (!mounted) return
        setDetail(response)
        setLoadError(null)
      } catch (err) {
        if (!mounted) return
        setDetail(null)
        setLoadError(err instanceof Error ? err.message : 'Failed to load baton detail')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    if (detail?.teamId == null) return
    const teamId = detail.teamId
    let mounted = true

    async function loadTeamPeople() {
      try {
        const [teamTasks, roster] = await Promise.all([
          relayService.getBatonTasks({ teamId }),
          relayService.getTeamRoster(String(teamId)),
        ])
        if (!mounted) return

        const peopleMap = new Map<number, { name: string; inOffice: boolean }>()
        roster.forEach((member) => {
          peopleMap.set(member.id, {
            name: member.name.trim() || `User ${member.id}`,
            inOffice: member.in_office,
          })
        })
        teamTasks.forEach((task) => {
          peopleMap.set(task.ownerId, {
            name: task.owner,
            inOffice: task.ownerInOffice,
          })
        })

        const people = Array.from(peopleMap.entries())
          .map(([personId, person]) => ({ id: personId, name: person.name, inOffice: person.inOffice }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setAvailablePeople(people)
      } catch {
        if (!mounted) return
        setAvailablePeople([])
      }
    }

    void loadTeamPeople()
    return () => {
      mounted = false
    }
  }, [detail?.teamId])

  useEffect(() => {
    if (!detail) return
    setForm(formFromTaskDetail(detail))
    setSaveError(null)
  }, [detail])

  const readOnly = useMemo(
    () => (detail == null ? true : !canEditBaton(sessionUser, detail)),
    [detail, sessionUser],
  )

  useEffect(() => {
    openedEditorFromNav.current = false
  }, [id])

  useEffect(() => {
    if (detail == null || readOnly || openedEditorFromNav.current) return
    const state = location.state as BatonDetailLocationState | undefined
    if (state?.openEditor === 'ownership') {
      openedEditorFromNav.current = true
      setEditor('ownership')
      void navigate(location.pathname, {
        replace: true,
        state: { ...state, openEditor: undefined },
      })
    }
  }, [detail, readOnly, location.pathname, location.state, navigate])

  async function saveUpdate(payload: Parameters<typeof relayService.updateBaton>[1]): Promise<boolean> {
    if (!id) return false
    setSaving(true)
    try {
      let updated = await relayService.updateBaton(id, payload)
      const isDailyLogOnly =
        Object.keys(payload).length === 1 && Object.prototype.hasOwnProperty.call(payload, 'daily_logs')
      if (!isDailyLogOnly && canPromoteFromEnrich(updated, updated.ownership.successorIds)) {
        updated = await relayService.updateBaton(id, { baton_status: 'in_progress' })
      }
      setDetail(updated)
      setForm((prev) => mergeTaskDetailIntoForm(prev, updated))
      setEditor(null)
      setSaveError(null)
      setLoadError(null)
      return true
    } catch (updateError) {
      setSaveError(updateError instanceof Error ? updateError.message : 'Failed to update baton')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function saveCurrentEditor() {
    if (!detail) return

    if (editor === 'overview') {
      await saveUpdate({ title: form.title })
      return
    }
    if (editor === 'ownership') {
      const ownerId = Number(form.ownerId)
      if (!Number.isFinite(ownerId) || ownerId <= 0) {
        setSaveError('Please select a valid owner.')
        return
      }
      const successorIds = Array.from(
        new Set(form.successorIds.map(Number).filter((value) => Number.isFinite(value) && value > 0)),
      ).filter((value) => value !== ownerId)
      if (ownerId !== detail.ownership.ownerId) {
        setOwnershipSaveConfirm({ ownerId, successorIds })
        return
      }
      const selectedOwner = availablePeople.find((person) => person.id === ownerId)
      const ownerChanged = ownerId !== detail.ownership.ownerId
      const shouldMoveToInProgress =
        (ownerChanged && detail.status === 'Approve handover' && (selectedOwner?.inOffice ?? true)) ||
        canPromoteFromEnrich(detail, successorIds)
      await saveUpdate({
        owner_id: ownerId,
        successor_ids: successorIds,
        ...(shouldMoveToInProgress ? { baton_status: 'in_progress' } : {}),
      })
      return
    }
    if (editor === 'reconstruction') {
      await saveUpdate({ reconstruction_time: form.reconstructionTime })
      return
    }
    if (editor === 'documentation') {
      await saveUpdate({
        description: form.description,
        detailed_context: form.context,
        implementation_state: form.implementation,
        dependencies: form.dependenciesText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        troubleshooting_notes: form.troubleshootingNotes,
      })
      return
    }
    if (editor === 'technical') {
      await saveUpdate({
        repo_link: form.repoLink,
        branch_name: form.branchName,
        implementation_state: form.techEnvironment,
        related_systems: form.relatedSystemsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      })
      return
    }
    if (editor === 'resources') {
      const dependencyResources = detail.technicalLinks.additionalResources.filter(
        (item) => item.type.toLowerCase() === 'dependency',
      )
      const relatedSystems = detail.technicalLinks.additionalResources.filter(
        (item) => item.type.toLowerCase() === 'related_system',
      )
      const resources = form.resourcesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [titlePart, urlPart] = line.split('|').map((part) => part.trim())
          return {
            type: 'resource',
            title: titlePart || 'Resource',
            url: urlPart || '',
          }
        })
      await saveUpdate({
        additional_resources: [...dependencyResources, ...relatedSystems, ...resources],
      })
      return
    }
    if (editor === 'dailyLog') {
      if (!form.dailyLogNote.trim()) return
      const existingLogs = detail.dailyLogs.map((entry) => ({
        date: normalizeLogDateOrToday(entry.date),
        note: entry.note,
        author: entry.author || detail.ownership.currentOwner,
      }))
      const saved = await saveUpdate({
        daily_logs: [
          ...existingLogs,
          {
            date: new Date().toISOString().slice(0, 10),
            note: form.dailyLogNote,
            author: sessionUser?.name || detail.ownership.currentOwner,
          },
        ],
      })
      if (saved) {
        setForm((prev) => ({ ...prev, dailyLogNote: '' }))
      }
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading baton detail...</p>
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        {loadError === 'missing-id'
          ? 'Invalid baton link.'
          : 'Baton detail could not be loaded. If this persists, check that the baton exists and the API returned valid data.'}
      </div>
    )
  }

  if (!detail) {
    return <p className="text-sm text-slate-500">No baton detail available.</p>
  }

  return (
    <>
      {saveError ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {saveError}
        </div>
      ) : null}
      <TaskDetailView
        detail={detail}
        readOnly={readOnly}
        onEditOverview={() => setEditor('overview')}
        onEditOwnership={() => setEditor('ownership')}
        onEditDocumentation={() => setEditor('documentation')}
        onEditTechnicalLinks={() => setEditor('technical')}
        onEditResources={() => setEditor('resources')}
        onEditReconstructionTime={() => setEditor('reconstruction')}
        onAddLogEntry={() => setEditor('dailyLog')}
      />
      <TaskSectionEditorModal
        title={
          editor === 'overview'
            ? 'Edit Overview'
            : editor === 'ownership'
              ? 'Edit Ownership'
              : editor === 'documentation'
                ? 'Edit Documentation'
                : editor === 'technical'
                  ? 'Edit Technical Links'
                  : editor === 'resources'
                    ? 'Edit Resources'
                    : editor === 'reconstruction'
                      ? 'Edit Reconstruction Time'
                  : 'Add Daily Log Entry'
        }
        isOpen={editor !== null}
        onCancel={() => setEditor(null)}
        onSave={saveCurrentEditor}
        saving={saving}
      >
        {editor === 'overview' ? (
          <FormField label="Title">
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </FormField>
        ) : null}
        {editor === 'reconstruction' ? (
          <FormField label="Estimated reconstruction time in minutes">
            <Input
              value={form.reconstructionTime}
              onChange={(event) => setForm((prev) => ({ ...prev, reconstructionTime: event.target.value }))}
              placeholder="Not set"
            />
          </FormField>
        ) : null}
        {editor === 'ownership' ? (
          <>
            <FormField label="Current Owner">
              <Select
                value={form.ownerId}
                onChange={(event) => setForm((prev) => ({ ...prev, ownerId: event.target.value }))}
              >
                <option value="">Select owner</option>
                {availablePeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Successors (ordered)">
              <div className="space-y-3">
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
                  {availablePeople.map((person) => {
                    const personId = String(person.id)
                    const isSelected = form.successorIds.includes(personId)
                    return (
                      <label
                        key={person.id}
                        className="flex cursor-pointer items-center justify-between rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <span>{person.name}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              successorIds: isSelected
                                ? prev.successorIds.filter((id) => id !== personId)
                                : [...prev.successorIds, personId],
                            }))
                          }
                        />
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-600">
                  Successor order:{' '}
                  {form.successorIds.length
                    ? form.successorIds
                        .map((id) => availablePeople.find((person) => String(person.id) === id)?.name)
                        .filter((name): name is string => Boolean(name))
                        .join(' -> ')
                    : '—'}
                </p>
              </div>
            </FormField>
          </>
        ) : null}
        {editor === 'documentation' ? (
          <>
            <FormField label="Description">
              <Input
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </FormField>
            <FormField label="Detailed Context">
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.context}
                onChange={(event) => setForm((prev) => ({ ...prev, context: event.target.value }))}
              />
            </FormField>
            <FormField label="Implementation State">
              <Input
                value={form.implementation}
                onChange={(event) => setForm((prev) => ({ ...prev, implementation: event.target.value }))}
              />
            </FormField>
            <FormField label="Dependencies">
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.dependenciesText}
                onChange={(event) => setForm((prev) => ({ ...prev, dependenciesText: event.target.value }))}
              />
            </FormField>
            <FormField label="Troubleshooting notes">
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.troubleshootingNotes}
                onChange={(event) => setForm((prev) => ({ ...prev, troubleshootingNotes: event.target.value }))}
              />
            </FormField>
          </>
        ) : null}
        {editor === 'technical' ? (
          <>
            <FormField label="Repository Link">
              <Input
                value={form.repoLink}
                onChange={(event) => setForm((prev) => ({ ...prev, repoLink: event.target.value }))}
              />
            </FormField>
            <FormField label="Branch Name">
              <Input
                value={form.branchName}
                onChange={(event) => setForm((prev) => ({ ...prev, branchName: event.target.value }))}
              />
            </FormField>
            <FormField label="Environment">
              <Input
                value={form.techEnvironment}
                onChange={(event) => setForm((prev) => ({ ...prev, techEnvironment: event.target.value }))}
              />
            </FormField>
            <FormField label="Related Systems">
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.relatedSystemsText}
                onChange={(event) => setForm((prev) => ({ ...prev, relatedSystemsText: event.target.value }))}
              />
            </FormField>
          </>
        ) : null}
        {editor === 'resources' ? (
          <FormField label="Resources (one per line: Title | URL)">
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.resourcesText}
              onChange={(event) => setForm((prev) => ({ ...prev, resourcesText: event.target.value }))}
            />
          </FormField>
        ) : null}
        {editor === 'dailyLog' ? (
          <div className="space-y-3">
            <FormField label="Note">
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.dailyLogNote}
                onChange={(event) => setForm((prev) => ({ ...prev, dailyLogNote: event.target.value }))}
              />
            </FormField>
          </div>
        ) : null}
      </TaskSectionEditorModal>

      <ConfirmModal
        isOpen={ownershipSaveConfirm != null}
        title="Update Ownership"
        message={
          ownershipSaveConfirm && detail ? (
            <p>
              Confirming will set the owner from{' '}
              <span className="font-semibold text-slate-800">{detail.ownership.currentOwner}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {availablePeople.find((p) => p.id === ownershipSaveConfirm.ownerId)?.name ??
                  `User ${ownershipSaveConfirm.ownerId}`}
              </span>.
            </p>
          ) : null
        }
        confirmLabel="Save changes"
        onCancel={() => setOwnershipSaveConfirm(null)}
        onConfirm={() => {
          const pending = ownershipSaveConfirm
          setOwnershipSaveConfirm(null)
          if (pending) {
            const selectedOwner = availablePeople.find((person) => person.id === pending.ownerId)
            const shouldMoveToInProgress =
              (detail.status === 'Approve handover' && (selectedOwner?.inOffice ?? true)) ||
              canPromoteFromEnrich(detail, pending.successorIds)
            void saveUpdate({
              owner_id: pending.ownerId,
              successor_ids: pending.successorIds,
              ...(shouldMoveToInProgress ? { baton_status: 'in_progress' } : {}),
            })
          }
        }}
      />
    </>
  )
}
