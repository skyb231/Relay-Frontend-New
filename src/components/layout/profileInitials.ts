// Build profile menu initials from display name.
export function initialsFromName(name: string | undefined | null): string {
  const t = name?.trim()
  if (!t) return 'U'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const a = parts[0][0]
  const b = parts[parts.length - 1][0]
  return `${a}${b}`.toUpperCase()
}
