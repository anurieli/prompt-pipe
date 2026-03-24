'use node'

import { action } from '../_generated/server'
import { internal } from '../_generated/api'
import { v } from 'convex/values'
import { decrypt } from '../settings/encryption'
import OpenAI from 'openai'

const DEFAULT_SUGGESTION_MODEL = 'anthropic/claude-haiku-4.5'
const DEFAULT_STEP_MODEL = 'anthropic/claude-sonnet-4.6'

const SYSTEM_PROMPT = `You are a pipeline architect for PromptPipe, a tool that chains AI steps together to process ideas.

Given a user's raw idea or request, you will design a pipeline of 2-4 steps. Each step is one of these types:
- "research": Deep info gathering, fact-finding, source synthesis
- "analyze": Reasoning, comparison, evaluation, structured thinking
- "generate": Create new content — writing, drafting, ideating
- "transform": Reshape text — summarize, translate, reformat, extract

Rules:
- Use the fewest steps necessary. A 2-step pipeline is often better than 4.
- Each step should have a specific, focused purpose.
- Write specialized prompt templates for each step — not generic ones.
- Use {{seed}} in the first step to reference the user's original input.
- Use {{input}} in subsequent steps to reference the previous step's output.
- Use {{step.N.output}} to reference a specific earlier step's output (0-indexed).
- Choose appropriate models based on the step type. For research steps prefer perplexity models; for everything else use the user's configured default model.
- Set temperature based on the task: 0.2-0.3 for factual/extraction, 0.4-0.5 for analysis, 0.6-0.8 for creative writing.

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "title": "Short descriptive title for this idea",
  "tags": ["tag1", "tag2"],
  "intent": "research" | "content" | "analysis" | "brainstorming" | "productivity" | "other",
  "steps": [
    {
      "name": "Step name",
      "description": "What this step does",
      "nodeType": "research" | "analyze" | "generate" | "transform",
      "model": "provider/model-id",
      "promptTemplate": "The prompt with {{variables}}",
      "systemPrompt": "Optional system prompt",
      "temperature": 0.5,
      "maxTokens": 3000
    }
  ]
}`

export const suggestPipeline = action({
  args: {
    input: v.string(),
  },
  handler: async (ctx, args): Promise<{
    ok: boolean
    suggestion?: {
      title: string
      tags: string[]
      intent: string
      steps: Array<{
        name: string
        description: string
        nodeType: string
        model: string
        promptTemplate: string
        systemPrompt?: string
        temperature: number
        maxTokens: number
      }>
    }
    error?: string
  }> => {
    // Get API key
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      return { ok: false, error: 'ENCRYPTION_KEY not configured' }
    }

    const row = await ctx.runQuery(
      internal.settings.internalQueries.getEncryptedSetting,
      { key: 'openrouter_api_key' },
    )

    if (!row || !row.encrypted) {
      return { ok: false, error: 'OpenRouter API key not configured' }
    }

    const apiKey = decrypt(row.value, encryptionKey)

    // Read default model from settings (falls back to haiku for suggestion, sonnet for steps)
    const savedDefaultModel = await ctx.runQuery(
      internal.settings.internalQueries.getSettingValue,
      { key: 'default_text_model' },
    )
    const defaultStepModel = typeof savedDefaultModel === 'string' ? savedDefaultModel : DEFAULT_STEP_MODEL

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://promptpipe.dev',
        'X-OpenRouter-Title': 'PromptPipe',
      },
    })

    try {
      const response = await client.chat.completions.create({
        model: DEFAULT_SUGGESTION_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: args.input },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      })

      const content = response.choices[0]?.message.content ?? ''

      // Parse JSON from response — handle potential markdown wrapping
      let jsonStr = content.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const parsed = JSON.parse(jsonStr) as {
        title?: string
        tags?: string[]
        intent?: string
        steps?: Array<{
          name?: string
          description?: string
          nodeType?: string
          model?: string
          promptTemplate?: string
          systemPrompt?: string
          temperature?: number
          maxTokens?: number
        }>
      }

      // Validate required fields
      if (!parsed.title || !parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        return { ok: false, error: 'Invalid suggestion format' }
      }

      const validNodeTypes = new Set(['research', 'analyze', 'generate', 'transform'])

      const steps = parsed.steps.map((s) => ({
        name: s.name ?? 'Step',
        description: s.description ?? '',
        nodeType: validNodeTypes.has(s.nodeType ?? '') ? s.nodeType! : 'generate',
        model: s.model ?? defaultStepModel,
        promptTemplate: s.promptTemplate ?? '{{input}}',
        systemPrompt: s.systemPrompt,
        temperature: typeof s.temperature === 'number' ? s.temperature : 0.5,
        maxTokens: typeof s.maxTokens === 'number' ? s.maxTokens : 3000,
      }))

      return {
        ok: true,
        suggestion: {
          title: parsed.title,
          tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === 'string') : [],
          intent: typeof parsed.intent === 'string' ? parsed.intent : 'other',
          steps,
        },
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return { ok: false, error: `AI suggestion failed: ${msg}` }
    }
  },
})
