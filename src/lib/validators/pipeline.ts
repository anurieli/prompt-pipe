import { z } from 'zod'

export const StepStatusSchema = z.enum([
  'idle',
  'running',
  'done',
  'failed',
  'skipped',
])
export type StepStatus = z.infer<typeof StepStatusSchema>

export const ThreadStatusSchema = z.enum([
  'idle',
  'running',
  'done',
  'failed',
])
export type ThreadStatus = z.infer<typeof ThreadStatusSchema>

export const InputSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('seed') }),
  z.object({ type: z.literal('step'), stepIndex: z.number().int().min(0) }),
  z.object({ type: z.literal('thread'), stepIndex: z.number().int().min(0), threadIndex: z.number().int().min(0) }),
])
export type InputSource = z.infer<typeof InputSourceSchema>

export const ThreadConfigSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  responseType: z.enum(['text', 'image']).optional(),
})
export type ThreadConfig = z.infer<typeof ThreadConfigSchema>

export const CreateThreadSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  nodeType: z.string().min(1),
  model: z.string().optional(),
  promptTemplate: z.string().default('{{input}}'),
  outputFormat: z.string().optional(),
  systemPrompt: z.string().optional(),
  config: ThreadConfigSchema.optional(),
  inputSources: z.array(InputSourceSchema).optional(),
})
export type CreateThread = z.infer<typeof CreateThreadSchema>

export const UpdateThreadSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  nodeType: z.string().min(1).optional(),
  model: z.string().optional(),
  promptTemplate: z.string().optional(),
  outputFormat: z.string().optional(),
  systemPrompt: z.string().optional(),
  config: ThreadConfigSchema.optional(),
  inputSources: z.array(InputSourceSchema).optional(),
})
export type UpdateThread = z.infer<typeof UpdateThreadSchema>

export const CreateStepSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  threads: z.array(CreateThreadSchema),
})
export type CreateStep = z.infer<typeof CreateStepSchema>
