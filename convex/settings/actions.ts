'use node'

import { action } from '../_generated/server'
import { api, internal } from '../_generated/api'
import { v } from 'convex/values'
import { encrypt, decrypt } from './encryption'
import { maskApiKey } from './mask'
import OpenAI from 'openai'

export const saveApiKey = action({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable not configured')
    }

    const encrypted = encrypt(args.value, encryptionKey)

    await ctx.runMutation(api.settings.mutations.upsertSetting, {
      key: args.key,
      value: encrypted,
      encrypted: true,
    })

    return { success: true, maskedKey: maskApiKey(args.value) }
  },
})

export const checkCredits = action({
  args: {},
  handler: async (ctx) => {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      return { ok: false as const, error: 'ENCRYPTION_KEY not configured' }
    }

    const row = await ctx.runQuery(
      internal.settings.internalQueries.getEncryptedSetting,
      { key: 'openrouter_api_key' },
    )

    if (!row) {
      return { ok: false as const, error: 'no_key' }
    }

    const apiKey = decrypt(row.value, encryptionKey)

    try {
      // Try /api/v1/credits first — returns actual account balance
      const creditsRes = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      if (creditsRes.ok) {
        const creditsJson = await creditsRes.json() as {
          data: { total_credits: number; total_usage: number }
        }
        const { total_credits, total_usage } = creditsJson.data
        const remaining = total_credits - total_usage
        return {
          ok: true as const,
          usage: total_usage,
          limit: total_credits,
          isFreeTier: false,
          remaining,
          balanceSource: 'credits' as const,
        }
      }

      // Fall back to /api/v1/auth/key (per-key limit, not account balance)
      const keyRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      if (!keyRes.ok) {
        return { ok: false as const, error: `OpenRouter returned ${keyRes.status}` }
      }

      const keyJson = await keyRes.json() as {
        data: { usage: number; limit: number | null; is_free_tier: boolean }
      }
      const { usage, limit, is_free_tier } = keyJson.data

      if (limit != null) {
        return {
          ok: true as const,
          usage,
          limit,
          isFreeTier: is_free_tier,
          remaining: limit - usage,
          balanceSource: 'key_limit' as const,
        }
      }

      // limit is null — we can see usage but not account balance
      return {
        ok: true as const,
        usage,
        limit: null,
        isFreeTier: is_free_tier,
        remaining: null,
        balanceSource: 'usage_only' as const,
      }
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : String(error) }
    }
  },
})

export const testConnection = action({
  args: {
    temporaryKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let apiKey = args.temporaryKey

    if (!apiKey) {
      // Decrypt stored key
      const encryptionKey = process.env.ENCRYPTION_KEY
      if (!encryptionKey) {
        return { ok: false, error: 'ENCRYPTION_KEY not configured' }
      }

      const row = await ctx.runQuery(internal.settings.internalQueries.getEncryptedSetting, {
        key: 'openrouter_api_key',
      })

      if (!row) {
        return { ok: false, error: 'No API key saved' }
      }

      apiKey = decrypt(row.value, encryptionKey)
    }

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://promptpipe.dev',
        'X-OpenRouter-Title': 'PromptPipe',
      },
    })

    try {
      const models: OpenAI.Models.Model[] = []
      for await (const model of client.models.list()) {
        models.push(model)
      }

      return { ok: true, modelsAvailable: models.length }
    } catch (error) {
      const errorMessage =
        error instanceof OpenAI.APIError
          ? `API error (${error.status}): ${error.message}`
          : String(error)
      return { ok: false, error: errorMessage }
    }
  },
})
