export type SettingsKey =
  | 'openrouter_api_key'
  | 'default_text_model'
  | 'default_image_model'
  | 'pause_between_steps'
  | 'default_temperature'
  | 'default_max_tokens'
  | 'parallel_thread_limit'

export type SettingsRecord = {
  key: SettingsKey
  value: string // JSON-encoded
  updatedAt: string
}
