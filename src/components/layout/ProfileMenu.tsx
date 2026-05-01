import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '../../app/useAuthSession'
import { ROUTES } from '../../app/routes'
import { useTts } from '../../context/useTts'
import { Select } from '../ui/Select'
import { initialsFromName } from './profileInitials'

export function ProfileMenu() {
  const navigate = useNavigate()
  const { user, clearUser } = useAuthSession()
  const { enabled, setEnabled, speakMainContent } = useTts()
  const initials = initialsFromName(user?.name)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xs font-semibold tracking-tight text-white shadow-sm hover:bg-white/15"
        aria-label="Profile menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {initials}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-slate-200 bg-white p-3 opacity-100 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User profile</p>
            <button
              type="button"
              aria-label="Close profile menu"
              className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              X
            </button>
          </div>
        <label className="mb-1 block text-xs text-slate-500">Text to Speech</label>
        <Select
          className="mb-3 h-8 w-full px-2 py-1 text-xs"
          value={enabled ? 'on' : 'off'}
          onChange={(event) => {
            const next = event.target.value === 'on'
            setEnabled(next)
            if (next) {
              window.setTimeout(() => {
                void speakMainContent()
              }, 0)
            }
          }}
        >
          <option value="off">TTS Off</option>
          <option value="on">TTS On</option>
        </Select>
        <button
          type="button"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => {
            setEnabled(false)
            clearUser()
            void navigate(ROUTES.login)
          }}
        >
          Log out
        </button>
        </div>
      ) : null}
    </div>
  )
}
