import OpenAI from 'openai'
import type { OutputMedia } from '../../../src/types/output-media'

type ExecuteParams = {
  prompt: string
  model: string
  outputFormat?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  responseType: 'text' | 'image'
}

type ExecuteResult = {
  output: OutputMedia
  tokenUsage?: { input: number; output: number }
  costUsd: number
  durationMs: number
}

type ConnectionTestResult = {
  ok: boolean
  error?: string
  responseTimeMs: number
  modelsAvailable?: number
}

type ModelInfo = {
  id: string
  name: string
  provider: string
  capabilities: Array<'text' | 'image' | 'multimodal-input'>
  pricing?: {
    promptPerToken: number
    completionPerToken: number
  }
}

const DEFAULT_PROMPT_COST_PER_TOKEN = 0.000001
const DEFAULT_COMPLETION_COST_PER_TOKEN = 0.000002

type OpenRouterModelEntry = {
  id: string
  name?: string
  architecture?: {
    output_modalities?: string[]
  }
  pricing?: {
    prompt?: string
    completion?: string
  }
}

export function createOpenRouterAdapter(apiKey: string) {
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://promptpipe.dev',
      'X-OpenRouter-Title': 'PromptPipe',
    },
  })

  async function execute(params: ExecuteParams): Promise<ExecuteResult> {
    const startTime = Date.now()

    const messages: Array<{ role: 'system' | 'user'; content: string }> = []
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }
    let userContent = params.prompt
    if (params.outputFormat) {
      userContent += `\n\nOutput format: ${params.outputFormat}`
    }
    messages.push({ role: 'user', content: userContent })

    const response = await client.chat.completions.create({
      model: params.model,
      messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    })

    const durationMs = Date.now() - startTime
    const content = response.choices[0]?.message.content ?? ''

    let output: OutputMedia
    if (params.responseType === 'image') {
      const urlMatch = /https?:\/\/\S+\.(png|jpg|jpeg|webp)/i.exec(content)
      if (urlMatch) {
        const formatMatch = /\.(png|jpg|jpeg|webp)$/i.exec(urlMatch[0])
        const format = (formatMatch?.[1]?.toLowerCase() ?? 'png') as 'png' | 'jpg' | 'webp'
        output = { type: 'image', url: urlMatch[0], format }
      } else {
        output = { type: 'text', content }
      }
    } else {
      output = { type: 'text', content }
    }

    const tokenUsage = response.usage
      ? { input: response.usage.prompt_tokens, output: response.usage.completion_tokens }
      : undefined

    const costUsd = tokenUsage
      ? tokenUsage.input * DEFAULT_PROMPT_COST_PER_TOKEN + tokenUsage.output * DEFAULT_COMPLETION_COST_PER_TOKEN
      : 0

    return { output, tokenUsage, costUsd, durationMs }
  }

  async function testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now()
    try {
      const models: OpenAI.Models.Model[] = []
      for await (const model of client.models.list()) {
        models.push(model)
      }
      return { ok: true, responseTimeMs: Date.now() - startTime, modelsAvailable: models.length }
    } catch (error) {
      const errorMessage = error instanceof OpenAI.APIError
        ? `API error (${error.status}): ${error.message}`
        : String(error)
      return { ok: false, error: errorMessage, responseTimeMs: Date.now() - startTime }
    }
  }

  async function listModels(): Promise<ModelInfo[]> {
    const rawModels: OpenRouterModelEntry[] = []
    for await (const model of client.models.list()) {
      rawModels.push(model as unknown as OpenRouterModelEntry)
    }

    const models: ModelInfo[] = []
    for (const raw of rawModels) {
      if (!raw.id || !raw.name) continue

      const capabilities: Array<'text' | 'image' | 'multimodal-input'> = ['text']
      if (raw.architecture?.output_modalities?.includes('image')) {
        capabilities.push('image')
      }

      const promptPerToken = parseFloat(raw.pricing?.prompt ?? '') || DEFAULT_PROMPT_COST_PER_TOKEN
      const completionPerToken = parseFloat(raw.pricing?.completion ?? '') || DEFAULT_COMPLETION_COST_PER_TOKEN

      models.push({
        id: raw.id,
        name: raw.name,
        provider: 'openrouter',
        capabilities,
        pricing: { promptPerToken, completionPerToken },
      })
    }

    return models
  }

  return { execute, testConnection, listModels }
}
