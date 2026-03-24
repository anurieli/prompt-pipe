import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const updateStatus = internalMutation({
  args: {
    id: v.id('ideas'),
    status: v.union(
      v.literal('draft'),
      v.literal('queued'),
      v.literal('running'),
      v.literal('paused'),
      v.literal('done'),
      v.literal('failed'),
      v.literal('archived'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: new Date().toISOString(),
    })
  },
})
