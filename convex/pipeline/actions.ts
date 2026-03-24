'use node'

import { action } from '../_generated/server'
import { internal } from '../_generated/api'
import { api } from '../_generated/api'
import { v } from 'convex/values'
import { decrypt } from '../settings/encryption'
import { createOpenRouterAdapter } from '../lib/providers/openrouterAdapter'
import { createWebhookAdapter } from '../lib/providers/webhookAdapter'
import { resolveVariables, resolveInputSources, type VariableContext, type InputSource } from '../lib/variableResolver'
import type { OutputMedia } from '../../src/types/output-media'
import type { Id } from '../_generated/dataModel'

function extractInputText(media: OutputMedia): string {
  switch (media.type) {
    case 'text':
      return media.content
    case 'image':
      return `[image: ${media.url}]`
    case 'images':
      return media.items.map((item) => `[image: ${item.url}]`).join('\n')
    case 'mixed':
      return media.items.map((item) => extractInputText(item)).join('\n')
  }
}

async function getDecryptedApiKey(
  ctx: { runQuery: typeof Object.prototype.constructor },
  provider: string,
): Promise<string> {
  const keyMap: Record<string, string> = {
    openrouter: 'openrouter_api_key',
  }
  const settingKey = keyMap[provider]
  if (!settingKey) {
    throw new Error(`No API key mapping for provider: ${provider}`)
  }

  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    throw new Error(
      'ENCRYPTION_KEY environment variable not set. Run: npx convex env set ENCRYPTION_KEY <key>',
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = await (ctx as any).runQuery(
    internal.settings.internalQueries.getEncryptedSetting,
    { key: settingKey },
  )
  if (!row || !row.encrypted) {
    throw new Error(
      `API key for ${provider} not found in settings. Save it in Settings > API Keys.`,
    )
  }

  try {
    return decrypt(row.value, encryptionKey)
  } catch (e) {
    throw new Error(
      `Failed to decrypt ${provider} API key. The ENCRYPTION_KEY may have changed since the key was saved. Re-save the key in Settings.`,
    )
  }
}

export const runPipeline = action({
  args: {
    ideaId: v.id('ideas'),
    runId: v.id('pipelineRuns'),
    fromStepIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { ideaId, runId } = args
    const fromStepIndex = args.fromStepIndex ?? 0

    // Log pipeline start
    await ctx.runMutation(internal.logs.mutations.insert, {
      level: 'info',
      domain: 'pipeline',
      event: 'pipeline.start',
      message: `Starting pipeline for idea`,
      ideaId,
    })

    // Load idea
    const idea = await ctx.runQuery(api.ideas.queries.get, { id: ideaId })
    if (!idea) {
      await ctx.runMutation(internal.pipeline.mutations.updateRun, {
        id: runId,
        status: 'failed',
        error: 'Idea not found',
        completedAt: new Date().toISOString(),
      })
      return
    }

    // Load steps with threads
    const steps = await ctx.runQuery(api.steps.queries.listByIdea, { ideaId })
    if (steps.length === 0) {
      await ctx.runMutation(internal.pipeline.mutations.updateRun, {
        id: runId,
        status: 'failed',
        error: 'No steps configured',
        completedAt: new Date().toISOString(),
      })
      return
    }

    // Track outputs for variable resolution
    const stepOutputs = new Map<number, OutputMedia>()
    const threadOutputs = new Map<string, OutputMedia>()
    let currentInput = idea.prompt
    let totalCostUsd = 0

    // Pre-populate outputs from already-completed steps (when rerunning from a step)
    if (fromStepIndex > 0) {
      for (const step of steps) {
        if (step.stepIndex < fromStepIndex) {
          for (const thread of step.threads) {
            if (thread.output) {
              threadOutputs.set(`${step.stepIndex}:${thread.threadIndex}`, thread.output as OutputMedia)
            }
          }
          // Use first thread's output as step-level output
          const firstThread = step.threads.find((t) => t.output)
          if (firstThread?.output) {
            const stepOutput = firstThread.output as OutputMedia
            stepOutputs.set(step.stepIndex, stepOutput)
            currentInput = extractInputText(stepOutput)
          }
        }
      }
    }

    for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
      const step = steps[stepIdx]

      // Skip steps that have already completed (before fromStepIndex)
      if (step.stepIndex < fromStepIndex) {
        continue
      }

      // Check if run was cancelled
      const currentRun = await ctx.runQuery(api.pipeline.queries.getRunStatus, { runId })
      if (currentRun?.status === 'cancelled') {
        await ctx.runMutation(internal.logs.mutations.insert, {
          level: 'info',
          domain: 'pipeline',
          event: 'pipeline.cancelled',
          message: 'Pipeline cancelled',
          ideaId,
        })
        return
      }

      // Check if run is paused — wait for resume
      if (currentRun?.status === 'paused') {
        // The action returns here. A new action invocation will continue from the paused step.
        return
      }

      // Update step status to running
      await ctx.runMutation(internal.steps.internalMutations.updateStatus, {
        id: step._id,
        status: 'running',
      })

      await ctx.runMutation(internal.pipeline.mutations.updateRun, {
        id: runId,
        currentStepIndex: step.stepIndex,
      })

      let allThreadsFailed = true
      let firstSuccessfulOutput: OutputMedia | null = null
      let stepCostUsd = 0

      // Execute threads (sequentially in Convex action to avoid complexity)
      for (const thread of step.threads) {
        const threadStartedAt = new Date().toISOString()

        // Mark thread running
        await ctx.runMutation(internal.threads.internalMutations.updateStatus, {
          id: thread._id,
          status: 'running',
          startedAt: threadStartedAt,
        })

        // Create a threadRun record for history tracking
        const threadRunId = await ctx.runMutation(internal.threadRuns.mutations.createRun, {
          threadId: thread._id,
          pipelineRunId: runId,
          startedAt: threadStartedAt,
        })

        try {
          // Resolve per-thread input based on inputSources
          const baseContext: VariableContext = {
            seed: idea.prompt,
            input: currentInput,
            ideaTitle: idea.title,
            ideaTags: idea.tags,
            stepOutputs,
            threadOutputs,
          }
          const threadInput = resolveInputSources(
            thread.inputSources as InputSource[] | undefined,
            baseContext,
          )

          // Resolve variables in prompt template
          const context: VariableContext = {
            ...baseContext,
            input: threadInput,
          }
          const resolvedPrompt = resolveVariables(thread.promptTemplate, context)

          // Get API key and create adapter
          const apiKey = await getDecryptedApiKey(ctx, thread.provider)
          let result: { output: OutputMedia; tokenUsage?: { input: number; output: number }; costUsd: number; durationMs: number }

          if (thread.provider === 'openrouter') {
            const adapter = createOpenRouterAdapter(apiKey)
            result = await adapter.execute({
              prompt: resolvedPrompt,
              model: thread.model ?? '',
              outputFormat: thread.outputFormat ?? undefined,
              temperature: thread.config.temperature,
              maxTokens: thread.config.maxTokens,
              systemPrompt: thread.systemPrompt ?? undefined,
              responseType: thread.config.responseType ?? 'text',
            })
          } else if (thread.provider === 'webhook') {
            // For webhook, we'd need the URL from config — simplified for now
            const adapter = createWebhookAdapter(thread.model ?? '')
            result = await adapter.execute({
              prompt: resolvedPrompt,
              model: thread.model ?? '',
              responseType: thread.config.responseType ?? 'text',
            })
          } else {
            throw new Error(`Unsupported provider in Convex: ${thread.provider}`)
          }

          const completedAt = new Date().toISOString()

          // Update thread with results
          await ctx.runMutation(internal.threads.internalMutations.setResult, {
            id: thread._id,
            status: 'done',
            input: resolvedPrompt,
            output: result.output,
            tokenUsage: result.tokenUsage,
            costUsd: result.costUsd,
            completedAt,
          })

          // Record this run in history
          await ctx.runMutation(internal.threadRuns.mutations.setResult, {
            id: threadRunId,
            status: 'done',
            input: resolvedPrompt,
            output: result.output,
            tokenUsage: result.tokenUsage,
            costUsd: result.costUsd,
            completedAt,
          })

          // Track for variable resolution
          threadOutputs.set(`${step.stepIndex}:${thread.threadIndex}`, result.output)

          allThreadsFailed = false
          stepCostUsd += result.costUsd
          if (!firstSuccessfulOutput) {
            firstSuccessfulOutput = result.output
          }

          await ctx.runMutation(internal.logs.mutations.insert, {
            level: 'info',
            domain: 'thread',
            event: 'thread.execute.done',
            message: `Thread ${thread.name} completed`,
            ideaId,
            stepId: step._id,
            stepIndex: step.stepIndex,
            threadId: thread._id,
            threadIndex: thread.threadIndex,
            model: thread.model ?? undefined,
            provider: thread.provider,
            durationMs: result.durationMs,
          })

          // Record usage for analytics (persists across pipeline resets)
          if (result.tokenUsage) {
            await ctx.runMutation(internal.analytics.mutations.recordUsage, {
              model: thread.model ?? 'unknown',
              provider: thread.provider,
              inputTokens: result.tokenUsage.input,
              outputTokens: result.tokenUsage.output,
              costUsd: result.costUsd,
              durationMs: result.durationMs,
              ideaId,
              stepId: step._id,
              threadId: thread._id,
              runId,
              timestamp: new Date().toISOString(),
            })
          }
        } catch (error) {
          let errorMsg = error instanceof Error ? error.message : String(error)
          console.error(`[pipeline] Thread ${thread.name} failed:`, errorMsg)

          // Enrich 402 (insufficient credits) errors with actionable guidance
          if (/402|can only afford/i.test(errorMsg)) {
            errorMsg = `${errorMsg} — Insufficient credits. Add more at openrouter.ai/settings/credits`
          }

          const failedAt = new Date().toISOString()

          await ctx.runMutation(internal.threads.internalMutations.setResult, {
            id: thread._id,
            status: 'failed',
            error: errorMsg,
            completedAt: failedAt,
          })

          // Record failure in history
          await ctx.runMutation(internal.threadRuns.mutations.setResult, {
            id: threadRunId,
            status: 'failed',
            error: errorMsg,
            completedAt: failedAt,
          })

          await ctx.runMutation(internal.logs.mutations.insert, {
            level: 'error',
            domain: 'thread',
            event: 'thread.execute.fail',
            message: `Thread ${thread.name} failed: ${errorMsg}`,
            ideaId,
            stepId: step._id,
            stepIndex: step.stepIndex,
            threadId: thread._id,
            threadIndex: thread.threadIndex,
            provider: thread.provider,
          })
        }
      }

      totalCostUsd += stepCostUsd

      if (allThreadsFailed) {
        // Step failed
        await ctx.runMutation(internal.steps.internalMutations.updateStatus, {
          id: step._id,
          status: 'failed',
        })

        await ctx.runMutation(internal.pipeline.mutations.updateRun, {
          id: runId,
          status: 'failed',
          error: `All threads failed at step ${step.stepIndex}`,
          totalCostUsd,
          completedAt: new Date().toISOString(),
        })

        await ctx.runMutation(internal.ideas.internalMutations.updateStatus, {
          id: ideaId,
          status: 'failed',
        })

        return
      }

      // Step succeeded
      await ctx.runMutation(internal.steps.internalMutations.updateStatus, {
        id: step._id,
        status: 'done',
      })

      // Update step output for next step's input
      if (firstSuccessfulOutput) {
        stepOutputs.set(step.stepIndex, firstSuccessfulOutput)
        currentInput = extractInputText(firstSuccessfulOutput)
      }

      // Check pause_between_steps setting
      const isLastStep = stepIdx === steps.length - 1
      if (!isLastStep) {
        const pauseSetting = await ctx.runQuery(
          internal.settings.internalQueries.getSettingValue,
          { key: 'pause_between_steps' },
        )

        if (pauseSetting === true) {
          const nextStepIndex = steps[stepIdx + 1].stepIndex
          await ctx.runMutation(internal.pipeline.mutations.updateRun, {
            id: runId,
            status: 'paused',
            totalCostUsd,
            pausedBeforeStep: nextStepIndex,
          })

          await ctx.runMutation(internal.ideas.internalMutations.updateStatus, {
            id: ideaId,
            status: 'paused',
          })

          // Action returns here. Resume will trigger a new action invocation.
          return
        }
      }
    }

    // Pipeline completed successfully
    await ctx.runMutation(internal.pipeline.mutations.updateRun, {
      id: runId,
      status: 'done',
      totalCostUsd,
      completedAt: new Date().toISOString(),
    })

    await ctx.runMutation(internal.ideas.internalMutations.updateStatus, {
      id: ideaId,
      status: 'done',
    })

    await ctx.runMutation(internal.logs.mutations.insert, {
      level: 'info',
      domain: 'pipeline',
      event: 'pipeline.done',
      message: 'Pipeline completed',
      ideaId,
      data: { totalCostUsd },
    })
  },
})

