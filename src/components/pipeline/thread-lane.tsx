'use client'

import { useState } from 'react'
import { PROVIDERS } from '@/config/providers'
import { TierPicker } from '@/components/pipeline/tier-picker'
import { InputSourcePicker } from '@/components/pipeline/input-source-picker'
import { OutputFormatEditor } from '@/components/output/output-format-editor'
import { Annotation } from '@/components/shared/annotation'
import { Tooltip } from '@/components/shared/tooltip'
import { Button } from '@/components/shared/button'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import type { OutputMedia } from '@/types/output-media'
import type { ModelInfo } from '@/types/provider'

type StepWithThreads = Doc<'pipelineSteps'> & { threads: Doc<'stepThreads'>[] }

type InputSource =
  | { type: 'seed' }
  | { type: 'step'; stepIndex: number }
  | { type: 'thread'; stepIndex: number; threadIndex: number }

type ThreadLaneProps = {
  thread: Doc<'stepThreads'>
  stepId: string
  ideaId: string | Id<'ideas'>
  models: ModelInfo[]
  allSteps: StepWithThreads[]
  currentStepIndex: number
  isPipelineRunning?: boolean
  onUpdate: (threadId: string, updates: Record<string, unknown>) => void
  onRemove: (threadId: string) => void
}

type StepRunResult = {
  output: OutputMedia | null
  durationMs: number
  costUsd: number
}

