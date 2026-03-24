'use client'

import { useState } from 'react'
import { getNodeType } from '@/config/providers'
import type { Doc } from '../../../convex/_generated/dataModel'

type InputSource =
  | { type: 'seed' }
  | { type: 'step'; stepIndex: number }
  | { type: 'thread'; stepIndex: number; threadIndex: number }

type StepWithThreads = Doc<'pipelineSteps'> & { threads: Doc<'stepThreads'>[] }

type InputSourcePickerProps = {
  currentSources: InputSource[] | undefined
  allSteps: StepWithThreads[]
  currentStepIndex: number
  onChange: (sources: InputSource[]) => void
}

function sourceKey(s: InputSource): string {
  switch (s.type) {
    case 'seed': return 'seed'
    case 'step': return `step:${s.stepIndex}`
    case 'thread': return `thread:${s.stepIndex}:${s.threadIndex}`
  }
}

function sourceLabel(s: InputSource, allSteps: StepWithThreads[]): string {
  switch (s.type) {
    case 'seed':
      return 'Seed (original prompt)'
    case 'step': {
      const step = allSteps.find((st) => st.stepIndex === s.stepIndex)
      return `Step ${s.stepIndex + 1}: ${step?.name ?? 'Unknown'}`
    }
    case 'thread': {
      const step = allSteps.find((st) => st.stepIndex === s.stepIndex)
      const thread = step?.threads.find((t) => t.threadIndex === s.threadIndex)
      return `Step ${s.stepIndex + 1} > ${thread?.name ?? `Thread ${s.threadIndex + 1}`}`
    }
  }
}

export function InputSourcePicker({
  currentSources,
  allSteps,
  currentStepIndex,
  onChange,
}: InputSourcePickerProps) {
  const [expanded, setExpanded] = useState(false)

  const sources = currentSources ?? []
  const hasCustomSources = sources.length > 0

  // Compute available upstream sources
  const upstreamSteps = allSteps.filter((s) => s.stepIndex < currentStepIndex)

  const availableOptions: InputSource[] = [
    { type: 'seed' },
    ...upstreamSteps.flatMap((step) => [
      { type: 'step' as const, stepIndex: step.stepIndex },
      ...step.threads.map((t) => ({
        type: 'thread' as const,
        stepIndex: step.stepIndex,
        threadIndex: t.threadIndex,
      })),
    ]),
  ]

  // Filter out already-selected sources
  const selectedKeys = new Set(sources.map(sourceKey))
  const unselectedOptions = availableOptions.filter((o) => !selectedKeys.has(sourceKey(o)))

  const handleAdd = (source: InputSource) => {
    onChange([...sources, source])
  }

  const handleRemove = (index: number) => {
    const next = [...sources]
    next.splice(index, 1)
    onChange(next)
  }

  const handleReset = () => {
    onChange([])
    setExpanded(false)
  }

  // For step 0, there are no upstream steps — just show "Seed" as default
  if (currentStepIndex === 0 && upstreamSteps.length === 0) {
    return (
      <div>
        <label className="
          block mb-1.5
          font-[family-name:var(--font-mono)] text-[9px] font-semibold
          uppercase tracking-[0.08em] text-[var(--text-faint)]
        ">
          Input Source
        </label>
        <span className="
          inline-flex items-center gap-1.5
          px-2 py-1 rounded-[4px]
          bg-[var(--surface-3)] border border-[var(--border)]
          font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]
        ">
          Seed (original prompt)
        </span>
      </div>
    )
  }

  return (
    <div>
      <label className="
        block mb-1.5
        font-[family-name:var(--font-mono)] text-[9px] font-semibold
        uppercase tracking-[0.08em] text-[var(--text-faint)]
      ">
        Input Source
      </label>

      {/* Current sources as chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        {hasCustomSources ? (
          sources.map((s, i) => (
            <span
              key={sourceKey(s)}
              className="
                inline-flex items-center gap-1
                px-2 py-1 rounded-[4px]
                bg-[var(--accent-muted)] border border-[var(--accent)]
                font-[family-name:var(--font-mono)] text-[10px] text-[var(--accent)]
              "
            >
              {sourceLabel(s, allSteps)}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-[var(--accent)] hover:text-[var(--text)] cursor-pointer ml-0.5"
                aria-label={`Remove source: ${sourceLabel(s, allSteps)}`}
              >
                &times;
              </button>
            </span>
          ))
        ) : (
          <span className="
            inline-flex items-center gap-1.5
            px-2 py-1 rounded-[4px]
            bg-[var(--surface-3)] border border-[var(--border)]
            font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]
          ">
            Previous step output (default)
          </span>
        )}

        {hasCustomSources && (
          <button
            type="button"
            onClick={handleReset}
            className="
              font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)]
              hover:text-[var(--text-muted)] cursor-pointer
              transition-colors duration-150
            "
          >
            reset
          </button>
        )}
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="
          font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)]
          hover:text-[var(--text-muted)] cursor-pointer
          transition-colors duration-150
        "
      >
        {expanded ? 'hide options' : 'change source'}
      </button>

      {/* Source picker dropdown */}
      {expanded && unselectedOptions.length > 0 && (
        <div className="mt-1.5 border border-[var(--border)] rounded-[var(--r)] bg-[var(--surface)] overflow-hidden">
          {unselectedOptions.map((option) => {
            const nt = option.type === 'thread'
              ? (() => {
                  const step = allSteps.find((s) => s.stepIndex === option.stepIndex)
                  const thread = step?.threads.find((t) => t.threadIndex === option.threadIndex)
                  return thread ? getNodeType(thread.nodeType) : null
                })()
              : null

            return (
              <button
                key={sourceKey(option)}
                type="button"
                onClick={() => handleAdd(option)}
                className="
                  w-full flex items-center gap-2 px-2.5 py-2
                  text-left text-[11px] text-[var(--text-secondary)]
                  hover:bg-[var(--surface-2)]
                  cursor-pointer transition-colors duration-100
                  border-b border-[var(--border)] last:border-b-0
                "
              >
                {option.type === 'seed' && (
                  <span className="w-4 h-4 rounded-[3px] bg-[var(--surface-3)] flex items-center justify-center text-[8px] font-bold text-[var(--text-faint)] shrink-0">
                    S
                  </span>
                )}
                {option.type === 'step' && (
                  <span className="w-4 h-4 rounded-[3px] bg-[var(--surface-3)] flex items-center justify-center text-[8px] font-bold text-[var(--text-faint)] shrink-0">
                    {option.stepIndex + 1}
                  </span>
                )}
                {option.type === 'thread' && nt && (
                  <span
                    className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[8px] font-bold shrink-0"
                    style={{ background: nt.colorMuted, color: nt.color }}
                  >
                    {nt.letter}
                  </span>
                )}
                <span className="truncate">{sourceLabel(option, allSteps)}</span>
              </button>
            )
          })}
        </div>
      )}

      {expanded && unselectedOptions.length === 0 && (
        <p className="mt-1.5 font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)] italic">
          All available sources selected
        </p>
      )}
    </div>
  )
}
