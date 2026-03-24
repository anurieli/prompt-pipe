import { mutation } from '../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    stepId: v.id('pipelineSteps'),
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
      responseType: v.optional(v.union(v.literal('text'), v.literal('image'))),
    }),
    inputSources: v.optional(v.array(
      v.union(
        v.object({ type: v.literal('seed') }),
        v.object({ type: v.literal('step'), stepIndex: v.number() }),
        v.object({ type: v.literal('thread'), stepIndex: v.number(), threadIndex: v.number() }),
      ),
    )),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('stepThreads', {
      ...args,
      status: 'idle',
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('stepThreads'),
    name: v.optional(v.string()),
    provider: v.optional(v.string()),
    nodeType: v.optional(v.string()),
    model: v.optional(v.string()),
    promptTemplate: v.optional(v.string()),
    outputFormat: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    config: v.optional(
      v.object({
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        responseType: v.optional(
          v.union(v.literal('text'), v.literal('image')),
        ),
      }),
    ),
    inputSources: v.optional(v.array(
      v.union(
        v.object({ type: v.literal('seed') }),
        v.object({ type: v.literal('step'), stepIndex: v.number() }),
        v.object({ type: v.literal('thread'), stepIndex: v.number(), threadIndex: v.number() }),
      ),
    )),
    status: v.optional(
      v.union(
        v.literal('idle'),
        v.literal('running'),
        v.literal('done'),
        v.literal('failed'),
      ),
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
    startedAt: v.optional(v.string()),
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

export const remove = mutation({
  args: { id: v.id('stepThreads') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const setOutput = mutation({
  args: {
    id: v.id('stepThreads'),
    output: v.any(),
    status: v.union(
      v.literal('idle'),
      v.literal('running'),
      v.literal('done'),
      v.literal('failed'),
    ),
    costUsd: v.optional(v.number()),
    tokenUsage: v.optional(
      v.object({
        input: v.number(),
        output: v.number(),
      }),
    ),
    completedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
  },
})
