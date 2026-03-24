export type SettingsKey =
  | 'openrouter_api_key'
  | 'default_text_model'
  | 'default_image_model'
  | 'default_temperature'

export type SettingsRecord = {
  key: SettingsKey
  value: string // JSON-encoded
  updatedAt: string
}