export function ThreadLane({
  thread,
  stepId,
  ideaId,
  models,
  allSteps,
  currentStepIndex,
  isPipelineRunning,
  onUpdate,
  onRemove,
}: ThreadLaneProps) {
  const [showSystem, setShowSystem] = useState(false)
  const [showStepRun, setShowStepRun] = useState(false)
  const [stepRunInput, setStepRunInput] = useState('')
  const [isStepRunning, setIsStepRunning] = useState(false)
  const [stepRunResult, setStepRunResult] = useState<StepRunResult | null>(null)
  const [stepRunError, setStepRunError] = useState<string | null>(null)

  const provider = PROVIDERS[thread.provider]
  const providerColor = provider?.color ?? 'var(--text-muted)'
  const providerColorMuted = provider?.colorMuted ?? 'var(--surface-3)'
  const providerName = provider?.name ?? thread.provider
  const supportsModels = provider?.supportsModels ?? false

  const isRunning = thread.status === 'running'
  const isDone = thread.status === 'done'
  const isFailed = thread.status === 'failed'

  const handleRunStep = async () => {
    if (!stepRunInput.trim()) return
    setIsStepRunning(true)
    setStepRunResult(null)
    setStepRunError(null)

    try {
      // Individual step run is not yet implemented in Convex actions
      // Use the full pipeline run for now
      setStepRunError('Individual step run coming soon. Use "Run Pipeline" to execute all steps.')
    } finally {
      setIsStepRunning(false)
    }
  }

  return (
    <div
      className={[
        'border rounded-[var(--r)] bg-[var(--bg)] p-4 mb-3 last:mb-0',
        'transition-all duration-200',
        isRunning
          ? 'border-[var(--border-active)] shadow-[0_0_12px_rgba(240,196,70,0.05)]'
          : isFailed
            ? 'border-[var(--red-muted)]'
            : 'border-[var(--border)]',
      ].join(' ')}
    >
      {/* Thread header row */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="
            font-[family-name:var(--font-mono)] text-[9px] font-semibold
            uppercase tracking-[0.06em]
            px-1.5 py-0.5 rounded-[3px]
          "
          style={{ background: providerColorMuted, color: providerColor }}
        >
          {providerName}
        </span>
        <span className="text-[12px] font-medium text-[var(--text)] flex-1">
          {thread.name}
        </span>

        {/* Running indicator */}
        {isRunning ? (
          <span className="inline-flex items-center gap-1 shrink-0">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-[status-pulse_1s_ease_infinite]"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--accent)] tracking-[0.02em]">
              running
            </span>
          </span>
        ) : null}

        {/* Done checkmark */}
        {isDone ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--green)] shrink-0">
            <path
              d="M3.5 7L6 9.5L10.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}

        {/* Failed indicator */}
        {isFailed ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--red)] shrink-0">
            <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : null}

        <Tooltip content="Remove this thread from the step" side="top">
          <button
            type="button"
            onClick={() => onRemove(thread._id)}
            className="
              text-[var(--text-faint)] hover:text-[var(--red)]
              text-[11px] font-[family-name:var(--font-mono)]
              cursor-pointer transition-colors duration-150
            "
            aria-label={`Remove thread: ${thread.name}`}
          >
            remove
          </button>
        </Tooltip>
      </div>

      {/* Execution annotations (cost, tokens, duration) */}
      {isDone ? (
        <div className="flex items-center gap-3 mb-3">
          {thread.costUsd != null ? (
            <Annotation label="cost" value={`$${thread.costUsd.toFixed(4)}`} />
          ) : null}
          {thread.tokenUsage ? (
            <Annotation
              label="tokens"
              value={`${thread.tokenUsage.input}/${thread.tokenUsage.output}`}
            />
          ) : null}
          {thread.startedAt && thread.completedAt ? (
            <Annotation
              label="time"
              value={`${((new Date(thread.completedAt).getTime() - new Date(thread.startedAt).getTime()) / 1000).toFixed(1)}s`}
            />
          ) : null}
        </div>
      ) : null}

      {/* Error state */}
      {isFailed && thread.error ? (
        <div className="mb-3 px-2.5 py-2 bg-[var(--red-muted)] border border-[var(--red-muted)] rounded-[var(--r)]">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--red)] leading-relaxed">
            {thread.error}
          </span>
        </div>
      ) : null}

      {/* Output display area */}
      {isDone && thread.output ? (() => {
        const output = thread.output as OutputMedia
        return (
          <div className="mb-3 px-2.5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] max-h-[200px] overflow-y-auto">
            {output.type === 'text' ? (
              <pre className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
                {output.content}
              </pre>
            ) : output.type === 'image' ? (
              <div className="flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={output.url}
                  alt={output.alt ?? 'Generated image'}
                  className="max-w-full rounded-[4px]"
                />
              </div>
            ) : (
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                [{output.type} output]
              </span>
            )}
          </div>
        )
      })() : null}

      {/* Running spinner bar */}
      {isRunning ? (
        <div className="mb-3">
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

      {/* ── Section: Input Source ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-[family-name:var(--font-mono)] text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Input Source
          </span>
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>
        <InputSourcePicker
          currentSources={thread.inputSources as InputSource[] | undefined}
          allSteps={allSteps}
          currentStepIndex={currentStepIndex}
          onChange={(sources) => onUpdate(thread._id, { inputSources: sources.length > 0 ? sources : undefined })}
        />
      </div>

      {/* ── Section: Model ── */}
      {supportsModels && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-[family-name:var(--font-mono)] text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Model
            </span>
            <span className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <TierPicker
            models={models}
            value={thread.model ?? null}
            onChange={(modelId) => onUpdate(thread._id, { model: modelId })}
          />
        </div>
      )}

      {/* ── Section: Prompt ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-[family-name:var(--font-mono)] text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Prompt
          </span>
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>
        <textarea
          value={thread.promptTemplate}
          onChange={(e) =>
            onUpdate(thread._id, { promptTemplate: e.target.value })
          }
          rows={3}
          spellCheck={false}
          className="
            w-full
            bg-[var(--surface)] border border-[var(--border)]
            rounded-[var(--r)]
            px-3.5 py-3
            text-[var(--text)]
            font-[family-name:var(--font-mono)] text-[11.5px]
            leading-[1.6] font-light
            resize-y min-h-[56px]
            outline-none
            transition-colors duration-150
            focus:border-[var(--border-active)]
          "
        />
        <p className="mt-1 text-[9px] text-[var(--text-faint)] font-[family-name:var(--font-mono)]">
          Variables: {'{{input}}'} {'{{seed}}'} {'{{idea.title}}'} {'{{idea.tags}}'} {'{{step.N.output}}'}
        </p>

        {/* System prompt (optional, collapsible) */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowSystem(!showSystem)}
            aria-expanded={showSystem}
            aria-label={`${showSystem ? 'Collapse' : 'Expand'} system prompt`}
            className="
              flex items-center gap-1.5
              font-[family-name:var(--font-mono)] text-[9px] font-semibold
              uppercase tracking-[0.08em] text-[var(--text-faint)]
              cursor-pointer
              hover:text-[var(--text-muted)]
              transition-colors duration-150
            "
          >
            <span className="text-[10px]">{showSystem ? '\u25BC' : '\u25B6'}</span>
            System Prompt
            <Tooltip content="An optional instruction that sets the AI's behavior and persona for this step. Use it to define tone, format rules, or domain expertise." side="right">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[var(--border)] text-[8px] text-[var(--text-faint)] cursor-help">
                ?
              </span>
            </Tooltip>
            <span className="text-[8px] font-normal normal-case tracking-normal text-[var(--text-faint)] italic">
              optional
            </span>
          </button>

          {showSystem && (
            <textarea
              value={thread.systemPrompt ?? ''}
              onChange={(e) =>
                onUpdate(thread._id, {
                  systemPrompt: e.target.value || undefined,
                })
              }
              rows={3}
              spellCheck={false}
              placeholder="e.g. You are a senior copywriter. Write in active voice, keep paragraphs short."
              className="
                mt-2 w-full
                bg-[var(--surface)] border border-[var(--border)]
                rounded-[var(--r)]
                px-3.5 py-3
                text-[var(--text)]
                font-[family-name:var(--font-mono)] text-[11.5px]
                leading-[1.6] font-light
                resize-y min-h-[56px]
                outline-none
                transition-colors duration-150
                focus:border-[var(--border-active)]
                placeholder:text-[var(--text-faint)]
              "
            />
          )}
        </div>
      </div>

      {/* ── Section: Output Format ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-[family-name:var(--font-mono)] text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Output Format
          </span>
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>
        <OutputFormatEditor
          value={thread.outputFormat ?? null}
          onChange={(format) => onUpdate(thread._id, { outputFormat: format })}
        />
      </div>

      {/* ── Test Step ── */}
      {!isPipelineRunning ? (
        <div className="pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => {
              setShowStepRun(!showStepRun)
              setStepRunResult(null)
              setStepRunError(null)
            }}
            aria-expanded={showStepRun}
            aria-label={`${showStepRun ? 'Collapse' : 'Expand'} test step`}
            className="
              flex items-center gap-1.5
              font-[family-name:var(--font-mono)] text-[9px] font-semibold
              uppercase tracking-[0.08em] text-[var(--text-faint)]
              cursor-pointer
              hover:text-[var(--text-muted)]
              transition-colors duration-150
            "
          >
            <span className="text-[10px]">{showStepRun ? '\u25BC' : '\u25B6'}</span>
            Test Step
          </button>
          <p className="mt-0.5 mb-1 text-[9px] text-[var(--text-faint)] font-[family-name:var(--font-mono)]">
            Test this individual step with sample data
          </p>

          {showStepRun ? (
            <div className="mt-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)]">
              <label className="
                block mb-1.5
                font-[family-name:var(--font-mono)] text-[9px] font-semibold
                uppercase tracking-[0.08em] text-[var(--text-faint)]
              ">
                Sample Input
              </label>
              <textarea
                value={stepRunInput}
                onChange={(e) => setStepRunInput(e.target.value)}
                rows={3}
                spellCheck={false}
                placeholder="Paste or type sample input to test this step..."
                className="
                  w-full mb-2
                  bg-[var(--bg)] border border-[var(--border)]
                  rounded-[var(--r)]
                  px-3 py-2
                  text-[var(--text)]
                  font-[family-name:var(--font-mono)] text-[11px]
                  leading-[1.6] font-light
                  resize-y min-h-[48px]
                  outline-none
                  transition-colors duration-150
                  focus:border-[var(--border-active)]
                  placeholder:text-[var(--text-faint)]
                "
              />
              <Button
                variant="default"
                size="sm"
                disabled={!stepRunInput.trim() || isStepRunning}
                onClick={() => void handleRunStep()}
              >
                {isStepRunning ? 'Testing...' : 'Run Test'}
              </Button>

              {/* Step run result */}
              {stepRunResult ? (
                <div className="mt-2 p-2 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r)]">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Annotation label="time" value={`${(stepRunResult.durationMs / 1000).toFixed(1)}s`} />
                    <Annotation label="cost" value={`$${stepRunResult.costUsd.toFixed(4)}`} />
                  </div>
                  {stepRunResult.output?.type === 'text' ? (
                    <pre className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words max-h-[150px] overflow-y-auto">
                      {stepRunResult.output.content}
                    </pre>
                  ) : stepRunResult.output ? (
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                      [{stepRunResult.output.type} output]
                    </span>
                  ) : (
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                      No output
                    </span>
                  )}
                </div>
              ) : null}

              {/* Step run error */}
              {stepRunError ? (
                <div className="mt-2 px-2.5 py-2 bg-[var(--red-muted)] border border-[var(--red-muted)] rounded-[var(--r)]">
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--red)] leading-relaxed">
                    {stepRunError}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
