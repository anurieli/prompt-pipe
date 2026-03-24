import { query } from '../_generated/server'
import { v } from 'convex/values'

export const getUsageSummary = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db
      .query('usageRecords')
      .withIndex('by_timestamp')
      .order('desc')
      .take(10000)

    const byModel = new Map<
      string,
      {
        model: string
        provider: string
        totalRuns: number
        totalInputTokens: number
        totalOutputTokens: number
        totalCostUsd: number
        lastUsedAt: string
      }
    >()

    for (const record of records) {
      const existing = byModel.get(record.model)
      if (existing) {
        existing.totalRuns += 1
        existing.totalInputTokens += record.inputTokens
        existing.totalOutputTokens += record.outputTokens
        existing.totalCostUsd += record.costUsd
        if (record.timestamp > existing.lastUsedAt) {
          existing.lastUsedAt = record.timestamp
        }
      } else {
        byModel.set(record.model, {
          model: record.model,
          provider: record.provider,
          totalRuns: 1,
          totalInputTokens: record.inputTokens,
          totalOutputTokens: record.outputTokens,
          totalCostUsd: record.costUsd,
          lastUsedAt: record.timestamp,
        })
      }
    }

    const summary = Array.from(byModel.values())
    summary.sort((a, b) => b.totalCostUsd - a.totalCostUsd)
    return summary
  },
})

export const getUsageOverTime = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - args.days)
    const cutoffIso = cutoff.toISOString()

    const records = await ctx.db
      .query('usageRecords')
      .withIndex('by_timestamp')
      .order('desc')
      .take(10000)

    const byDate = new Map<
      string,
      {
        date: string
        totalCostUsd: number
        totalInputTokens: number
        totalOutputTokens: number
        runCount: number
      }
    >()

    for (const record of records) {
      if (record.timestamp < cutoffIso) continue
      const date = record.timestamp.slice(0, 10)
      const existing = byDate.get(date)
      if (existing) {
        existing.totalCostUsd += record.costUsd
        existing.totalInputTokens += record.inputTokens
        existing.totalOutputTokens += record.outputTokens
        existing.runCount += 1
      } else {
        byDate.set(date, {
          date,
          totalCostUsd: record.costUsd,
          totalInputTokens: record.inputTokens,
          totalOutputTokens: record.outputTokens,
          runCount: 1,
        })
      }
    }

    const result = Array.from(byDate.values())
    result.sort((a, b) => a.date.localeCompare(b.date))
    return result
  },
})

export const getTotalStats = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db
      .query('usageRecords')
      .withIndex('by_timestamp')
      .order('desc')
      .take(10000)

    let totalCostUsd = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const models = new Set<string>()

    for (const record of records) {
      totalCostUsd += record.costUsd
      totalInputTokens += record.inputTokens
      totalOutputTokens += record.outputTokens
      models.add(record.model)
    }

    return {
      totalCostUsd,
      totalInputTokens,
      totalOutputTokens,
      totalRuns: records.length,
      uniqueModels: models.size,
    }
  },
})
