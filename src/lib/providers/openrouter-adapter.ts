import OpenAI from 'openai'
import { logInfo, logError, logDebug } from '@/lib/logging/logger'
import {
  ChatCompletionResponseSchema,
  ModelEntrySchema,
} from '@/lib/validators/provider-response'
import type { OutputMedia } from '@/types/output-media'
import type {
  ProviderAdapter,
  ExecuteParams,
  ExecuteResult,
  ConnectionTestResult,
  ModelInfo,
  ModelCapability,
  CostEstimate,
  EstimateCostParams,
} from '@/types/provider'

const DEFAULT_PROMPT_COST_PER_TOKEN = 0.000001
const DEFAULT_COMPLETION_COST_PER_TOKEN = 0.000002
const CHARS_PER_TOKEN_ESTIMATE = 4

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

export function createOpenRouterAdapter(apiKey: string): ProviderAdapter {
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://promptpipe.dev',
      'X-OpenRouter-Title': 'PromptPipe',
    },
  })

  // Cache for model pricing lookups
  let pricingCache: Map<string, { promptPerToken: number; completionPerToken: number }> | null = null

  async function loadPricingCache(): Promise<Map<string, { promptPerToken: number; completionPerToken: number }>> {
    if (pricingCache) return pricingCache

    pricingCache = new Map()
    try {
      const models = await listModels()
      for (const model of models) {
        if (model.pricing) {
          pricingCache.set(model.id, model.pricing)
        }
      }
    } catch {
      // If we can't load models, use empty cache — estimateCost will use defaults
    }
    return pricingCache
  }

  async function execute(params: ExecuteParams): Promise<ExecuteResult> {
    const startTime = Date.now()

    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = []

      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt })
      }

      let userContent = params.prompt
      if (params.outputFormat) {
        userContent += `\n\nOutput format: ${params.outputFormat}`
      }
      messages.push({ role: 'user', content: userContent })

      if (params.responseType === 'image') {
        // For image generation, some OpenRouter models support image output
        // via chat completions with specific parameters
        const response = await client.chat.completions.create({
          model: params.model,
          messages,
          temperature: params.temperature,
          max_tokens: params.maxTokens,
        })

        const durationMs = Date.now() - startTime
        const parsed = ChatCompletionResponseSchema.safeParse(response)

        if (!parsed.success) {
          logError('provider', 'provider.execute.parse_error', 'Failed to parse image response from OpenRouter', {
            provider: 'openrouter',
            model: params.model,
            data: parsed.error.issues,
          })
          throw new Error(`Invalid response from OpenRouter: ${parsed.error.message}`)
        }

        const content = parsed.data.choices[0]?.message.content ?? ''

        // Check if the response contains a URL to an image
        const urlMatch = /https?:\/\/\S+\.(png|jpg|jpeg|webp)/i.exec(content)

        let output: OutputMedia
        if (urlMatch) {
          const formatMatch = /\.(png|jpg|jpeg|webp)$/i.exec(urlMatch[0])
          const format = (formatMatch?.[1]?.toLowerCase() ?? 'png') as 'png' | 'jpg' | 'webp'
          output = { type: 'image', url: urlMatch[0], format }
        } else {
          // Fallback to text if no image URL found
          output = { type: 'text', content }
        }

        const tokenUsage = {
          input: parsed.data.usage.prompt_tokens,
          output: parsed.data.usage.completion_tokens,
        }

        const costUsd = estimateCostFromTokens(
          params.model,
          tokenUsage.input,
          tokenUsage.output,
        )

        logInfo('provider', 'provider.execute.done', `OpenRouter image request completed for ${params.model}`, {
          provider: 'openrouter',
          model: params.model,
          durationMs,
        })

        return { output, tokenUsage, costUsd, durationMs, raw: response }
      }

      // Text response type
      const response = await client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      })

      const durationMs = Date.now() - startTime
      const parsed = ChatCompletionResponseSchema.safeParse(response)

      if (!parsed.success) {
        logError('provider', 'provider.execute.parse_error', 'Failed to parse response from OpenRouter', {
          provider: 'openrouter',
          model: params.model,
          data: parsed.error.issues,
        })
        throw new Error(`Invalid response from OpenRouter: ${parsed.error.message}`)
      }

      const content = parsed.data.choices[0]?.message.content ?? ''
      const output: OutputMedia = { type: 'text', content }

      const tokenUsage = {
        input: parsed.data.usage.prompt_tokens,
        output: parsed.data.usage.completion_tokens,
      }

      const costUsd = estimateCostFromTokens(
        params.model,
        tokenUsage.input,
        tokenUsage.output,
      )

      logInfo('provider', 'provider.execute.done', `OpenRouter request completed for ${params.model}`, {
        provider: 'openrouter',
        model: params.model,
        durationMs,
      })

      return { output, tokenUsage, costUsd, durationMs, raw: response }
    } catch (error) {
      const durationMs = Date.now() - startTime

      if (error instanceof OpenAI.APIError) {
        logError('provider', 'provider.execute.api_error', `OpenRouter API error: ${error.message}`, {
          provider: 'openrouter',
          model: params.model,
          durationMs,
          data: { status: error.status, code: error.code },
        })
        throw new Error(`OpenRouter API error (${error.status}): ${error.message}`)
      }

      logError('provider', 'provider.execute.error', `OpenRouter request failed: ${String(error)}`, {
        provider: 'openrouter',
        model: params.model,
        durationMs,
      })
      throw error
    }
  }

  async function testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now()

    try {
      const models: OpenAI.Models.Model[] = []
      for await (const model of client.models.list()) {
        models.push(model)
      }

      const responseTimeMs = Date.now() - startTime

      logInfo('provider', 'provider.test_connection.ok', `OpenRouter connection test passed, ${models.length} models available`, {
        provider: 'openrouter',
        durationMs: responseTimeMs,
      })

      return {
        ok: true,
        responseTimeMs,
        modelsAvailable: models.length,
      }
    } catch (error) {
      const responseTimeMs = Date.now() - startTime
      const errorMessage = error instanceof OpenAI.APIError
        ? `API error (${error.status}): ${error.message}`
        : String(error)

      logError('provider', 'provider.test_connection.error', `OpenRouter connection test failed: ${errorMessage}`, {
        provider: 'openrouter',
        durationMs: responseTimeMs,
      })

      return {
        ok: false,
        error: errorMessage,
        responseTimeMs,
      }
    }
  }

  async function listModels(): Promise<ModelInfo[]> {
    try {
      const rawModels: OpenRouterModelEntry[] = []
      for await (const model of client.models.list()) {
        rawModels.push(model as unknown as OpenRouterModelEntry)
      }

      const models: ModelInfo[] = []

      for (const raw of rawModels) {
        const parsed = ModelEntrySchema.safeParse(raw)

        if (!parsed.success) {
          logDebug('provider', 'provider.list_models.skip', `Skipping model with invalid schema: ${raw.id}`, {
            provider: 'openrouter',
          })
          continue
        }

        const entry = parsed.data
        const capabilities: ModelCapability[] = ['text']

        if (entry.architecture.output_modalities.includes('image')) {
          capabilities.push('image')
        }

        const promptPerToken = parseFloat(entry.pricing.prompt) || DEFAULT_PROMPT_COST_PER_TOKEN
        const completionPerToken = parseFloat(entry.pricing.completion) || DEFAULT_COMPLETION_COST_PER_TOKEN

        models.push({
          id: entry.id,
          name: entry.name,
          provider: 'openrouter',
          capabilities,
          pricing: {
            promptPerToken,
            completionPerToken,
          },
        })
      }

      logInfo('provider', 'provider.list_models.done', `Listed ${models.length} models from OpenRouter`, {
        provider: 'openrouter',
      })

      return models
    } catch (error) {
      const errorMessage = error instanceof OpenAI.APIError
        ? `API error (${error.status}): ${error.message}`
        : String(error)

      logError('provider', 'provider.list_models.error', `Failed to list OpenRouter models: ${errorMessage}`, {
        provider: 'openrouter',
      })
      throw new Error(`Failed to list models: ${errorMessage}`)
    }
  }

  function estimateCostFromTokens(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const cached = pricingCache?.get(model)
    const promptRate = cached?.promptPerToken ?? DEFAULT_PROMPT_COST_PER_TOKEN
    const completionRate = cached?.completionPerToken ?? DEFAULT_COMPLETION_COST_PER_TOKEN
    return inputTokens * promptRate + outputTokens * completionRate
  }

  function estimateCost(params: EstimateCostParams): CostEstimate {
    const inputTokens = Math.ceil(params.prompt.length / CHARS_PER_TOKEN_ESTIMATE)
    const outputTokens = params.maxTokens ?? 1000

    const cached = pricingCache?.get(params.model)
    const promptRate = cached?.promptPerToken ?? DEFAULT_PROMPT_COST_PER_TOKEN
    const completionRate = cached?.completionPerToken ?? DEFAULT_COMPLETION_COST_PER_TOKEN

    const estimatedCostUsd = inputTokens * promptRate + outputTokens * completionRate

    return {
      estimatedCostUsd,
      inputTokens,
      confidence: 'approximate',
    }
  }

  // Kick off pricing cache load (fire and forget)
  void loadPricingCache()

  return {
    id: 'openrouter',
    execute,
    testConnection,
    listModels,
    estimateCost,
  }
}
