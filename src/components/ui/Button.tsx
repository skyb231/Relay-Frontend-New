import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
} & ButtonHTMLAttributes<HTMLButtonElement>

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--relay-navy)] text-white shadow-sm hover:bg-[var(--relay-navy-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--relay-navy)]',
  secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
