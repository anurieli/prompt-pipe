import { z } from 'zod'

export const IdeaStatusSchema = z.enum([
  'draft',
  'queued',
  'running',
  'paused',
  'done',
  'failed',
  'archived',
])
export type IdeaStatus = z.infer<typeof IdeaStatusSchema>

export const CreateIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  prompt: z.string().min(1),
  tags: z.array(z.string()).optional(),
})
export type CreateIdea = z.infer<typeof CreateIdeaSchema>

export const UpdateIdeaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  prompt: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  status: IdeaStatusSchema.optional(),
})
export type UpdateIdea = z.infer<typeof UpdateIdeaSchema>
