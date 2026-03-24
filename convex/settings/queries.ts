import { query } from '../_generated/server'
import { v } from 'convex/values'
import { maskApiKey } from './mask'

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('settings').collect()

    const result: Record<string, unknown> = {}
    for (const row of rows) {
      if (row.encrypted) {
        // Never return encrypted values — only masked version
        result[row.key] = {
          hasKey: true,
          maskedKey: maskApiKey(row.value.split(':').pop() ?? ''),
        }
      } else {
        result[row.key] = JSON.parse(row.value) as unknown
      }
    }
    return result
  },
})

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    if (!row) return null

    if (row.encrypted) {
      return { hasKey: true, maskedKey: '••••••••' }
    }

    return JSON.parse(row.value) as unknown
  },
})

export const hasApiKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()

    return row !== null
  },
})
