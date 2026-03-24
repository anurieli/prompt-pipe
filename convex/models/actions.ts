'use node'

import { action } from '../_generated/server'
import { internal } from '../_generated/api'
import { decrypt } from '../settings/encryption'
import { createOpenRouterAdapter } from '../lib/providers/openrouterAdapter'

export const listModels = action({
  args: {},
  handler: async (ctx) => {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured')
    }

    const row = await ctx.runQuery(
      internal.settings.internalQueries.getEncryptedSetting,
      { key: 'openrouter_api_key' },
    )

    if (!row) {
      throw new Error('OpenRouter API key not configured')
    }

    const apiKey = decrypt(row.value, encryptionKey)
    const adapter = createOpenRouterAdapter(apiKey)
    return await adapter.listModels()
  },
})
