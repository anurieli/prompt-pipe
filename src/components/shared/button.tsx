'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'default' | 'accent' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

const variantStyles: Record<ButtonVariant, string> = {
  default: [
    'bg-[var(--surface-2)] border-[var(--border-strong)] text-[var(--text-secondary)]',
    'hover:bg-[var(--surface-3)] hover:text-[var(--text)] hover:border-[var(--border-active)]',
  ].join(' '),
  accent: [
    'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg)] font-semibold',
    'hover:bg-[#f5d06a] hover:border-[#f5d06a]',
  ].join(' '),
  ghost: [
    'bg-transparent border-transparent text-[var(--text-secondary)]',
    'hover:bg-[var(--surface-2)] hover:border-[var(--border)]',
  ].join(' '),
  danger: [
    'bg-[var(--surface-2)] border-[var(--border-strong)] text-[var(--red)]',
    'hover:bg-[var(--red-muted)] hover:border-[var(--red)]',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-[11px] rounded-[4px]',
  md: 'px-3.5 py-1.5 text-xs rounded-[var(--r)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'default', size = 'md', children, className = '', disabled, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'inline-flex items-center gap-1.5 border font-medium cursor-pointer',
          'transition-all duration-150 ease-out',
          'font-[family-name:var(--font-body)] tracking-[0.01em]',
          disabled ? 'opacity-40 pointer-events-none' : '',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
