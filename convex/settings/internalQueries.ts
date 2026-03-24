import { internalQuery } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Internal query to get the raw encrypted value of a setting.
 * ONLY callable by other Convex functions — never exposed to client.
 */
export const getEncryptedSetting = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    if (!row) return null
    return { value: row.value, encrypted: row.encrypted }
  },
})

/**
 * Get a non-encrypted setting's parsed value.
 * For internal use by other Convex functions.
 */
export const getSettingValue = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    if (!row) return null
    if (row.encrypted) return null

    return JSON.parse(row.value) as unknown
  },
})
