import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const upsertSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    encrypted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        encrypted: args.encrypted,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('settings', {
      key: args.key,
      value: args.value,
      encrypted: args.encrypted,
      updatedAt: now,
    })
  },
})

export const deleteSetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})
