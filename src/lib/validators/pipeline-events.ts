import { z } from 'zod'
import { OutputMediaSchema } from './output-media'

export const StepStartedEventSchema = z.object({
  event: z.literal('step:started'),
  stepId: z.string(),
  stepIndex: z.number(),
  threadCount: z.number(),
})
export type StepStartedEvent = z.infer<typeof StepStartedEventSchema>

export const StepDoneEventSchema = z.object({
  event: z.literal('step:done'),
  stepId: z.string(),
  stepIndex: z.number(),
  durationMs: z.number(),
  totalStepCostUsd: z.number(),
})
export type StepDoneEvent = z.infer<typeof StepDoneEventSchema>

export const StepFailedEventSchema = z.object({
  event: z.literal('step:failed'),
  stepId: z.string(),
  stepIndex: z.number(),
  error: z.string(),
})
export type StepFailedEvent = z.infer<typeof StepFailedEventSchema>

export const ThreadStartedEventSchema = z.object({
  event: z.literal('thread:started'),
  threadId: z.string(),
  threadIndex: z.number(),
  model: z.string(),
})
export type ThreadStartedEvent = z.infer<typeof ThreadStartedEventSchema>

export const ThreadDoneEventSchema = z.object({
  event: z.literal('thread:done'),
  threadId: z.string(),
  threadIndex: z.number(),
  output: OutputMediaSchema,
  costUsd: z.number(),
  durationMs: z.number(),
})
export type ThreadDoneEvent = z.infer<typeof ThreadDoneEventSchema>

export const ThreadFailedEventSchema = z.object({
  event: z.literal('thread:failed'),
  threadId: z.string(),
  threadIndex: z.number(),
  error: z.string(),
})
export type ThreadFailedEvent = z.infer<typeof ThreadFailedEventSchema>

export const PipelinePausedEventSchema = z.object({
  event: z.literal('pipeline:paused'),
  pausedBeforeStep: z.number(),
})
export type PipelinePausedEvent = z.infer<typeof PipelinePausedEventSchema>

export const PipelineDoneEventSchema = z.object({
  event: z.literal('pipeline:done'),
  runId: z.string(),
  totalCostUsd: z.number(),
  totalDurationMs: z.number(),
})
export type PipelineDoneEvent = z.infer<typeof PipelineDoneEventSchema>

export const PipelineFailedEventSchema = z.object({
  event: z.literal('pipeline:failed'),
  runId: z.string(),
  error: z.string(),
  failedAtStep: z.number(),
})
export type PipelineFailedEvent = z.infer<typeof PipelineFailedEventSchema>

export const PipelineEventSchema = z.discriminatedUnion('event', [
  StepStartedEventSchema,
  StepDoneEventSchema,
  StepFailedEventSchema,
  ThreadStartedEventSchema,
  ThreadDoneEventSchema,
  ThreadFailedEventSchema,
  PipelinePausedEventSchema,
  PipelineDoneEventSchema,
  PipelineFailedEventSchema,
])
export type PipelineEvent = z.infer<typeof PipelineEventSchema>
