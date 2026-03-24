import { createOpenRouterAdapter } from '@/lib/providers/openrouter-adapter'
import { createWebhookAdapter } from '@/lib/providers/webhook-adapter'
import { createScriptAdapter } from '@/lib/providers/script-adapter'
import type { ProviderAdapter } from '@/types/provider'

type AdapterConfig = Record<string, unknown>

const SUPPORTED_PROVIDERS = ['openrouter', 'webhook', 'script'] as const
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

function isSupportedProvider(id: string): id is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(id)
}

export function getAdapter(providerId: string, config: AdapterConfig): ProviderAdapter {
  if (!isSupportedProvider(providerId)) {
    throw new Error(`Unknown provider: "${providerId}". Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`)
  }

  switch (providerId) {
    case 'openrouter': {
      const apiKey = config.apiKey
      if (typeof apiKey !== 'string' || apiKey.length === 0) {
        throw new Error('OpenRouter adapter requires a non-empty "apiKey" in config')
      }
      return createOpenRouterAdapter(apiKey)
    }

    case 'webhook': {
      const url = config.url
      if (typeof url !== 'string' || url.length === 0) {
        throw new Error('Webhook adapter requires a non-empty "url" in config')
      }
      const method = config.method as 'GET' | 'POST' | undefined
      if (method !== undefined && method !== 'GET' && method !== 'POST') {
        throw new Error('Webhook adapter "method" must be "GET" or "POST"')
      }
      return createWebhookAdapter(url, method)
    }

    case 'script': {
      const command = config.command
      if (typeof command !== 'string' || command.length === 0) {
        throw new Error('Script adapter requires a non-empty "command" in config')
      }
      const args = Array.isArray(config.args)
        ? config.args.filter((a): a is string => typeof a === 'string')
        : []
      return createScriptAdapter(command, args)
    }
  }
}
