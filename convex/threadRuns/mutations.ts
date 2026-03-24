import { internalMutation, mutation } from '../_generated/server'
import { v } from 'convex/values'

export const createRun = internalMutation({
  args: {
    threadId: v.id('stepThreads'),
    pipelineRunId: v.id('pipelineRuns'),
    startedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('threadRuns', {
      threadId: args.threadId,
      pipelineRunId: args.pipelineRunId,
      status: 'running',
      startedAt: args.startedAt,
    })
  },
})

export const setResult = internalMutation({
  args: {
    id: v.id('threadRuns'),
    status: v.union(v.literal('done'), v.literal('failed')),
    input: v.optional(v.string()),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
    tokenUsage: v.optional(
      v.object({
        input: v.number(),
        output: v.number(),
      }),
    ),
    costUsd: v.optional(v.number()),
    completedAt: v.optional(v.string()),
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

export const selectAsActive = mutation({
  args: {
    threadRunId: v.id('threadRuns'),
  },
  handler: async (ctx, args) => {
    const threadRun = await ctx.db.get(args.threadRunId)
    if (!threadRun) throw new Error('Thread run not found')

    // Copy run's output back to the parent thread and set activeThreadRunId
    await ctx.db.patch(threadRun.threadId, {
      output: threadRun.output,
      input: threadRun.input,
      tokenUsage: threadRun.tokenUsage,
      costUsd: threadRun.costUsd,
      activeThreadRunId: args.threadRunId,
    })
  },
})
