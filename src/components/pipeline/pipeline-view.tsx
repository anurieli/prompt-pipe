'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { StepCard } from '@/components/pipeline/step-card'
import { AddStep } from '@/components/pipeline/add-step'
import { ToolPickerModal } from '@/components/modals/tool-picker-modal'
import { NODE_TYPES, type NodeTypeId } from '@/config/providers'
import { Tooltip } from '@/components/shared/tooltip'
import { useUIStore } from '@/stores/ui-store'
import type { Id } from '../../../convex/_generated/dataModel'

export type PipelineViewProps = {
  ideaId: string
  isPipelineRunning?: boolean
  isPaused?: boolean
  pausedAtStep?: number | null
  onResume?: () => void
  onRerunFromStep?: (stepIndex: number) => void
}

export function PipelineView({ ideaId, isPipelineRunning, isPaused, pausedAtStep, onResume, onRerunFromStep }: PipelineViewProps) {
  const steps = useQuery(api.steps.queries.listByIdea, { ideaId: ideaId as Id<'ideas'> })
  const createStep = useMutation(api.steps.mutations.create)
  const removeStep = useMutation(api.steps.mutations.remove)
  const createThread = useMutation(api.threads.mutations.create)

  const selectedStepId = useUIStore((s) => s.selectedStepId)
  const selectedThreadId = useUIStore((s) => s.selectedThreadId)
  const selectStep = useUIStore((s) => s.selectStep)
  const selectThread = useUIStore((s) => s.selectThread)

  const [showPicker, setShowPicker] = useState(false)
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null)
  const [splitPickerStepId, setSplitPickerStepId] = useState<string | null>(null)

  const stepList = steps ?? []

  const handleAddStep = useCallback(
    async (nodeType: NodeTypeId) => {
      setShowPicker(false)

      const nodeTypeDef = NODE_TYPES.find((nt) => nt.id === nodeType)
      if (!nodeTypeDef) return

      const stepName = `${nodeTypeDef.label} Step`
      const threadName = `${nodeTypeDef.label} Thread`

      const targetIndex = insertAtIndex ?? stepList.length

      try {
        const stepId = await createStep({
          ideaId: ideaId as Id<'ideas'>,
          stepIndex: targetIndex,
          name: stepName,
          description: nodeTypeDef.description,
          threads: [
            {
              threadIndex: 0,
              name: threadName,
              provider: nodeTypeDef.defaultProvider,
              nodeType: nodeTypeDef.id,
              systemPrompt: nodeTypeDef.defaults.systemPrompt,
              promptTemplate: '{{input}}',
              config: {
                temperature: nodeTypeDef.defaults.temperature,
                maxTokens: nodeTypeDef.defaults.maxTokens,
                responseType: nodeTypeDef.defaults.responseType,
              },
            },
          ],
        })
        selectStep(stepId)
      } catch {
        // Silently handle
      } finally {
        setInsertAtIndex(null)
      }
    },
    [ideaId, stepList.length, createStep, selectStep, insertAtIndex],
  )

  const handleDeleteStep = useCallback(
    async (stepId: string) => {
      try {
        await removeStep({ id: stepId as Id<'pipelineSteps'> })
        if (selectedStepId === stepId) selectStep(null)
      } catch {
        // Silently handle
      }
    },
    [removeStep, selectedStepId, selectStep],
  )

  const handleAddThreadWithType = useCallback(
    async (nodeType: NodeTypeId) => {
      const stepId = splitPickerStepId
      setSplitPickerStepId(null)

      const nodeTypeDef = NODE_TYPES.find((nt) => nt.id === nodeType)
      if (!nodeTypeDef || !stepId) return

      try {
        await createThread({
          stepId: stepId as Id<'pipelineSteps'>,
          threadIndex: 0,
          name: `${nodeTypeDef.label} Thread`,
          provider: nodeTypeDef.defaultProvider,
          nodeType: nodeTypeDef.id,
          systemPrompt: nodeTypeDef.defaults.systemPrompt,
          promptTemplate: '{{input}}',
          config: {
            temperature: nodeTypeDef.defaults.temperature,
            maxTokens: nodeTypeDef.defaults.maxTokens,
            responseType: nodeTypeDef.defaults.responseType,
          },
        })
        selectStep(stepId)
      } catch {
        // Silently handle
      }
    },
    [splitPickerStepId, createThread, selectStep],
  )

  const openPickerAtIndex = useCallback((index: number) => {
    setInsertAtIndex(index)
    setShowPicker(true)
  }, [])

  const openPickerAtEnd = useCallback(() => {
    setInsertAtIndex(null)
    setShowPicker(true)
  }, [])

  if (steps === undefined) {
    return (
      <div className="px-8 pb-8">
        <div className="flex items-center gap-2.5 py-3">
          <h3 className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Pipeline
          </h3>
        </div>
        <div className="flex items-center justify-center py-12 text-[var(--text-faint)] text-xs font-[family-name:var(--font-mono)]">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 pb-8">
      {stepList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          <p className="text-[var(--text-faint)] text-xs font-[family-name:var(--font-mono)] italic text-center">
            No steps yet. Add a step to build your pipeline.
          </p>
          <Tooltip content="Choose a provider to add as a pipeline step" side="bottom">
            <button
              type="button"
              onClick={openPickerAtEnd}
              className="
                px-5 py-2.5
                border border-dashed border-[var(--border-strong)]
                rounded-[var(--r-lg)]
                bg-transparent
                text-[var(--text-muted)] text-sm
                font-[family-name:var(--font-body)]
                cursor-pointer
                transition-all duration-150
                hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)]
              "
            >
              + Add your first step
            </button>
          </Tooltip>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <h3 className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Pipeline
              </h3>
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)] px-[7px] py-[1px] border border-[var(--border)] rounded-[3px]">
                {stepList.length} step{stepList.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Tooltip content="Add a new step to the pipeline" side="bottom">
              <button
                type="button"
                onClick={openPickerAtEnd}
                className="
                  inline-flex items-center gap-1.5
                  px-3 py-1.5
                  bg-[var(--surface-2)] border border-[var(--border-strong)]
                  rounded-[var(--r)]
                  text-[var(--text-secondary)] text-xs font-medium
                  font-[family-name:var(--font-body)] tracking-[0.01em]
                  cursor-pointer
                  transition-all duration-150
                  hover:bg-[var(--surface-3)] hover:text-[var(--text)] hover:border-[var(--border-active)]
                "
              >
                + Add Step
              </button>
            </Tooltip>
          </div>

          <div className="relative">
            {stepList.length > 1 && (
              <div
                className="absolute left-[19px] top-5 bottom-5 w-px z-0"
                style={{
                  background:
                    'repeating-linear-gradient(to bottom, var(--border-strong) 0px, var(--border-strong) 4px, transparent 4px, transparent 8px)',
                }}
              />
            )}

            {stepList.map((step, index) => (
              <div key={step._id}>
                <StepCard
                  step={step}
                  stepNumber={index + 1}
                  selected={selectedStepId === step._id}
                  selectedThreadId={selectedThreadId}
                  onSelect={() => selectStep(selectedStepId === step._id ? null : step._id)}
                  onSelectThread={(threadId) => selectThread(step._id, threadId)}
                  onDelete={() => handleDeleteStep(step._id)}
                  onSplit={() => setSplitPickerStepId(step._id)}
                  onRerun={
                    !isPipelineRunning && (step.status === 'failed' || step.status === 'done') && onRerunFromStep
                      ? () => onRerunFromStep(step.stepIndex)
                      : undefined
                  }
                />

                {/* Inline add button between steps */}
                {index < stepList.length - 1 && (
                  <AddStep
                    onClick={() => openPickerAtIndex(index + 1)}
                    variant="inline"
                  />
                )}
              </div>
            ))}

            <AddStep onClick={openPickerAtEnd} variant="terminal" />
          </div>
        </>
      )}

      {/* Add step modal */}
      <ToolPickerModal
        open={showPicker}
        onClose={() => {
          setShowPicker(false)
          setInsertAtIndex(null)
        }}
        onSelect={handleAddStep}
        mode="add-step"
      />

      {/* Split thread modal */}
      <ToolPickerModal
        open={splitPickerStepId !== null}
        onClose={() => setSplitPickerStepId(null)}
        onSelect={handleAddThreadWithType}
        mode="split-thread"
      />
    </div>
  )
}
