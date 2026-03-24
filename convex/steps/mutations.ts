import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    ideaId: v.id('ideas'),
    stepIndex: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    threads: v.optional(
      v.array(
        v.object({
          threadIndex: v.number(),
          name: v.string(),
          provider: v.string(),
          nodeType: v.string(),
          model: v.optional(v.string()),
          promptTemplate: v.string(),
          outputFormat: v.optional(v.string()),
          systemPrompt: v.optional(v.string()),
          config: v.object({
            temperature: v.optional(v.number()),
            maxTokens: v.optional(v.number()),
            responseType: v.optional(
              v.union(v.literal('text'), v.literal('image')),
            ),
          }),
          inputSources: v.optional(v.array(
            v.union(
              v.object({ type: v.literal('seed') }),
              v.object({ type: v.literal('step'), stepIndex: v.number() }),
              v.object({ type: v.literal('thread'), stepIndex: v.number(), threadIndex: v.number() }),
            ),
          )),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const stepId = await ctx.db.insert('pipelineSteps', {
      ideaId: args.ideaId,
      stepIndex: args.stepIndex,
      name: args.name,
      description: args.description,
      status: 'idle',
      createdAt: now,
    })

    // Create threads if provided
    if (args.threads) {
      for (const thread of args.threads) {
        await ctx.db.insert('stepThreads', {
          stepId,
          threadIndex: thread.threadIndex,
          name: thread.name,
          provider: thread.provider,
          nodeType: thread.nodeType,
          model: thread.model,
          promptTemplate: thread.promptTemplate,
          outputFormat: thread.outputFormat,
          systemPrompt: thread.systemPrompt,
          config: thread.config,
          inputSources: thread.inputSources,
          status: 'idle',
        })
      }
    }

    return stepId
  },
})

export const update = mutation({
  args: {
    id: v.id('pipelineSteps'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('idle'),
        v.literal('running'),
        v.literal('done'),
        v.literal('failed'),
        v.literal('skipped'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const patch: Record<string, unknown> = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.description !== undefined) patch.description = updates.description
    if (updates.status !== undefined) patch.status = updates.status
    await ctx.db.patch(id, patch)
  },
})

export const remove = mutation({
  args: { id: v.id('pipelineSteps') },
  handler: async (ctx, args) => {
    // Delete associated threads
    const threads = await ctx.db
      .query('stepThreads')
      .withIndex('by_stepId', (q) => q.eq('stepId', args.id))
      .collect()
    for (const thread of threads) {
      await ctx.db.delete(thread._id)
    }
    await ctx.db.delete(args.id)
  },
})

export const updateStatus = mutation({
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

export const reorder = mutation({
  args: {
    ideaId: v.id('ideas'),
    stepIds: v.array(v.id('pipelineSteps')),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.stepIds.length; i++) {
      await ctx.db.patch(args.stepIds[i], { stepIndex: i })
    }
  },
})
