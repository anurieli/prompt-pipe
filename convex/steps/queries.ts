import { query } from '../_generated/server'
import { v } from 'convex/values'
import type { Doc } from '../_generated/dataModel'

export type StepWithThreads = Doc<'pipelineSteps'> & {
  threads: Doc<'stepThreads'>[]
}

export const listByIdea = query({
  args: { ideaId: v.id('ideas') },
  handler: async (ctx, args): Promise<StepWithThreads[]> => {
    const steps = await ctx.db
      .query('pipelineSteps')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.ideaId))
      .collect()

    // Sort by stepIndex
    steps.sort((a, b) => a.stepIndex - b.stepIndex)

    // Load threads for each step
    const stepsWithThreads: StepWithThreads[] = []
    for (const step of steps) {
      const threads = await ctx.db
        .query('stepThreads')
        .withIndex('by_stepId', (q) => q.eq('stepId', step._id))
        .collect()
      threads.sort((a, b) => a.threadIndex - b.threadIndex)
      stepsWithThreads.push({ ...step, threads })
    }

    return stepsWithThreads
  },
})

export const get = query({
  args: { id: v.id('pipelineSteps') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
