import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Shared control for all in-page “back” actions (no divider line under the nav). */
export const pageBackButtonClass =
  'inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[var(--relay-navy)] shadow-sm hover:bg-slate-50'

type PageBackNavProps = {
  children: ReactNode
} & ({ to: string } | { onClick: () => void })

export function PageBackNav(props: PageBackNavProps) {
  return (
    <div className="mb-4">
      {'to' in props ? (
        <Link to={props.to} className={pageBackButtonClass}>
          {props.children}
        </Link>
      ) : (
        <button type="button" className={pageBackButtonClass} onClick={props.onClick}>
          {props.children}
        </button>
      )}
    </div>
  )
}
