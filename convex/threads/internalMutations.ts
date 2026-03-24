import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const updateStatus = internalMutation({
  args: {
    id: v.id('stepThreads'),
    status: v.union(
      v.literal('idle'),
      v.literal('running'),
      v.literal('done'),
      v.literal('failed'),
    ),
    startedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status }
    if (args.startedAt) patch.startedAt = args.startedAt
    await ctx.db.patch(args.id, patch)
  },
})

export const setResult = internalMutation({
  args: {
    id: v.id('stepThreads'),
    status: v.union(
      v.literal('idle'),
      v.literal('running'),
      v.literal('done'),
      v.literal('failed'),
    ),
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
