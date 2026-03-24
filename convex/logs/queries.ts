import { query } from '../_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {
    domain: v.optional(v.string()),
    level: v.optional(
      v.union(
        v.literal('debug'),
        v.literal('info'),
        v.literal('warn'),
        v.literal('error'),
      ),
    ),
    ideaId: v.optional(v.id('ideas')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100

    if (args.ideaId) {
      const logs = await ctx.db
        .query('logs')
        .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId!))
        .order('desc')
        .take(limit)
      return logs
    }

    if (args.domain) {
      const logs = await ctx.db
        .query('logs')
        .withIndex('by_domain', (q) => q.eq('domain', args.domain!))
        .order('desc')
        .take(limit)
      return logs
    }

    if (args.level) {
      const logs = await ctx.db
        .query('logs')
        .withIndex('by_level', (q) => q.eq('level', args.level!))
        .order('desc')
        .take(limit)
      return logs
    }

    return await ctx.db
      .query('logs')
      .order('desc')
      .take(limit)
  },
})
