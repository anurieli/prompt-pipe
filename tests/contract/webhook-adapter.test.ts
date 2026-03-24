import { vi } from 'vitest'

// Mock the logger to prevent real DB calls
vi.mock('@/lib/logging/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

import { createWebhookAdapter } from '@/lib/providers/webhook-adapter'
import type { ExecuteParams, EstimateCostParams } from '@/types/provider'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('Webhook adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('execute()', () => {
    it('makes POST request and returns text output', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Webhook response text'),
      })

      const adapter = createWebhookAdapter('https://example.com/hook', 'POST')

      const params: ExecuteParams = {
        prompt: 'Test prompt',
        model: 'default',
        responseType: 'text',
      }

      const result = await adapter.execute(params)

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/hook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      )

      // Verify body contents
      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body as string)
      expect(body.prompt).toBe('Test prompt')
      expect(body.model).toBe('default')

      // Verify result shape
      expect(result.output).toEqual({ type: 'text', content: 'Webhook response text' })
      expect(result.costUsd).toBe(0)
      expect(typeof result.durationMs).toBe('number')
      expect(result.raw).toBeDefined()
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const adapter = createWebhookAdapter('https://example.com/hook')

      const params: ExecuteParams = {
        prompt: 'Test',
        model: 'default',
        responseType: 'text',
      }

      await expect(adapter.execute(params)).rejects.toThrow('Webhook returned status 500')
    })
  })

  describe('testConnection()', () => {
    it('makes HEAD request and returns ok result', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      })

      const adapter = createWebhookAdapter('https://example.com/hook')
      const result = await adapter.testConnection()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/hook',
        { method: 'HEAD' }
      )
      expect(result.ok).toBe(true)
      expect(typeof result.responseTimeMs).toBe('number')
    })

    it('returns error on failed connection', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      })

      const adapter = createWebhookAdapter('https://example.com/hook')
      const result = await adapter.testConnection()

      expect(result.ok).toBe(false)
      expect(result.error).toContain('503')
    })
  })

  describe('listModels()', () => {
    it('returns empty array', async () => {
      const adapter = createWebhookAdapter('https://example.com/hook')
      const models = await adapter.listModels()

      expect(models).toEqual([])
    })
  })

  describe('estimateCost()', () => {
    it('returns zero cost', () => {
      const adapter = createWebhookAdapter('https://example.com/hook')

      const params: EstimateCostParams = {
        prompt: 'Test',
        model: 'default',
      }

      const estimate = adapter.estimateCost(params)

      expect(estimate.estimatedCostUsd).toBe(0)
      expect(estimate.inputTokens).toBe(0)
      expect(estimate.confidence).toBe('exact')
    })
  })
})
