import type { SelectHTMLAttributes } from 'react'
import { cn } from './cn'
import { ui } from './styles'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select className={cn(ui.control, className)} {...props}>
      {children}
    </select>
  )
}
