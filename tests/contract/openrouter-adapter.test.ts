import { vi } from 'vitest'

// Mock the logger to prevent real DB calls
vi.mock('@/lib/logging/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logDebug: vi.fn(),
}))

// Mock the OpenAI SDK
vi.mock('openai', () => {
  const mockCreate = vi.fn()
  const mockListModels = vi.fn()

  class MockOpenAI {
    chat = {
      completions: {
        create: mockCreate,
      },
    }
    models = {
      list: mockListModels,
    }

    static APIError = class APIError extends Error {
      status: number
      code: string | null
      constructor(status: number, message: string) {
        super(message)
        this.status = status
        this.code = null
        this.name = 'APIError'
      }
    }
  }

  return { default: MockOpenAI }
})

import OpenAI from 'openai'
import { createOpenRouterAdapter } from '@/lib/providers/openrouter-adapter'
import type { ExecuteParams, EstimateCostParams } from '@/types/provider'

// Helper to access the mock functions via the adapter's internal OpenAI instance
function getMockClient() {
  // We need to get the mock functions from the module-level mock
  const MockOpenAI = OpenAI as unknown as new (...args: unknown[]) => {
    chat: { completions: { create: ReturnType<typeof vi.fn> } }
    models: { list: ReturnType<typeof vi.fn> }
  }
  const instance = new MockOpenAI()
  return {
    mockCreate: instance.chat.completions.create,
    mockListModels: instance.models.list,
  }
}

describe('OpenRouter adapter', () => {
  let mockCreate: ReturnType<typeof vi.fn>
  let mockListModels: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    const client = getMockClient()
    mockCreate = client.mockCreate
    mockListModels = client.mockListModels
  })

  describe('execute()', () => {
    it('returns valid ExecuteResult with OutputMedia text', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        choices: [{ message: { content: 'Generated text response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
        model: 'gpt-4',
      })

      // We need to prevent listModels from being called during adapter creation
      // The adapter does `void loadPricingCache()` on creation which calls listModels
      mockListModels.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // yield nothing
        },
      })

      const adapter = createOpenRouterAdapter('test-api-key')

      const params: ExecuteParams = {
        prompt: 'Hello world',
        model: 'gpt-4',
        responseType: 'text',
      }

      const result = await adapter.execute(params)

      expect(result.output).toEqual({ type: 'text', content: 'Generated text response' })
      expect(result.tokenUsage).toEqual({ input: 10, output: 20 })
      expect(typeof result.costUsd).toBe('number')
      expect(typeof result.durationMs).toBe('number')
      expect(result.raw).toBeDefined()
    })

    it('handles API errors gracefully', async () => {
      mockListModels.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // yield nothing
        },
      })

      const APIError = (OpenAI as unknown as { APIError: new (status: number, message: string) => Error }).APIError
      mockCreate.mockRejectedValue(new APIError(429, 'Rate limit exceeded'))

      const adapter = createOpenRouterAdapter('test-api-key')

      const params: ExecuteParams = {
        prompt: 'Hello',
        model: 'gpt-4',
        responseType: 'text',
      }

      await expect(adapter.execute(params)).rejects.toThrow()
    })
  })

  describe('testConnection()', () => {
    it('returns ConnectionTestResult with ok: true', async () => {
      mockListModels.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { id: 'model-1', name: 'Model 1' }
          yield { id: 'model-2', name: 'Model 2' }
        },
      })

      const adapter = createOpenRouterAdapter('test-api-key')

      // Wait a tick for the fire-and-forget loadPricingCache to settle
      await new Promise((r) => setTimeout(r, 10))

      const result = await adapter.testConnection()

      expect(result.ok).toBe(true)
      expect(typeof result.responseTimeMs).toBe('number')
      expect(result.modelsAvailable).toBe(2)
    })
  })

  describe('listModels()', () => {
    it('returns ModelInfo array', async () => {
      mockListModels.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            id: 'openai/gpt-4',
            name: 'GPT-4',
            architecture: { output_modalities: ['text'] },
            pricing: { prompt: '0.00003', completion: '0.00006' },
          }
          yield {
            id: 'anthropic/claude-3',
            name: 'Claude 3',
            architecture: { output_modalities: ['text', 'image'] },
            pricing: { prompt: '0.000015', completion: '0.000075' },
          }
        },
      })

      const adapter = createOpenRouterAdapter('test-api-key')

      const models = await adapter.listModels()

      expect(models).toHaveLength(2)
      expect(models[0].id).toBe('openai/gpt-4')
      expect(models[0].name).toBe('GPT-4')
      expect(models[0].provider).toBe('openrouter')
      expect(models[0].capabilities).toContain('text')
      expect(models[0].pricing).toBeDefined()

      expect(models[1].capabilities).toContain('image')
    })
  })

  describe('estimateCost()', () => {
    it('returns CostEstimate', async () => {
      mockListModels.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // yield nothing
        },
      })

      const adapter = createOpenRouterAdapter('test-api-key')

      const params: EstimateCostParams = {
        prompt: 'Hello world, this is a test prompt',
        model: 'gpt-4',
        maxTokens: 500,
      }

      const estimate = adapter.estimateCost(params)

      expect(typeof estimate.estimatedCostUsd).toBe('number')
      expect(estimate.estimatedCostUsd).toBeGreaterThan(0)
      expect(typeof estimate.inputTokens).toBe('number')
      expect(estimate.inputTokens).toBeGreaterThan(0)
      expect(estimate.confidence).toBe('approximate')
    })
  })
})
