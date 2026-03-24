/**
 * Curated model catalog — provider-grouped with role badges.
 *
 * This replaces the old tier system. Models are organized by provider
 * with a role tag (fast, flagship, reasoning, code) rather than abstract tiers.
 */

export type ModelRole = 'fast' | 'flagship' | 'reasoning' | 'code'

export type CuratedModel = {
  id: string
  name: string
  role: ModelRole
}

export type ProviderGroup = {
  id: string
  name: string
  models: CuratedModel[]
}

export const MODEL_CATALOG: ProviderGroup[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'anthropic/claude-haiku-4.5', name: 'Haiku 4.5', role: 'fast' },
      { id: 'anthropic/claude-sonnet-4.6', name: 'Sonnet 4.6', role: 'flagship' },
      { id: 'anthropic/claude-opus-4.6', name: 'Opus 4.6', role: 'reasoning' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'openai/gpt-5.4-mini', name: 'GPT-5.4 Mini', role: 'fast' },
      { id: 'openai/gpt-5.4', name: 'GPT-5.4', role: 'flagship' },
      { id: 'openai/o4-mini', name: 'o4 Mini', role: 'reasoning' },
      { id: 'openai/gpt-5.4-pro', name: 'GPT-5.4 Pro', role: 'code' },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    models: [
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', role: 'fast' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', role: 'flagship' },
    ],
  },
  {
    id: 'xai',
    name: 'xAI',
    models: [
      { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', role: 'fast' },
      { id: 'x-ai/grok-4', name: 'Grok 4', role: 'flagship' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    models: [
      { id: 'perplexity/sonar-pro', name: 'Sonar Pro', role: 'fast' },
      { id: 'perplexity/sonar-reasoning-pro', name: 'Sonar Reasoning Pro', role: 'reasoning' },
    ],
  },
]

/** Returns the first flagship model ID (Sonnet 4.6) */
export function getDefaultModel(): string {
  for (const group of MODEL_CATALOG) {
    for (const model of group.models) {
      if (model.role === 'flagship') return model.id
    }
  }
  return 'anthropic/claude-sonnet-4.6'
}

/** Flat list of all curated models */
export function getAllCuratedModels(): CuratedModel[] {
  return MODEL_CATALOG.flatMap((g) => g.models)
}

/** Find a curated model by ID */
export function findModel(id: string): CuratedModel | undefined {
  return getAllCuratedModels().find((m) => m.id === id)
}
