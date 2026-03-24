'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUIStore } from '@/stores/ui-store'
import { MediaOutput } from '@/components/output/media-output'
import { StepDetail } from '@/components/pipeline/step-detail'
import { Tooltip } from '@/components/shared/tooltip'
import type { OutputMedia } from '@/types/output-media'
import type { ModelInfo } from '@/types/provider'
import type { Id } from '../../../convex/_generated/dataModel'

function extractTextFromMedia(media: OutputMedia): string {
  switch (media.type) {
    case 'text':
      return media.content
    case 'image':
      return media.url
    case 'images':
      return media.items.map((img) => img.url).join('\n')
    case 'mixed':
      return media.items.map(extractTextFromMedia).join('\n\n')
  }
}

export function RightPanel() {
  const activeIdeaId = useUIStore((s) => s.activeIdeaId)
  const selectedStepId = useUIStore((s) => s.selectedStepId)
  const selectedThreadId = useUIStore((s) => s.selectedThreadId)
  const rightPanelTab = useUIStore((s) => s.rightPanelTab)
  const setRightPanelTab = useUIStore((s) => s.setRightPanelTab)
  const selectThread = useUIStore((s) => s.selectThread)

  const steps = useQuery(
    api.steps.queries.listByIdea,
    activeIdeaId ? { ideaId: activeIdeaId as Id<'ideas'> } : 'skip',
  )

  const listModelsAction = useAction(api.models.actions.listModels)
  const [models, setModels] = useState<ModelInfo[]>([])

  // Track which idea the output selection belongs to (avoids useEffect + setState)
  const [outputSelection, setOutputSelection] = useState<{ ideaId: string | null; index: number | null }>({ ideaId: null, index: null })
  const selectedOutputStepIndex = outputSelection.ideaId === activeIdeaId ? outputSelection.index : null
  const setSelectedOutputStepIndex = useCallback(
    (index: number | null) => setOutputSelection({ ideaId: activeIdeaId, index }),
    [activeIdeaId],
  )
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Fetch models once for the edit panel
  useEffect(() => {
    let cancelled = false
    async function fetchModels() {
      try {
        const result = await listModelsAction({})
        if (!cancelled) setModels(result as ModelInfo[])
      } catch {
        // Models fetch is best-effort
      }
    }
    void fetchModels()
    return () => { cancelled = true }
  }, [listModelsAction])

  const stepList = steps ?? []
  const selectedStep = selectedStepId
    ? stepList.find((s) => s._id === selectedStepId)
    : null

  // Output tab data
  const outputStepIndex = selectedOutputStepIndex ?? (stepList.length > 0 ? stepList.length - 1 : null)
  const outputStep = outputStepIndex !== null ? stepList[outputStepIndex] : null

  const outputs = useMemo(() => {
    const result: Array<{ threadName: string; output: OutputMedia }> = []
    if (outputStep) {
      for (const thread of outputStep.threads) {
        if (thread.output) {
          result.push({ threadName: thread.name, output: thread.output as OutputMedia })
        }
      }
    }
    return result
  }, [outputStep])
  const hasOutput = outputs.length > 0

  const handleCopy = useCallback(async () => {
    if (!hasOutput) return
    const text = outputs
      .map((o) => extractTextFromMedia(o.output))
      .join('\n\n---\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 1500)
    } catch {
      // Clipboard not available
    }
  }, [hasOutput, outputs])

  if (!activeIdeaId) return null

  return (
    <aside aria-label="Pipeline panel" className="w-[340px] border-l border-[var(--border)] bg-[var(--bg-warm)] shrink-0 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[var(--border)] shrink-0">
        <button
          type="button"
          onClick={() => setRightPanelTab('output')}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 h-[44px]',
            'font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.06em]',
            'cursor-pointer transition-all duration-150 border-b-2',
            rightPanelTab === 'output'
              ? 'text-[var(--text)] border-[var(--accent)]'
              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Output
        </button>
        <button
          type="button"
          onClick={() => setRightPanelTab('edit')}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 h-[44px]',
            'font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.06em]',
            'cursor-pointer transition-all duration-150 border-b-2',
            rightPanelTab === 'edit'
              ? 'text-[var(--text)] border-[var(--accent)]'
              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]',
            selectedStep ? '' : 'opacity-50',
          ].join(' ')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
          {selectedStep && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'output' ? (
          <OutputPanel
            stepList={stepList}
            outputStepIndex={outputStepIndex}
            setSelectedOutputStepIndex={setSelectedOutputStepIndex}
            outputs={outputs}
            hasOutput={hasOutput}
            copyFeedback={copyFeedback}
            handleCopy={handleCopy}
          />
        ) : (
          <EditPanel
            selectedStep={selectedStep ?? null}
            models={models}
            allSteps={stepList}
            selectedThreadId={selectedThreadId}
            onSelectThread={(threadId) => {
              if (selectedStep) selectThread(selectedStep._id, threadId)
            }}
          />
        )}
      </div>
    </aside>
  )
}

