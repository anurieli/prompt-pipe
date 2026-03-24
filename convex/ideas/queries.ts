import { query } from '../_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('queued'),
        v.literal('running'),
        v.literal('paused'),
        v.literal('done'),
        v.literal('failed'),
        v.literal('archived'),
      ),
    ),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query('ideas')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect()
    }

    const all = await ctx.db.query('ideas').order('desc').collect()

    if (args.includeArchived) {
      return all
    }

    return all.filter((idea) => idea.status !== 'archived')
  },
})

export const get = query({
  args: { id: v.id('ideas') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
