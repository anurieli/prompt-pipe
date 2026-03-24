'use client'

import { getNodeType } from '@/config/providers'
import { Annotation } from '@/components/shared/annotation'
import { Tooltip } from '@/components/shared/tooltip'
import type { Doc } from '../../../convex/_generated/dataModel'

type StepWithThreads = Doc<'pipelineSteps'> & { threads: Doc<'stepThreads'>[] }

type StepCardProps = {
  step: StepWithThreads
  stepNumber: number
  selected: boolean
  selectedThreadId: string | null
  onSelect: () => void
  onSelectThread: (threadId: string) => void
  onDelete: () => void
  onSplit: () => void
  onRerun?: () => void
  totalCostUsd?: number
  durationMs?: number
}

const STATUS_STYLES: Record<string, string> = {
  idle: 'bg-[var(--surface-3)] text-[var(--text-muted)]',
  running: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  done: 'bg-[var(--green-muted)] text-[var(--green)]',
  failed: 'bg-[var(--red-muted)] text-[var(--red)]',
  skipped: 'bg-[var(--surface-3)] text-[var(--text-faint)]',
}

function getFirstNodeTypeColor(step: StepWithThreads): string {
  if (step.threads.length === 0) return 'var(--text-muted)'
  const nt = getNodeType(step.threads[0].nodeType)
  return nt?.color ?? 'var(--text-muted)'
}

