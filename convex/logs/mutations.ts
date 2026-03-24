import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const insert = internalMutation({
  args: {
    level: v.union(
      v.literal('debug'),
      v.literal('info'),
      v.literal('warn'),
      v.literal('error'),
    ),
    domain: v.string(),
    event: v.string(),
    message: v.string(),
    ideaId: v.optional(v.id('ideas')),
    stepId: v.optional(v.id('pipelineSteps')),
    stepIndex: v.optional(v.number()),
    threadId: v.optional(v.id('stepThreads')),
    threadIndex: v.optional(v.number()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    data: v.optional(v.any()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('logs', {
      timestamp: new Date().toISOString(),
      ...args,
    })
  },
})
