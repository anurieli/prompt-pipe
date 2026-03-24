import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  ideas: defineTable({
    title: v.string(),
    prompt: v.string(),
    tags: v.array(v.string()),
    status: v.union(
      v.literal('draft'),
      v.literal('queued'),
      v.literal('running'),
      v.literal('paused'),
      v.literal('done'),
      v.literal('failed'),
      v.literal('archived'),
    ),
    pipelineTemplateId: v.optional(v.id('pipelineTemplates')),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt']),

  pipelineSteps: defineTable({
    ideaId: v.id('ideas'),
    stepIndex: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal('idle'),
      v.literal('running'),
      v.literal('done'),
      v.literal('failed'),
      v.literal('skipped'),
    ),
    createdAt: v.string(),
  })
    .index('by_ideaId', ['ideaId'])
    .index('by_ideaId_stepIndex', ['ideaId', 'stepIndex']),

  stepThreads: defineTable({
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
    status: v.union(
      v.literal('idle'),
      v.literal('running'),
      v.literal('done'),
      v.literal('failed'),
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
    activeThreadRunId: v.optional(v.id('threadRuns')),
  }).index('by_stepId', ['stepId']),

  pipelineTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    templateData: v.any(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
    encrypted: v.boolean(),
    updatedAt: v.string(),
  }).index('by_key', ['key']),

  logs: defineTable({
    timestamp: v.string(),
    level: v.union(
      v.literal('debug'),
      v.literal('info'),
      v.literal('warn'),
      v.literal('error'),
    ),
    domain: v.string(),
    event: v.string(),
    message: v.string(),
    ideaId: v.optional(v.id('ideas')),
    stepId: v.optional(v.id('pipelineSteps')),
    stepIndex: v.optional(v.number()),
    threadId: v.optional(v.id('stepThreads')),
    threadIndex: v.optional(v.number()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    data: v.optional(v.any()),
    durationMs: v.optional(v.number()),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_ideaId', ['ideaId'])
    .index('by_domain', ['domain'])
    .index('by_level', ['level']),

  pipelineRuns: defineTable({
    ideaId: v.id('ideas'),
    status: v.union(
      v.literal('running'),
      v.literal('paused'),
      v.literal('done'),
      v.literal('failed'),
      v.literal('cancelled'),
    ),
    currentStepIndex: v.number(),
    totalCostUsd: v.number(),
    error: v.optional(v.string()),
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
    pausedBeforeStep: v.optional(v.number()),
  })
    .index('by_ideaId', ['ideaId'])
    .index('by_status', ['status']),

  threadRuns: defineTable({
    threadId: v.id('stepThreads'),
    pipelineRunId: v.id('pipelineRuns'),
    status: v.union(
      v.literal('running'),
      v.literal('done'),
      v.literal('failed'),
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
  })
    .index('by_threadId', ['threadId'])
    .index('by_pipelineRunId', ['pipelineRunId']),

  usageRecords: defineTable({
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    durationMs: v.number(),
    ideaId: v.id('ideas'),
    stepId: v.id('pipelineSteps'),
    threadId: v.id('stepThreads'),
    runId: v.id('pipelineRuns'),
    timestamp: v.string(),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_model', ['model'])
    .index('by_provider', ['provider'])
    .index('by_ideaId', ['ideaId'])
    .index('by_runId', ['runId']),
})
