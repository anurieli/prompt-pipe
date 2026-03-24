'use client'

import type { IdeaStatus } from '@/types/idea'

type StatusDotProps = {
  status: IdeaStatus | string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-muted)',
  queued: 'var(--blue)',
  running: 'var(--accent)',
  paused: 'var(--orange)',
  done: 'var(--green)',
  failed: 'var(--red)',
  archived: 'var(--text-faint)',
}

export function StatusDot({ status }: StatusDotProps) {
  const color = STATUS_COLORS[status] ?? 'var(--text-muted)'
  const isRunning = status === 'running'

  return (
    <span
      className={[
        'inline-block w-[5px] h-[5px] rounded-full shrink-0',
        isRunning ? 'animate-[status-pulse_2s_ease_infinite]' : '',
      ].join(' ')}
      style={{
        backgroundColor: color,
        ...(isRunning ? { boxShadow: `0 0 6px ${color}` } : {}),
      }}
      role="status"
      aria-label={status}
    />
  )
}
