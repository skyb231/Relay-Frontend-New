import { ui } from './styles'
import type { ReactNode } from 'react'
import { cn } from './cn'

type CardProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <section className={cn(ui.card, 'p-5', className)}>
      {title ? <h3 className="mb-3 text-sm font-semibold tracking-tight text-slate-800">{title}</h3> : null}
      {children}
    </section>
  )
}
