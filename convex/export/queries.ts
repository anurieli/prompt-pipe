import { query } from '../_generated/server'
import { v } from 'convex/values'

export const exportIdea = query({
  args: { ideaId: v.id('ideas') },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId)
    if (!idea) return null

    const steps = await ctx.db
      .query('pipelineSteps')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId))
      .collect()

    steps.sort((a, b) => a.stepIndex - b.stepIndex)

    const stepsWithThreads = []
    for (const step of steps) {
      const threads = await ctx.db
        .query('stepThreads')
        .withIndex('by_stepId', (q) => q.eq('stepId', step._id))
        .collect()
      threads.sort((a, b) => a.threadIndex - b.threadIndex)
      stepsWithThreads.push({ ...step, threads })
    }

    // Get latest run
    const runs = await ctx.db
      .query('pipelineRuns')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId))
      .order('desc')
      .take(1)

    return {
      idea,
      steps: stepsWithThreads,
      latestRun: runs[0] ?? null,
    }
  },
})
