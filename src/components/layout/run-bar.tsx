'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUIStore } from '@/stores/ui-store'
import type { PipelineStreamState, DryRunResult } from '@/hooks/use-pipeline-stream'
import { Button } from '@/components/shared/button'
import { Tooltip } from '@/components/shared/tooltip'
import type { Id } from '../../../convex/_generated/dataModel'

type RunBarProps = {
  pipelineStream: PipelineStreamState
}

export function RunBar({ pipelineStream }: RunBarProps) {
  const activeIdeaId = useUIStore((s) => s.activeIdeaId)
  const {
    startRun,
    cancelRun,
    resumeRun,
    dryRun,
    isRunning,
    isPaused,
    pausedAtStep,
    error,
    totalCost,
    runId,
  } = pipelineStream

  // Subscribe to active run status for real-time updates
  const activeRun = useQuery(
    api.pipeline.queries.getActiveRun,
    activeIdeaId ? { ideaId: activeIdeaId as Id<'ideas'> } : 'skip',
  )

  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null)
  const [isDryRunning, setIsDryRunning] = useState(false)

  const handleRun = () => {
    if (!activeIdeaId) return
    setDryRunResult(null)
    void startRun(activeIdeaId)
  }

  const handleCancel = () => {
    cancelRun()
  }

  const handleResume = () => {
    void resumeRun()
  }

  const handleDryRun = async () => {
    if (!activeIdeaId) return
    setIsDryRunning(true)
    const result = await dryRun(activeIdeaId)
    setDryRunResult(result)
    setIsDryRunning(false)
  }

  const runStatus = activeRun?.status
  const effectiveIsRunning = isRunning || runStatus === 'running'
  const effectiveIsPaused = isPaused || runStatus === 'paused'
  const effectivePausedAtStep = pausedAtStep ?? activeRun?.pausedBeforeStep ?? null
  const effectiveTotalCost = totalCost ?? (activeRun?.totalCostUsd ?? null)

  const statusText = deriveStatusText(effectiveIsRunning, effectiveIsPaused, effectivePausedAtStep, error, runStatus)

  return (
    <div className="shrink-0">
      {/* Dry run results panel */}
      {dryRunResult ? (
        <div className="px-6 py-2 border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Dry Run Results
            </span>
            <button
              type="button"
              onClick={() => setDryRunResult(null)}
              aria-label="Dismiss dry run results"
              className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)] hover:text-[var(--text-muted)] cursor-pointer transition-colors"
            >
              dismiss
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className={[
              'font-[family-name:var(--font-mono)] text-[10px] font-medium',
              dryRunResult.valid ? 'text-[var(--green)]' : 'text-[var(--red)]',
            ].join(' ')}>
              {dryRunResult.valid ? 'Valid' : `${dryRunResult.errors.length} error(s)`}
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-secondary)]">
              Est. ${dryRunResult.estimatedCostUsd.toFixed(4)}
            </span>
          </div>
          {dryRunResult.errors.length > 0 ? (
            <div className="mt-1.5 space-y-0.5 max-h-[60px] overflow-y-auto">
              {dryRunResult.errors.map((err, i) => (
                <div
                  key={i}
                  className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--red)] leading-relaxed"
                >
                  Step {err.stepIndex}, Thread {err.threadIndex}: {err.error}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Main run bar */}
      <div className="flex items-center justify-between px-6 h-[48px] border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center gap-3">
          {effectiveIsRunning && !effectiveIsPaused ? (
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)] animate-[status-pulse_2s_ease_infinite]" aria-hidden="true" />
          ) : null}
          {effectiveIsPaused ? (
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--amber)]" style={{ backgroundColor: '#f59e0b' }} aria-hidden="true" />
          ) : null}
          <span role="status" aria-live="polite" className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-secondary)] tracking-[0.02em]">
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {effectiveTotalCost !== null && effectiveTotalCost > 0 ? (
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] tracking-[0.02em]">
              ${effectiveTotalCost.toFixed(4)}
            </span>
          ) : null}

          {!effectiveIsRunning ? (
            <Tooltip content="Validate config & estimate cost" side="top">
              <Button
                variant="ghost"
                size="sm"
                disabled={!activeIdeaId || isDryRunning}
                onClick={() => void handleDryRun()}
              >
                {isDryRunning ? 'Checking...' : 'Dry Run'}
              </Button>
            </Tooltip>
          ) : null}

          {effectiveIsRunning && effectiveIsPaused ? (
            <Tooltip content="Continue from paused step" side="top">
              <Button variant="default" size="sm" onClick={handleResume}>
                Resume
              </Button>
            </Tooltip>
          ) : null}

          {effectiveIsRunning ? (
            <Tooltip content="Stop pipeline execution" side="top">
              <Button variant="danger" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </Tooltip>
          ) : null}

          <Tooltip content="Execute all pipeline steps" side="top" shortcut={'\u2318\u23CE'}>
            <Button
              variant="accent"
              size="md"
              disabled={!activeIdeaId || effectiveIsRunning}
              onClick={handleRun}
            >
              {effectiveIsRunning ? (effectiveIsPaused ? 'Paused' : 'Running...') : 'Run Pipeline'}
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

function deriveStatusText(
  isRunning: boolean,
  isPaused: boolean,
  pausedAtStep: number | null,
  error: string | null,
  runStatus: string | null | undefined,
): string {
  if (error) return `Failed: ${error}`
  if (isPaused && pausedAtStep !== null) return `Paused at step ${pausedAtStep + 1}`
  if (runStatus === 'done') return 'Done'
  if (runStatus === 'failed') return 'Failed'
  if (runStatus === 'cancelled') return 'Cancelled'
  if (isRunning) return 'Running...'
  return 'Idle'
}
