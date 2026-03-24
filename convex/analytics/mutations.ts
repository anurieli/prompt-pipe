import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const recordUsage = internalMutation({
  args: {
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    durationMs: v.number(),
    ideaId: v.id('ideas'),
    stepId: v.id('pipelineSteps'),
    threadId: v.id('stepThreads'),
    runId: v.id('pipelineRuns'),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('usageRecords', args)
  },
})