export const resumePipeline = action({
  args: { runId: v.id('pipelineRuns') },
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(api.pipeline.queries.getRunStatus, { runId: args.runId })
    if (!run || run.status !== 'paused') {
      throw new Error('Run is not paused')
    }

    // Set status to running
    await ctx.runMutation(internal.pipeline.mutations.updateRun, {
      id: args.runId,
      status: 'running',
      pausedBeforeStep: undefined,
    })

    // Re-run the pipeline action — it will pick up from the current step
    await ctx.runAction(api.pipeline.actions.runPipeline, {
      ideaId: run.ideaId,
      runId: args.runId,
    })
  },
})

export const dryRun = action({
  args: { ideaId: v.id('ideas') },
  handler: async (ctx, args) => {
    const idea = await ctx.runQuery(api.ideas.queries.get, { id: args.ideaId })
    if (!idea) {
      return { valid: false, errors: [{ stepIndex: 0, threadIndex: 0, error: 'Idea not found' }], estimatedCostUsd: 0 }
    }

    const steps = await ctx.runQuery(api.steps.queries.listByIdea, { ideaId: args.ideaId })
    if (steps.length === 0) {
      return { valid: false, errors: [{ stepIndex: 0, threadIndex: 0, error: 'No steps configured' }], estimatedCostUsd: 0 }
    }

    const errors: Array<{ stepIndex: number; threadIndex: number; error: string }> = []
    let estimatedCostUsd = 0

    const stepOutputs = new Map<number, OutputMedia>()
    const threadOutputs = new Map<string, OutputMedia>()
    let currentInput = idea.prompt

    for (const step of steps) {
      for (const thread of step.threads) {
        const baseContext: VariableContext = {
          seed: idea.prompt,
          input: currentInput,
          ideaTitle: idea.title,
          ideaTags: idea.tags,
          stepOutputs,
          threadOutputs,
        }
        const threadInput = resolveInputSources(
          thread.inputSources as InputSource[] | undefined,
          baseContext,
        )
        const context: VariableContext = { ...baseContext, input: threadInput }

        const resolved = resolveVariables(thread.promptTemplate, context)
        const unresolvedMatches = resolved.match(/\{\{[^}]+\}\}/g)
        if (unresolvedMatches) {
          for (const match of unresolvedMatches) {
            errors.push({ stepIndex: step.stepIndex, threadIndex: thread.threadIndex, error: `Unresolved variable: ${match}` })
          }
        }

        if (thread.provider === 'openrouter') {
          const apiKey = await getDecryptedApiKey(ctx, thread.provider)
          if (!apiKey) {
            errors.push({ stepIndex: step.stepIndex, threadIndex: thread.threadIndex, error: 'OpenRouter API key not configured' })
          }
          if (!thread.model) {
            errors.push({ stepIndex: step.stepIndex, threadIndex: thread.threadIndex, error: 'No model selected for OpenRouter thread' })
          }
        }

        const estimatedInputTokens = Math.ceil(resolved.length / 4)
        const estimatedOutputTokens = thread.config.maxTokens ?? 1000
        estimatedCostUsd += (estimatedInputTokens / 1000) * 0.001 + (estimatedOutputTokens / 1000) * 0.002

        const simulatedOutput: OutputMedia = { type: 'text', content: `[simulated]` }
        threadOutputs.set(`${step.stepIndex}:${thread.threadIndex}`, simulatedOutput)
      }

      const firstOutput = threadOutputs.get(`${step.stepIndex}:0`)
      if (firstOutput) {
        stepOutputs.set(step.stepIndex, firstOutput)
        currentInput = extractInputText(firstOutput)
      }
    }

    return { valid: errors.length === 0, errors, estimatedCostUsd }
  },
})