export function StepCard({
  step,
  stepNumber,
  selected,
  selectedThreadId,
  onSelect,
  onSelectThread,
  onDelete,
  onSplit,
  onRerun,
  totalCostUsd,
  durationMs,
}: StepCardProps) {
  const dotColor = getFirstNodeTypeColor(step)
  const isRunning = step.status === 'running'
  const isDone = step.status === 'done'
  const isFailed = step.status === 'failed'
  const hasMultipleThreads = step.threads.length > 1

  return (
    <div className="relative z-[1]">
      {/* Step number node */}
      <div className="absolute left-0 top-3.5 w-10 flex items-center justify-center z-[2]">
        <div
          className={[
            'w-[22px] h-[22px] rounded-[6px]',
            'flex items-center justify-center',
            'font-[family-name:var(--font-mono)]',
            'text-[10px] font-bold',
            'border-2 border-[var(--bg)]',
            'text-white',
            isRunning ? 'animate-[status-pulse_2s_ease_infinite]' : '',
          ].join(' ')}
          style={{
            background: isDone ? 'var(--green)' : isFailed ? 'var(--red)' : dotColor,
            ...(isRunning ? { boxShadow: `0 0 8px ${dotColor}` } : {}),
          }}
        >
          {isDone ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6L5 8L9 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : isFailed ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 4L8 8M8 4L4 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>
      </div>

      {/* Card body */}
      <div
        className={[
          'ml-10 mb-2',
          'bg-[var(--surface)] border rounded-[var(--r-lg)]',
          'transition-all duration-200',
          'overflow-hidden',
          isRunning
            ? 'border-[var(--accent-strong)] shadow-[0_4px_24px_rgba(0,0,0,0.2),0_0_0_1px_var(--accent-strong)]'
            : isFailed
              ? 'border-[var(--red-muted)] shadow-[0_2px_12px_rgba(201,96,90,0.1)]'
              : selected
                ? 'border-[var(--accent)] shadow-[0_4px_24px_rgba(0,0,0,0.2),0_0_0_1px_var(--accent)]'
                : 'border-[var(--border)] hover:border-[var(--border-strong)]',
        ].join(' ')}
      >
        {/* Step header row */}
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect()
            }
          }}
          aria-label={`Select step ${stepNumber}: ${step.name}`}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-2)] transition-colors duration-150"
        >
          {/* Step info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[var(--text)]">
                {step.name}
              </span>
              {!hasMultipleThreads && step.threads.length === 1 && (() => {
                const t = step.threads[0]
                const nt = getNodeType(t.nodeType)
                const modelLabel = t.model
                  ? (t.model as string).replace(/^[^/]+\//, '').replace(/-preview.*$/, '')
                  : null
                return (
                  <>
                    <button
                      key={t._id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectThread(t._id)
                      }}
                      className={[
                        'inline-flex items-center gap-1',
                        'font-[family-name:var(--font-mono)]',
                        'text-[9px] font-semibold',
                        'px-1.5 py-0.5 rounded-[3px]',
                        'uppercase tracking-[0.06em]',
                        'cursor-pointer transition-all duration-150',
                        selectedThreadId === t._id
                          ? 'ring-1 ring-[var(--accent)]'
                          : 'hover:ring-1 hover:ring-[var(--border-strong)]',
                      ].join(' ')}
                      style={{
                        background: nt?.colorMuted ?? 'var(--surface-3)',
                        color: nt?.color ?? 'var(--text-muted)',
                      }}
                    >
                      {nt?.letter ?? '?'} {nt?.label ?? t.nodeType}
                    </button>
                    {modelLabel && (
                      <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)] truncate max-w-[120px]">
                        {modelLabel}
                      </span>
                    )}
                  </>
                )
              })()}
              {hasMultipleThreads && (
                <span className="
                  font-[family-name:var(--font-mono)]
                  text-[9px] text-[var(--text-faint)]
                  px-1.5 py-0.5
                  border border-[var(--border)]
                  rounded-[3px]
                ">
                  {step.threads.length} threads
                </span>
              )}
            </div>
            {step.description && (
              <div className="text-xs text-[var(--text-secondary)] leading-[1.4] font-light truncate mt-0.5">
                {step.description}
              </div>
            )}
          </div>

          {/* Execution annotations */}
          {isDone ? (
            <div className="flex items-center gap-2.5 shrink-0">
              {totalCostUsd !== undefined ? (
                <Annotation label="cost" value={`$${totalCostUsd.toFixed(4)}`} />
              ) : null}
              {durationMs !== undefined ? (
                <Annotation label="time" value={`${(durationMs / 1000).toFixed(1)}s`} />
              ) : null}
              {onRerun ? (
                <Tooltip content="Rerun from this step" side="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRerun()
                    }}
                    className="
                      text-[var(--text-faint)] hover:text-[var(--accent)]
                      cursor-pointer transition-colors duration-150
                      shrink-0 p-0.5 rounded-[3px]
                      hover:bg-[var(--accent-muted)]
                    "
                    aria-label={`Rerun from step ${stepNumber}`}
                  >
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 7A6 6 0 1 0 7 1" />
                      <polyline points="1 1 1 7 7 7" />
                    </svg>
                  </button>
                </Tooltip>
              ) : null}
            </div>
          ) : null}

          {/* Status badge */}
          <span
            role="status"
            aria-label={`Step ${stepNumber} status: ${step.status}`}
            className={[
              'font-[family-name:var(--font-mono)]',
              'text-[10px] font-medium',
              'px-2.5 py-[3px] rounded-[3px]',
              'shrink-0 tracking-[0.02em]',
              isRunning ? 'animate-[status-pulse_2s_ease_infinite]' : '',
              STATUS_STYLES[step.status] ?? STATUS_STYLES.idle,
            ].join(' ')}
          >
            {step.status}
          </span>

          {/* Split button */}
          <Tooltip content="Split into parallel thread" side="top">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSplit()
              }}
              className="
                text-[var(--text-faint)] hover:text-[var(--accent)]
                cursor-pointer transition-colors duration-150
                shrink-0 p-1 rounded-[4px]
                hover:bg-[var(--accent-muted)]
              "
              aria-label={`Split step ${stepNumber} into parallel threads`}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 2V5" />
                <path d="M7 5L3.5 8" />
                <path d="M7 5L10.5 8" />
                <circle cx="3.5" cy="9.5" r="1.5" />
                <circle cx="10.5" cy="9.5" r="1.5" />
              </svg>
            </button>
          </Tooltip>

          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="
              text-[var(--text-faint)] hover:text-[var(--red)]
              text-[10px] font-[family-name:var(--font-mono)]
              cursor-pointer transition-colors duration-150
              shrink-0 px-1
            "
            title="Delete step"
            aria-label={`Delete step ${stepNumber}`}
          >
            &times;
          </button>
        </div>

        {/* Multi-thread sub-rows */}
        {hasMultipleThreads && (
          <div className="border-t border-[var(--border)] px-4 py-1.5">
            {step.threads.map((t) => {
              const nt = getNodeType(t.nodeType)
              const isThreadSelected = selectedThreadId === t._id
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectThread(t._id)
                  }}
                  className={[
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--r)]',
                    'cursor-pointer transition-all duration-150 text-left',
                    isThreadSelected
                      ? 'bg-[var(--accent-muted)] border border-[var(--accent)]'
                      : 'border border-transparent hover:bg-[var(--surface-2)] hover:border-[var(--border)]',
                  ].join(' ')}
                >
                  <span
                    className="
                      inline-flex items-center justify-center
                      w-5 h-5 rounded-[4px]
                      font-[family-name:var(--font-mono)]
                      text-[8px] font-bold shrink-0
                    "
                    style={{
                      background: nt?.colorMuted ?? 'var(--surface-3)',
                      color: nt?.color ?? 'var(--text-muted)',
                    }}
                  >
                    {nt?.letter ?? '?'}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] flex-1 truncate">
                    {t.name}
                  </span>
                  {t.model && (
                    <span className="font-[family-name:var(--font-mono)] text-[8px] text-[var(--text-faint)] truncate max-w-[100px] shrink-0">
                      {(t.model as string).replace(/^[^/]+\//, '').replace(/-preview.*$/, '')}
                    </span>
                  )}
                  {t.inputSources && (t.inputSources as Array<unknown>).length > 0 && (
                    <span className="text-[8px] text-[var(--text-faint)] font-[family-name:var(--font-mono)] uppercase tracking-wider">
                      routed
                    </span>
                  )}
                  <span
                    className={[
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      t.status === 'done' ? 'bg-[var(--green)]'
                        : t.status === 'running' ? 'bg-[var(--accent)] animate-[status-pulse_1s_ease_infinite]'
                        : t.status === 'failed' ? 'bg-[var(--red)]'
                        : 'bg-[var(--text-faint)]',
                    ].join(' ')}
                  />
                </button>
              )
            })}
          </div>
        )}

        {/* Running progress indicator */}
        {isRunning ? (
          <div className="px-4 pb-1">
            <div className="h-[2px] bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full"
                style={{
                  width: '30%',
                  animation: 'progress-indeterminate 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Failed error summary */}
        {isFailed ? (() => {
          const failedThreads = step.threads.filter((t) => t.status === 'failed' && t.error)
          return (
            <div className="mx-4 mb-3 px-2.5 py-2 bg-[var(--red-muted)] border border-[var(--red-muted)] rounded-[var(--r)] space-y-1.5">
              {failedThreads.length > 0 ? failedThreads.map((t) => (
                <div key={t._id} className="flex items-start gap-1.5">
                  {hasMultipleThreads && (
                    <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--red)] opacity-60 shrink-0 pt-px">
                      {t.name}:
                    </span>
                  )}
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--red)] break-words line-clamp-2">
                    {t.error}
                  </span>
                </div>
              )) : (
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--red)]">
                  One or more threads failed in this step.
                </span>
              )}
              {onRerun ? (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRerun()
                    }}
                    className="
                      inline-flex items-center gap-1
                      font-[family-name:var(--font-mono)] text-[9px] font-medium
                      text-[var(--red)] hover:text-white
                      px-2 py-1 rounded-[3px]
                      border border-[var(--red)] border-opacity-40
                      hover:bg-[var(--red)] hover:border-[var(--red)]
                      cursor-pointer transition-all duration-150
                    "
                  >
                    <svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 7A6 6 0 1 0 7 1" />
                      <polyline points="1 1 1 7 7 7" />
                    </svg>
                    Retry from here
                  </button>
                </div>
              ) : null}
            </div>
          )
        })() : null}
      </div>
    </div>
  )
}
