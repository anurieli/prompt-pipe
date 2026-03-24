import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const updateStatus = internalMutation({
  args: {
    id: v.id('pipelineSteps'),
    status: v.union(
      v.literal('idle'),
      v.literal('running'),
      v.literal('done'),
      v.literal('failed'),
      v.literal('skipped'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})
