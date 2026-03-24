import { query } from '../_generated/server'
import { v } from 'convex/values'

export const listByStep = query({
  args: { stepId: v.id('pipelineSteps') },
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query('stepThreads')
      .withIndex('by_stepId', (q) => q.eq('stepId', args.stepId))
      .collect()
    threads.sort((a, b) => a.threadIndex - b.threadIndex)
    return threads
  },
})
