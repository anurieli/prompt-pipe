'use client'

import { useCallback, useState } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUIStore } from '@/stores/ui-store'
import type { Id } from '../../convex/_generated/dataModel'

export type DryRunResult = {
  valid: boolean
  errors: Array<{ stepIndex: number; threadIndex: number; error: string }>
  estimatedCostUsd: number
}

export type PipelineStreamState = {
  startRun: (ideaId: string) => Promise<void>
  cancelRun: () => void
  resumeRun: () => Promise<void>
  rerunFromStep: (ideaId: string, fromStepIndex: number) => Promise<void>
  dryRun: (ideaId: string) => Promise<DryRunResult | null>
  isRunning: boolean
  isPaused: boolean
  pausedAtStep: number | null
  error: string | null
  totalCost: number | null
  runId: string | null
}

export function usePipelineStream(): PipelineStreamState {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [pausedAtStep, setPausedAtStep] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalCost, setTotalCost] = useState<number | null>(null)
  const [runId, setRunId] = useState<string | null>(null)

  const createRun = useMutation(api.pipeline.mutations.createRun)
  const cancelRunMutation = useMutation(api.pipeline.mutations.cancelRun)
  const rerunFromStepMutation = useMutation(api.pipeline.mutations.rerunFromStep)
  const runPipelineAction = useAction(api.pipeline.actions.runPipeline)
  const resumePipelineAction = useAction(api.pipeline.actions.resumePipeline)
  const dryRunAction = useAction(api.pipeline.actions.dryRun)

  const cancelRun = useCallback(() => {
    if (runId) {
      void cancelRunMutation({ runId: runId as Id<'pipelineRuns'> })
    }
    setIsRunning(false)
    setIsPaused(false)
    setPausedAtStep(null)
  }, [runId, cancelRunMutation])

  const resumeRun = useCallback(async () => {
    if (!runId || !isPaused) return
    try {
      setIsPaused(false)
      setPausedAtStep(null)
      await resumePipelineAction({ runId: runId as Id<'pipelineRuns'> })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(errorMsg)
      setIsRunning(false)
    }
  }, [runId, isPaused, resumePipelineAction])

  const rerunFromStep = useCallback(
    async (ideaId: string, fromStepIndex: number) => {
      cancelRun()

      setError(null)
      setTotalCost(null)
      setIsRunning(true)
      setIsPaused(false)
      setPausedAtStep(null)
      setRunId(null)

      try {
        const newRunId = await rerunFromStepMutation({
          ideaId: ideaId as Id<'ideas'>,
          fromStepIndex,
        })
        setRunId(newRunId)

        await runPipelineAction({
          ideaId: ideaId as Id<'ideas'>,
          runId: newRunId,
          fromStepIndex,
        })

        setIsRunning(false)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setError(errorMsg)
        setIsRunning(false)
      }
    },
    [cancelRun, rerunFromStepMutation, runPipelineAction],
  )

  const dryRun = useCallback(
    async (ideaId: string): Promise<DryRunResult | null> => {
      try {
        return await dryRunAction({ ideaId: ideaId as Id<'ideas'> })
      } catch {
        return null
      }
    },
    [dryRunAction],
  )

  const startRun = useCallback(
    async (ideaId: string) => {
      cancelRun()

      setError(null)
      setTotalCost(null)
      setIsRunning(true)
      setIsPaused(false)
      setPausedAtStep(null)
      setRunId(null)

      try {
        const newRunId = await createRun({ ideaId: ideaId as Id<'ideas'> })
        setRunId(newRunId)

        // Fire the pipeline action — it runs server-side
        // The UI will update reactively via useQuery subscriptions
        await runPipelineAction({
          ideaId: ideaId as Id<'ideas'>,
          runId: newRunId,
        })

        // Pipeline completed (or paused/failed — action returned)
        setIsRunning(false)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setError(errorMsg)
        setIsRunning(false)
      }
    },
    [cancelRun, createRun, runPipelineAction],
  )

  return {
    startRun,
    cancelRun,
    resumeRun,
    rerunFromStep,
    dryRun,
    isRunning,
    isPaused,
    pausedAtStep,
    error,
    totalCost,
    runId,
  }
}
