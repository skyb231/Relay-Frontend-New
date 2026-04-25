import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'
import { ui } from './styles'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...props }: InputProps) {
  return <input className={cn('w-full text-slate-800', ui.control, className)} {...props} />
}
