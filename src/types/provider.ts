import type { OutputMedia } from './output-media'

export type ExecuteParams = {
  prompt: string
  model: string
  outputFormat?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  responseType: 'text' | 'image'
}

export type ExecuteResult = {
  output: OutputMedia
  tokenUsage?: { input: number; output: number }
  costUsd: number
  durationMs: number
  raw: unknown
}

export type ConnectionTestResult = {
  ok: boolean
  error?: string
  responseTimeMs: number
  modelsAvailable?: number
}

export type ModelInfo = {
  id: string
  name: string
  provider: string
  capabilities: ModelCapability[]
  pricing?: {
    promptPerToken: number
    completionPerToken: number
  }
}

export type ModelCapability = 'text' | 'image' | 'multimodal-input'

export type CostEstimate = {
  estimatedCostUsd: number
  inputTokens: number
  confidence: 'exact' | 'approximate' | 'unknown'
}

export type EstimateCostParams = {
  prompt: string
  model: string
  maxTokens?: number
}

export interface ProviderAdapter {
  readonly id: string
  execute(params: ExecuteParams): Promise<ExecuteResult>
  testConnection(): Promise<ConnectionTestResult>
  listModels(): Promise<ModelInfo[]>
  estimateCost(params: EstimateCostParams): CostEstimate
}
