import { query } from '../_generated/server'
import { v } from 'convex/values'

export const getRunStatus = query({
  args: { runId: v.id('pipelineRuns') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.runId)
  },
})

export const getActiveRun = query({
  args: { ideaId: v.id('ideas') },
  handler: async (ctx, args) => {
    // Find the most recent non-terminal run for this idea
    const runs = await ctx.db
      .query('pipelineRuns')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId))
      .order('desc')
      .take(1)

    const run = runs[0]
    if (!run) return null
    if (run.status === 'done' || run.status === 'failed' || run.status === 'cancelled') {
      return null
    }
    return run
  },
})

export const getLatestRun = query({
  args: { ideaId: v.id('ideas') },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query('pipelineRuns')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId))
      .order('desc')
      .take(1)
    return runs[0] ?? null
  },
})
