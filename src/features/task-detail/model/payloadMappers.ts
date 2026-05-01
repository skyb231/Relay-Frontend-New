import type { BatonTaskDetail } from '@/types/domain'

export type TaskDetailForm = {
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

export const EMPTY_TASK_DETAIL_FORM: TaskDetailForm = {
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

export function resourcesTextFromDetail(detail: BatonTaskDetail): string {
  return detail.technicalLinks.additionalResources
    .filter((resource) => {
      const type = resource.type.toLowerCase()
      return type !== 'dependency' && type !== 'related_system'
    })
    .map((resource) => `${resource.title}${resource.url ? ` | ${resource.url}` : ''}`)
    .join('\n')
}

export function formFromTaskDetail(detail: BatonTaskDetail): TaskDetailForm {
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

export function mergeTaskDetailIntoForm(prev: TaskDetailForm, detail: BatonTaskDetail): TaskDetailForm {
  const next = formFromTaskDetail(detail)
  return {
    ...prev,
    ...next,
    dailyLogNote: prev.dailyLogNote,
  }
}

export function canPromoteFromEnrich(detail: BatonTaskDetail, successorIds: number[]): boolean {
  return (
    detail.status === 'Enrich Baton' &&
    successorIds.length > 0 &&
    detail.documentation.description.trim().length > 0 &&
    detail.technicalLinks.relatedSystems.length > 0
  )
}

export function normalizeLogDateOrToday(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return new Date().toISOString().slice(0, 10)
}

export function buildOwnershipPatch(args: {
  ownerId: number
  successorIds: number[]
  shouldMoveToInProgress: boolean
}) {
  const { ownerId, successorIds, shouldMoveToInProgress } = args
  return {
    owner_id: ownerId,
    successor_ids: successorIds,
    ...(shouldMoveToInProgress ? { baton_status: 'in_progress' as const } : {}),
  }
}

export function buildDocumentationPatch(form: TaskDetailForm) {
  return {
    description: form.description,
    detailed_context: form.context,
    implementation_state: form.implementation,
    dependencies: form.dependenciesText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    troubleshooting_notes: form.troubleshootingNotes,
  }
}

export function buildTechnicalPatch(form: TaskDetailForm) {
  return {
    repo_link: form.repoLink,
    branch_name: form.branchName,
    implementation_state: form.techEnvironment,
    related_systems: form.relatedSystemsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

export function buildResourcesPatch(args: {
  form: TaskDetailForm
  detail: BatonTaskDetail
}) {
  const { form, detail } = args
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
  return {
    additional_resources: [...dependencyResources, ...relatedSystems, ...resources],
  }
}

export function buildDailyLogsPatch(args: {
  detail: BatonTaskDetail
  note: string
  author: string
}) {
  const { detail, note, author } = args
  const existingLogs = detail.dailyLogs.map((entry) => ({
    date: normalizeLogDateOrToday(entry.date),
    note: entry.note,
    author: entry.author || detail.ownership.currentOwner,
  }))

  return {
    daily_logs: [
      ...existingLogs,
      {
        date: new Date().toISOString().slice(0, 10),
        note,
        author,
      },
    ],
  }
}

