export type ProviderDefinition = {
  id: string
  name: string
  color: string
  colorMuted: string
  icon: string
  description: string
  supportsModels: boolean
}

export const PROVIDERS: Record<string, ProviderDefinition> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    color: '#e8854a',
    colorMuted: 'rgba(232, 133, 74, 0.15)',
    icon: 'zap',
    description: 'Access 200+ AI models through a single API',
    supportsModels: true,
  },
  webhook: {
    id: 'webhook',
    name: 'Webhook',
    color: '#a78bcc',
    colorMuted: 'rgba(167, 139, 204, 0.12)',
    icon: 'webhook',
    description: 'Send prompts to any HTTP endpoint',
    supportsModels: false,
  },
  script: {
    id: 'script',
    name: 'Script',
    color: '#5ab8a0',
    colorMuted: 'rgba(90, 184, 160, 0.12)',
    icon: 'terminal',
    description: 'Run local scripts (Node, Python, Shell)',
    supportsModels: false,
  },
} as const

export type NodeTypeDefinition = {
  id: string
  label: string
  letter: string
  color: string
  colorMuted: string
  icon: string
  description: string
  defaultProvider: string
  category: 'core' | 'advanced'
  defaults: {
    systemPrompt?: string
    temperature: number
    maxTokens?: number
    responseType: 'text' | 'image'
  }
}

export const NODE_TYPES: NodeTypeDefinition[] = [
  // Core 4 — intent-based, all backed by OpenRouter
  {
    id: 'research',
    label: 'Research',
    letter: 'R',
    color: 'var(--blue)',
    colorMuted: 'var(--blue-muted)',
    icon: 'search',
    description: 'Deep info gathering, fact-finding, source synthesis.',
    defaultProvider: 'openrouter',
    category: 'core',
    defaults: {
      systemPrompt:
        'You are a thorough research assistant. Gather comprehensive information, cite sources where possible, and organize findings clearly with headings and bullet points.',
      temperature: 0.3,
      maxTokens: 4000,
      responseType: 'text',
    },
  },
  {
    id: 'analyze',
    label: 'Analyze',
    letter: 'A',
    color: 'var(--accent)',
    colorMuted: 'var(--accent-muted)',
    icon: 'bar-chart',
    description: 'Reasoning, comparison, evaluation, structured thinking.',
    defaultProvider: 'openrouter',
    category: 'core',
    defaults: {
      systemPrompt:
        'You are an analytical thinker. Evaluate information critically, identify patterns, compare options, and present structured reasoning with clear conclusions.',
      temperature: 0.4,
      maxTokens: 3000,
      responseType: 'text',
    },
  },
  {
    id: 'generate',
    label: 'Generate',
    letter: 'G',
    color: 'var(--green)',
    colorMuted: 'var(--green-muted)',
    icon: 'pen-tool',
    description: 'Create new content — writing, drafting, ideating.',
    defaultProvider: 'openrouter',
    category: 'core',
    defaults: {
      systemPrompt:
        'You are a skilled content creator. Write engaging, well-structured content that matches the requested tone and format.',
      temperature: 0.7,
      maxTokens: 4000,
      responseType: 'text',
    },
  },
  {
    id: 'transform',
    label: 'Transform',
    letter: 'T',
    color: 'var(--orange)',
    colorMuted: 'var(--orange-muted)',
    icon: 'repeat',
    description: 'Reshape text — summarize, translate, reformat, extract.',
    defaultProvider: 'openrouter',
    category: 'core',
    defaults: {
      systemPrompt:
        'You are a precise text transformer. Faithfully reshape the input as requested — summarize, translate, reformat, or extract — without adding information that was not present.',
      temperature: 0.3,
      maxTokens: 3000,
      responseType: 'text',
    },
  },

  // Advanced — connectors
  {
    id: 'webhook',
    label: 'Webhook',
    letter: 'W',
    color: 'var(--lavender)',
    colorMuted: 'var(--lavender-muted)',
    icon: 'webhook',
    description: 'POST to Slack, Notion, or any HTTP endpoint.',
    defaultProvider: 'webhook',
    category: 'advanced',
    defaults: {
      temperature: 0,
      responseType: 'text',
    },
  },
  {
    id: 'script',
    label: 'Script',
    letter: 'S',
    color: 'var(--teal)',
    colorMuted: 'var(--teal-muted)',
    icon: 'terminal',
    description: 'Run JS, Python, or shell. Full control over transformation.',
    defaultProvider: 'script',
    category: 'advanced',
    defaults: {
      temperature: 0,
      responseType: 'text',
    },
  },
]

export type NodeTypeId = 'research' | 'analyze' | 'generate' | 'transform' | 'webhook' | 'script'

export const CORE_NODE_TYPES = NODE_TYPES.filter((nt) => nt.category === 'core')
export const ADVANCED_NODE_TYPES = NODE_TYPES.filter((nt) => nt.category === 'advanced')

export function getNodeType(id: string): NodeTypeDefinition | undefined {
  return NODE_TYPES.find((nt) => nt.id === id)
}
