import { query } from '../_generated/server'
import { v } from 'convex/values'

export const listByThread = query({
  args: {
    threadId: v.id('stepThreads'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5
    const runs = await ctx.db
      .query('threadRuns')
      .withIndex('by_threadId', (q) => q.eq('threadId', args.threadId))
      .order('desc')
      .take(limit)
    return runs
  },
})
