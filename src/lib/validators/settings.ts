import { z } from 'zod'

export const SettingsKeySchema = z.enum([
  'openrouter_api_key',
  'default_text_model',
  'default_image_model',
  'default_temperature',
])
export type SettingsKey = z.infer<typeof SettingsKeySchema>

export const UpdateSettingsSchema = z.record(z.string(), z.unknown())
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>

export const ApiKeySchema = z.string().min(1)
export type ApiKey = z.infer<typeof ApiKeySchema>