/* ---- Output sub-panel ---- */

type StepDoc = { _id: string; name: string; threads: Array<{ output?: unknown; name: string }> }

function OutputPanel({
  stepList,
  outputStepIndex,
  setSelectedOutputStepIndex,
  outputs,
  hasOutput,
  copyFeedback,
  handleCopy,
}: {
  stepList: StepDoc[]
  outputStepIndex: number | null
  setSelectedOutputStepIndex: (idx: number | null) => void
  outputs: Array<{ threadName: string; output: OutputMedia }>
  hasOutput: boolean
  copyFeedback: boolean
  handleCopy: () => void
}) {
  return (
    <>
      {/* Header controls */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
        {stepList.length > 1 ? (
          <select
            value={outputStepIndex ?? ''}
            onChange={(e) => {
              const val = e.target.value
              setSelectedOutputStepIndex(val === '' ? null : parseInt(val, 10))
            }}
            aria-label="Select output step"
            className="
              bg-[var(--surface-2)] border border-[var(--border)]
              rounded-[4px] px-1.5 py-0.5
              font-[family-name:var(--font-mono)] text-[10px]
              text-[var(--text-secondary)]
              outline-none cursor-pointer
              hover:border-[var(--border-strong)]
              focus:border-[var(--border-active)]
            "
          >
            {stepList.map((step, idx) => (
              <option key={step._id} value={idx}>
                Step {idx + 1}: {step.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)]">
            {stepList.length === 0 ? 'No steps' : `Step 1: ${stepList[0].name}`}
          </span>
        )}

        <Tooltip content={copyFeedback ? 'Copied!' : 'Copy to clipboard'} side="bottom">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasOutput}
            aria-label="Copy output to clipboard"
            className="
              p-1.5 rounded-[4px] border border-transparent
              text-[var(--text-muted)] cursor-pointer
              hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:border-[var(--border)]
              disabled:opacity-30 disabled:pointer-events-none
              transition-all duration-150
            "
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {copyFeedback ? (
                <path d="M20 6L9 17l-5-5" />
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </>
              )}
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Output content */}
      <div className="px-4 py-4">
        {hasOutput ? (
          <div className="flex flex-col gap-4">
            {outputs.map((o, i) => (
              <div key={i}>
                {outputs.length > 1 && (
                  <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] uppercase tracking-[0.06em] mb-2">
                    {o.threadName}
                  </p>
                )}
                <MediaOutput media={o.output} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p className="font-[family-name:var(--font-body)] text-[12px] text-[var(--text-faint)] italic">
              No output yet.
            </p>
            <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-faint)]">
              Run the pipeline to see results here.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

/* ---- Edit sub-panel ---- */

type StepWithThreads = Parameters<typeof StepDetail>[0]['step']

function EditPanel({
  selectedStep,
  models,
  allSteps,
  selectedThreadId,
  onSelectThread,
}: {
  selectedStep: StepWithThreads | null
  models: ModelInfo[]
  allSteps: StepWithThreads[]
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
}) {
  if (!selectedStep) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-center px-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <p className="font-[family-name:var(--font-body)] text-[12px] text-[var(--text-faint)] italic">
          Click a step to edit it here.
        </p>
        <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-faint)]">
          Configure threads, prompts, models, and output format.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <StepDetail
        step={selectedStep}
        models={models}
        allSteps={allSteps}
        selectedThreadId={selectedThreadId}
        onSelectThread={onSelectThread}
      />
    </div>
  )
}
