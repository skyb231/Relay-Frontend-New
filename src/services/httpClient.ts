const env = import.meta.env as Record<string, unknown>
const configuredBaseUrl = env.VITE_API_BASE_URL
const API_BASE_URL = typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim() ? configuredBaseUrl : '/api'

type HttpOptions = RequestInit & {
  path: string
}

function extractErrorMessage(bodyText: string, status: number): string {
  const trimmed = bodyText.trim()
  if (!trimmed) return `Request failed: ${status}`
  try {
    const parsed = JSON.parse(trimmed) as { detail?: unknown; message?: unknown }
    if (Array.isArray(parsed.detail) && parsed.detail.length > 0) {
      const first = parsed.detail[0] as { msg?: unknown; loc?: unknown }
      const message = typeof first?.msg === 'string' ? first.msg.trim() : ''
      const loc = Array.isArray(first?.loc) ? first.loc.join('.') : ''
      if (message && loc) return `${message} (${loc}).`
      if (message) return `${message}.`
    }
    if (typeof parsed.detail === 'string' && parsed.detail.trim()) return parsed.detail.trim()
    if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message.trim()
  } catch {
    // Non-JSON error body; fall through and use raw text.
  }
  return trimmed
}

/** Many APIs return `{ "data": [...] }` instead of a raw array — normalize for list endpoints. */
export function coerceJsonArray<T>(body: unknown, contextPath: string): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    for (const key of ['data', 'items', 'results', 'batons', 'teams', 'divisions', 'rows']) {
      const value = record[key]
      if (Array.isArray(value)) return value as T[]
    }
  }
  if (body === null || body === undefined) return []
  console.warn(`[relay] Expected JSON array for ${contextPath}, got:`, typeof body, body)
  return []
}

export async function httpRequest<T>({ path, headers, ...options }: HttpOptions): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      cache: options.cache ?? 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {}),
      },
    })
  } catch {
    throw new Error('Unable to reach backend API. Ensure the backend service is running and retry.')
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(extractErrorMessage(body, response.status))
  }

  const text = await response.text()
  if (!text.trim()) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      `API returned non-JSON for ${path} (status ${response.status}). First characters: ${text.slice(0, 160)}`,
    )
  }
}

/** GET endpoints that must return a JSON array (after optional wrapper unwrap). */
export async function httpRequestList<T>({ path, headers, ...init }: HttpOptions): Promise<T[]> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: init.cache ?? 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {}),
      },
    })
  } catch {
    throw new Error('Unable to reach backend API. Ensure the backend service is running and retry.')
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(extractErrorMessage(body, response.status))
  }

  const text = await response.text()
  if (!text.trim()) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(
      `API returned non-JSON for ${path} (status ${response.status}). First characters: ${text.slice(0, 160)}`,
    )
  }

  return coerceJsonArray<T>(parsed, path)
}

export { API_BASE_URL }
