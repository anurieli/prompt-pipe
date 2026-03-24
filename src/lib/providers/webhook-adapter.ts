import { logInfo, logError } from '@/lib/logging/logger'
import type { OutputMedia } from '@/types/output-media'
import type {
  ProviderAdapter,
  ExecuteParams,
  ExecuteResult,
  ConnectionTestResult,
  ModelInfo,
  CostEstimate,
  EstimateCostParams,
} from '@/types/provider'

export function createWebhookAdapter(
  url: string,
  method: 'GET' | 'POST' = 'POST',
): ProviderAdapter {
  async function execute(params: ExecuteParams): Promise<ExecuteResult> {
    const startTime = Date.now()

    try {
      const body = JSON.stringify({
        prompt: params.prompt,
        model: params.model,
        outputFormat: params.outputFormat,
      })

      const requestInit: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      }

      if (method === 'POST') {
        requestInit.body = body
      }

      const response = await fetch(url, requestInit)

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}: ${response.statusText}`)
      }

      const responseText = await response.text()
      const durationMs = Date.now() - startTime

      const output: OutputMedia = { type: 'text', content: responseText }

      logInfo('provider', 'provider.execute.done', `Webhook request completed to ${url}`, {
        provider: 'webhook',
        durationMs,
      })

      return {
        output,
        costUsd: 0,
        durationMs,
        raw: { status: response.status, body: responseText },
      }
    } catch (error) {
      const durationMs = Date.now() - startTime

      logError('provider', 'provider.execute.error', `Webhook request failed: ${String(error)}`, {
        provider: 'webhook',
        durationMs,
        data: { url, method },
      })

      throw error
    }
  }

  async function testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now()

    try {
      const response = await fetch(url, { method: 'HEAD' })
      const responseTimeMs = Date.now() - startTime

      if (response.ok) {
        logInfo('provider', 'provider.test_connection.ok', `Webhook connection test passed for ${url}`, {
          provider: 'webhook',
          durationMs: responseTimeMs,
        })

        return { ok: true, responseTimeMs }
      }

      const errorMessage = `Webhook returned status ${response.status}`

      logError('provider', 'provider.test_connection.error', `Webhook connection test failed: ${errorMessage}`, {
        provider: 'webhook',
        durationMs: responseTimeMs,
      })

      return { ok: false, error: errorMessage, responseTimeMs }
    } catch (error) {
      const responseTimeMs = Date.now() - startTime
      const errorMessage = String(error)

      logError('provider', 'provider.test_connection.error', `Webhook connection test failed: ${errorMessage}`, {
        provider: 'webhook',
        durationMs: responseTimeMs,
      })

      return { ok: false, error: errorMessage, responseTimeMs }
    }
  }

  async function listModels(): Promise<ModelInfo[]> {
    return []
  }

  function estimateCost(params: EstimateCostParams): CostEstimate {
    void params
    return { estimatedCostUsd: 0, inputTokens: 0, confidence: 'exact' }
  }

  return {
    id: 'webhook',
    execute,
    testConnection,
    listModels,
    estimateCost,
  }
}
