'use client'

import { Tooltip } from '@/components/shared/tooltip'

type AddStepProps = {
  onClick: () => void
  variant?: 'inline' | 'terminal'
}

export function AddStep({ onClick, variant = 'terminal' }: AddStepProps) {
  if (variant === 'inline') {
    return (
      <div className="ml-10 flex items-center justify-center py-1 group">
        <Tooltip content="Add step below" side="right">
          <button
            type="button"
            onClick={onClick}
            className="
              w-6 h-6
              flex items-center justify-center
              border border-dashed border-[var(--border)]
              rounded-full
              bg-transparent
              text-[var(--text-faint)] text-sm leading-none
              cursor-pointer
              transition-all duration-150
              opacity-0 group-hover:opacity-100
              hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)]
              focus:opacity-100
            "
            aria-label="Add step below"
          >
            +
          </button>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="ml-10 mt-1">
      <Tooltip content="Add another step to the pipeline" side="top">
        <button
          type="button"
          onClick={onClick}
          className="
            w-full py-3 px-4
            border border-dashed border-[var(--border-strong)]
            rounded-[var(--r-lg)]
            bg-transparent
            text-[var(--text-muted)] text-xs
            font-[family-name:var(--font-body)]
            cursor-pointer
            transition-all duration-150
            flex items-center justify-center gap-2
            hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)]
          "
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="7" y1="3" x2="7" y2="11" />
            <line x1="3" y1="7" x2="11" y2="7" />
          </svg>
          Add step
        </button>
      </Tooltip>
    </div>
  )
}
