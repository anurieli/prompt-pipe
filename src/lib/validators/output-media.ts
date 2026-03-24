import { z } from 'zod'

export const ImageFormatSchema = z.enum(['png', 'jpg', 'webp'])
export type ImageFormat = z.infer<typeof ImageFormatSchema>

export const ImageItemSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
  format: ImageFormatSchema,
})
export type ImageItem = z.infer<typeof ImageItemSchema>

export const OutputMediaTextSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
})
export type OutputMediaText = z.infer<typeof OutputMediaTextSchema>

export const OutputMediaImageSchema = z.object({
  type: z.literal('image'),
  url: z.string(),
  alt: z.string().optional(),
  format: ImageFormatSchema,
})
export type OutputMediaImage = z.infer<typeof OutputMediaImageSchema>

export const OutputMediaImagesSchema = z.object({
  type: z.literal('images'),
  items: z.array(ImageItemSchema),
})
export type OutputMediaImages = z.infer<typeof OutputMediaImagesSchema>

// Recursive OutputMedia type for the 'mixed' variant.
// z.discriminatedUnion requires all members to be statically discriminable,
// which conflicts with z.lazy. We use z.union to support the recursive 'mixed' case.
type OutputMediaType =
  | { type: 'text'; content: string }
  | { type: 'image'; url: string; alt?: string; format: 'png' | 'jpg' | 'webp' }
  | { type: 'images'; items: Array<{ url: string; alt?: string; format: 'png' | 'jpg' | 'webp' }> }
  | { type: 'mixed'; items: OutputMediaType[] }

export const OutputMediaSchema: z.ZodType<OutputMediaType> = z.union([
  OutputMediaTextSchema,
  OutputMediaImageSchema,
  OutputMediaImagesSchema,
  z.object({
    type: z.literal('mixed'),
    items: z.array(z.lazy(() => OutputMediaSchema)),
  }),
])
export type OutputMedia = z.infer<typeof OutputMediaSchema>

export const OutputMediaMixedSchema = z.object({
  type: z.literal('mixed'),
  items: z.array(z.lazy(() => OutputMediaSchema)),
}) as z.ZodType<{ type: 'mixed'; items: OutputMediaType[] }>
export type OutputMediaMixed = z.infer<typeof OutputMediaMixedSchema>
