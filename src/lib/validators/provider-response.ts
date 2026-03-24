import { z } from 'zod'

export const ChatCompletionChoiceSchema = z.object({
  message: z.object({
    content: z.string().nullable(),
  }),
})

export const ChatCompletionUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
})

export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  choices: z.array(ChatCompletionChoiceSchema),
  usage: ChatCompletionUsageSchema,
  model: z.string(),
})
export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>

export const ModelPricingSchema = z.object({
  prompt: z.string(),
  completion: z.string(),
})

export const ModelArchitectureSchema = z.object({
  output_modalities: z.array(z.string()),
})

export const ModelEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  architecture: ModelArchitectureSchema,
  pricing: ModelPricingSchema,
})
export type ModelEntry = z.infer<typeof ModelEntrySchema>

export const ModelListResponseSchema = z.object({
  data: z.array(ModelEntrySchema),
})
export type ModelListResponse = z.infer<typeof ModelListResponseSchema>

export const OpenRouterErrorSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
    metadata: z.unknown().optional(),
  }),
})
export type OpenRouterError = z.infer<typeof OpenRouterErrorSchema>
