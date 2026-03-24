import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    title: v.string(),
    prompt: v.string(),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('queued'),
        v.literal('running'),
        v.literal('paused'),
        v.literal('done'),
        v.literal('failed'),
        v.literal('archived'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const id = await ctx.db.insert('ideas', {
      title: args.title,
      prompt: args.prompt,
      tags: args.tags ?? [],
      status: args.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id('ideas'),
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('queued'),
        v.literal('running'),
        v.literal('paused'),
        v.literal('done'),
        v.literal('failed'),
        v.literal('archived'),
      ),
    ),
    pipelineTemplateId: v.optional(v.id('pipelineTemplates')),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error(`Idea not found: ${id}`)

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.prompt !== undefined) patch.prompt = updates.prompt
    if (updates.tags !== undefined) patch.tags = updates.tags
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.pipelineTemplateId !== undefined) patch.pipelineTemplateId = updates.pipelineTemplateId

    await ctx.db.patch(id, patch)
  },
})

export const remove = mutation({
  args: { id: v.id('ideas') },
  handler: async (ctx, args) => {
    // Delete associated pipeline steps and threads
    const steps = await ctx.db
      .query('pipelineSteps')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.id))
      .collect()

    for (const step of steps) {
      const threads = await ctx.db
        .query('stepThreads')
        .withIndex('by_stepId', (q) => q.eq('stepId', step._id))
        .collect()
      for (const thread of threads) {
        await ctx.db.delete(thread._id)
      }
      await ctx.db.delete(step._id)
    }

    // Delete associated pipeline runs
    const runs = await ctx.db
      .query('pipelineRuns')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.id))
      .collect()
    for (const run of runs) {
      await ctx.db.delete(run._id)
    }

    // Delete associated logs
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_ideaId', (q) => q.eq('ideaId', args.id))
      .collect()
    for (const log of logs) {
      await ctx.db.delete(log._id)
    }

    await ctx.db.delete(args.id)
  },
})

export const archive = mutation({
  args: { id: v.id('ideas') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    })
  },
})

export const duplicate = mutation({
  args: { id: v.id('ideas') },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error(`Idea not found: ${args.id}`)

    const now = new Date().toISOString()
    const newId = await ctx.db.insert('ideas', {
      title: `${existing.title} (copy)`,
      prompt: existing.prompt,
      tags: existing.tags,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    return newId
  },
})

export const createFromPipe = mutation({
  args: {
    title: v.string(),
    prompt: v.string(),
    tags: v.optional(v.array(v.string())),
    defaultModel: v.optional(v.string()),
    steps: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        threads: v.array(
          v.object({
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
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    const ideaId = await ctx.db.insert('ideas', {
      title: args.title,
      prompt: args.prompt,
      tags: args.tags ?? [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })

    for (let stepIdx = 0; stepIdx < args.steps.length; stepIdx++) {
      const step = args.steps[stepIdx]
      const stepId = await ctx.db.insert('pipelineSteps', {
        ideaId,
        stepIndex: stepIdx,
        name: step.name,
        description: step.description,
        status: 'idle',
        createdAt: now,
      })

      for (let threadIdx = 0; threadIdx < step.threads.length; threadIdx++) {
        const thread = step.threads[threadIdx]
        await ctx.db.insert('stepThreads', {
          stepId,
          threadIndex: threadIdx,
          name: thread.name,
          provider: thread.provider,
          nodeType: thread.nodeType,
          model: thread.model ?? args.defaultModel,
          promptTemplate: thread.promptTemplate,
          outputFormat: thread.outputFormat,
          systemPrompt: thread.systemPrompt,
          config: thread.config,
          status: 'idle',
        })
      }
    }

    return ideaId
  },
})
