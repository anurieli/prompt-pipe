'use client'

import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { getNodeType } from '@/config/providers'
import { ThreadLane } from '@/components/pipeline/thread-lane'
import { Button } from '@/components/shared/button'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import type { ModelInfo } from '@/types/provider'

type StepWithThreads = Doc<'pipelineSteps'> & { threads: Doc<'stepThreads'>[] }

type StepDetailProps = {
  step: StepWithThreads
  models: ModelInfo[]
  allSteps: StepWithThreads[]
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
  isPipelineRunning?: boolean
  isPaused?: boolean
  pausedAtStep?: number | null
  onEditAndContinue?: (editedOutput: string) => void
}

export function StepDetail({
  step,
  models,
  allSteps,
  selectedThreadId,
  onSelectThread,
  isPipelineRunning,
  isPaused,
  pausedAtStep,
  onEditAndContinue,
}: StepDetailProps) {
  const updateStep = useMutation(api.steps.mutations.update)
  const updateThread = useMutation(api.threads.mutations.update)
  const removeThread = useMutation(api.threads.mutations.remove)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(step.name)
  const [editedOutput, setEditedOutput] = useState('')
  const [showEditArea, setShowEditArea] = useState(false)

  const isPausedAtThisStep = isPaused && pausedAtStep === step.stepIndex

  // Auto-select first thread if none selected
  const activeThreadId = selectedThreadId && step.threads.some((t) => t._id === selectedThreadId)
    ? selectedThreadId
    : step.threads[0]?._id ?? null
  const activeThread = step.threads.find((t) => t._id === activeThreadId) ?? null

  const handleNameBlur = useCallback(() => {
    setEditingName(false)
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== step.name) {
      void updateStep({ id: step._id, name: trimmed })
    } else {
      setNameValue(step.name)
    }
  }, [nameValue, step.name, step._id, updateStep])

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNameBlur()
      } else if (e.key === 'Escape') {
        setNameValue(step.name)
        setEditingName(false)
      }
    },
    [handleNameBlur, step.name],
  )

  const handleEditAndContinue = useCallback(() => {
    if (onEditAndContinue && editedOutput.trim()) {
      onEditAndContinue(editedOutput.trim())
      setShowEditArea(false)
      setEditedOutput('')
    }
  }, [onEditAndContinue, editedOutput])

  const getStepOutput = (): string => {
    for (const thread of step.threads) {
      const output = thread.output as { type: string; content?: string } | undefined
      if (output?.type === 'text' && output.content) {
        return output.content
      }
    }
    return ''
  }

  const handleThreadUpdate = useCallback(
    (threadId: string, updates: Record<string, unknown>) => {
      void updateThread({ id: threadId as Id<'stepThreads'>, ...updates } as Parameters<typeof updateThread>[0])
    },
    [updateThread],
  )

  const handleThreadRemove = useCallback(
    (threadId: string) => {
      void removeThread({ id: threadId as Id<'stepThreads'> })
    },
    [removeThread],
  )

  return (
    <div
      className={[
        'transition-all duration-200',
        isPausedAtThisStep ? 'ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-[var(--bg)] rounded-[var(--r)]' : '',
      ].join(' ')}
    >
      {isPausedAtThisStep ? (
        <div className="mb-3 px-3 py-2 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] rounded-[var(--r)]">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[#f59e0b] uppercase tracking-[0.06em]">
              Pipeline paused before this step
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedOutput(getStepOutput())
                  setShowEditArea(!showEditArea)
                }}
              >
                {showEditArea ? 'Cancel Edit' : 'Edit Output'}
              </Button>
              {onEditAndContinue ? (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    if (showEditArea) {
                      handleEditAndContinue()
                    } else {
                      onEditAndContinue('')
                    }
                  }}
                >
                  {showEditArea ? 'Save & Continue' : 'Continue'}
                </Button>
              ) : null}
            </div>
          </div>

          {showEditArea ? (
            <div className="mt-2">
              <label className="block mb-1 font-[family-name:var(--font-mono)] text-[9px] font-semibold uppercase tracking-[0.08em] text-[#f59e0b]/70">
                Edit previous step output before continuing
              </label>
              <textarea
                value={editedOutput}
                onChange={(e) => setEditedOutput(e.target.value)}
                rows={4}
                spellCheck={false}
                placeholder="Edit the output that will be passed to this step..."
                className="w-full bg-[var(--bg)] border border-[rgba(245,158,11,0.3)] rounded-[var(--r)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-mono)] text-[11px] leading-[1.6] font-light resize-y min-h-[56px] outline-none transition-colors duration-150 focus:border-[#f59e0b] placeholder:text-[var(--text-faint)]"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Editable step name */}
      <div className="mb-4">
        <label className="block mb-1.5 font-[family-name:var(--font-mono)] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
          Step Name
        </label>
        {editingName ? (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus
            aria-label="Step name"
            className="w-full px-3 py-1.5 bg-[var(--bg)] border border-[var(--border-active)] rounded-[var(--r)] text-[var(--text)] text-[13px] font-semibold outline-none font-[family-name:var(--font-body)]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            aria-label={`Edit step name: ${step.name}`}
            className="text-left text-[13px] font-semibold text-[var(--text)] hover:text-[var(--accent)] cursor-pointer transition-colors duration-150 font-[family-name:var(--font-body)]"
          >
            {step.name}
          </button>
        )}
      </div>

      {/* Thread tab bar */}
      {step.threads.length > 0 && (
        <div className="mb-3">
          <label className="block mb-2 font-[family-name:var(--font-mono)] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Threads
          </label>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {step.threads.map((thread) => {
              const nt = getNodeType(thread.nodeType)
              const isActive = thread._id === activeThreadId
              return (
                <button
                  key={thread._id}
                  type="button"
                  onClick={() => onSelectThread(thread._id)}
                  className={[
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r)]',
                    'font-[family-name:var(--font-mono)] text-[10px] font-medium',
                    'cursor-pointer transition-all duration-150 shrink-0',
                    'border',
                    isActive
                      ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  <span
                    className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[8px] font-bold"
                    style={{
                      background: nt?.colorMuted ?? 'var(--surface-3)',
                      color: nt?.color ?? 'var(--text-muted)',
                    }}
                  >
                    {nt?.letter ?? '?'}
                  </span>
                  {thread.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Single thread editor */}
      {activeThread && (
        <ThreadLane
          key={activeThread._id}
          thread={activeThread}
          stepId={step._id}
          ideaId={step.ideaId}
          models={models}
          allSteps={allSteps}
          currentStepIndex={step.stepIndex}
          isPipelineRunning={isPipelineRunning}
          onUpdate={(threadId, updates) => handleThreadUpdate(threadId, updates)}
          onRemove={(threadId) => handleThreadRemove(threadId)}
        />
      )}
    </div>
  )
}
