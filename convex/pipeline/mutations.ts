import { mutation, internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const createRun = mutation({
  args: { ideaId: v.id('ideas') },
  handler: async (ctx, args) => {
    // Update idea status to running
    await ctx.db.patch(args.ideaId, {
      status: 'running',
      updatedAt: new Date().toISOString(),
    })

    return await ctx.db.insert('pipelineRuns', {
      ideaId: args.ideaId,
      status: 'running',
      currentStepIndex: 0,
      totalCostUsd: 0,
      startedAt: new Date().toISOString(),
    })
  },
})

export const updateRun = internalMutation({
  args: {
    id: v.id('pipelineRuns'),
    status: v.optional(
      v.union(
        v.literal('running'),
        v.literal('paused'),
        v.literal('done'),
        v.literal('failed'),
        v.literal('cancelled'),
      ),
    ),
    currentStepIndex: v.optional(v.number()),
    totalCostUsd: v.optional(v.number()),
    error: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    pausedBeforeStep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value
      }
    }
    await ctx.db.patch(id, patch)
  },
})

export const cancelRun = mutation({
  args: { runId: v.id('pipelineRuns') },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId)
    if (!run) throw new Error('Run not found')
    if (run.status === 'done' || run.status === 'failed' || run.status === 'cancelled') {
      return // Already terminal
    }

    await ctx.db.patch(args.runId, {
      status: 'cancelled',
      completedAt: new Date().toISOString(),
    })

    // Update idea status back
    await ctx.db.patch(run.ideaId, {
      status: 'draft',
      updatedAt: new Date().toISOString(),
    })
  },
})

export const resumeRun = mutation({
  args: { runId: v.id('pipelineRuns') },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId)
    if (!run) throw new Error('Run not found')
    if (run.status !== 'paused') {
      throw new Error('Run is not paused')
    }

    await ctx.db.patch(args.runId, {
      status: 'running',
      pausedBeforeStep: undefined,
    })
  },
})

export const rerunFromStep = mutation({
  args: {
    ideaId: v.id('ideas'),
    fromStepIndex: v.number(),
  },
  handler: async (ctx, args) => {
    // Load all steps for this idea
    const steps = await ctx.db
      .query('pipelineSteps')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId))
      .collect()

    // Reset steps at or after fromStepIndex
    for (const step of steps) {
      if (step.stepIndex >= args.fromStepIndex) {
        await ctx.db.patch(step._id, { status: 'idle' })

        // Reset all threads in this step
        const threads = await ctx.db
          .query('stepThreads')
          .withIndex('by_stepId', (q) => q.eq('stepId', step._id))
          .collect()

        for (const thread of threads) {
          await ctx.db.patch(thread._id, {
            status: 'idle',
            input: undefined,
            output: undefined,
            error: undefined,
            tokenUsage: undefined,
            costUsd: undefined,
            startedAt: undefined,
            completedAt: undefined,
          })
        }
      }
    }

    // Set idea status to running
    await ctx.db.patch(args.ideaId, {
      status: 'running',
      updatedAt: new Date().toISOString(),
    })

    // Create new pipeline run starting from fromStepIndex
    const runId = await ctx.db.insert('pipelineRuns', {
      ideaId: args.ideaId,
      status: 'running',
      currentStepIndex: args.fromStepIndex,
      totalCostUsd: 0,
      startedAt: new Date().toISOString(),
    })

    return runId
  },
})

export const resetExecution = mutation({
  args: { ideaId: v.id('ideas') },
  handler: async (ctx, args) => {
    // Reset all steps to idle
    const steps = await ctx.db
      .query('pipelineSteps')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId))
      .collect()

    for (const step of steps) {
      await ctx.db.patch(step._id, { status: 'idle' })

      // Reset all threads
      const threads = await ctx.db
        .query('stepThreads')
        .withIndex('by_stepId', (q) => q.eq('stepId', step._id))
        .collect()

      for (const thread of threads) {
        await ctx.db.patch(thread._id, {
          status: 'idle',
          input: undefined,
          output: undefined,
          error: undefined,
          tokenUsage: undefined,
          costUsd: undefined,
          startedAt: undefined,
          completedAt: undefined,
        })
      }
    }

    // Update idea status
    await ctx.db.patch(args.ideaId, {
      status: 'draft',
      updatedAt: new Date().toISOString(),
    })
  },
})
