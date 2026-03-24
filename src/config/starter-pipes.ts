/**
 * Starter Pipes — pre-built pipeline templates that ship with PromptPipe.
 * Each pipe defines steps with thread configurations that map directly
 * to the steps.mutations.create args shape.
 */

export type StarterPipeStep = {
  name: string
  description?: string
  threads: Array<{
    name: string
    provider: string
    nodeType: string
    model?: string
    promptTemplate: string
    systemPrompt?: string
    outputFormat?: string
    config: {
      temperature?: number
      maxTokens?: number
      responseType?: 'text' | 'image'
    }
  }>
}

export type StarterPipe = {
  id: string
  name: string
  description: string
  icon: string
  seedPlaceholder: string
  tags: string[]
  steps: StarterPipeStep[]
}

export const STARTER_PIPES: StarterPipe[] = [
  {
    id: 'deep-research',
    name: 'Deep Research',
    description: 'Research any topic in depth, then synthesize into a structured brief.',
    icon: 'search',
    seedPlaceholder: 'Enter a topic to research...',
    tags: ['research'],
    steps: [
      {
        name: 'Research',
        description: 'Deep web-grounded research via Perplexity',
        threads: [
          {
            name: 'Research Thread',
            provider: 'openrouter',
            nodeType: 'research',
            promptTemplate:
              'Research the following topic thoroughly. Find recent data, key arguments, notable sources, and expert perspectives. Organize findings with clear headings.\n\nTopic: {{seed}}',
            systemPrompt:
              'You are a thorough research assistant. Gather comprehensive information, cite sources where possible, and organize findings clearly.',
            config: { temperature: 0.3, maxTokens: 4000 },
          },
        ],
      },
      {
        name: 'Synthesize',
        description: 'Turn raw research into a structured brief',
        threads: [
          {
            name: 'Synthesis Thread',
            provider: 'openrouter',
            nodeType: 'analyze',
            promptTemplate:
              'Take the following raw research and produce a clear, structured briefing with:\n1. Executive summary (2-3 sentences)\n2. Key findings\n3. Supporting evidence\n4. Open questions and gaps\n\nResearch:\n{{input}}',
            systemPrompt:
              'You are a research synthesizer. Distill complex information into clear, actionable briefings.',
            config: { temperature: 0.4, maxTokens: 3000 },
          },
        ],
      },
    ],
  },

  {
    id: 'content-multiplier',
    name: 'Content Multiplier',
    description: 'Turn one idea into a blog post, LinkedIn post, and Twitter thread.',
    icon: 'copy',
    seedPlaceholder: 'Describe your idea or topic...',
    tags: ['content', 'social'],
    steps: [
      {
        name: 'Develop',
        description: 'Flesh out the raw idea into a narrative',
        threads: [
          {
            name: 'Develop Thread',
            provider: 'openrouter',
            nodeType: 'generate',
            promptTemplate:
              'Take this raw idea and develop it into a clear, compelling narrative with a strong angle, key points, and supporting arguments. Keep it flexible enough to adapt to multiple formats.\n\nIdea: {{seed}}',
            config: { temperature: 0.7, maxTokens: 3000 },
          },
        ],
      },
      {
        name: 'Blog Post',
        description: '800-1200 word blog post',
        threads: [
          {
            name: 'Blog Thread',
            provider: 'openrouter',
            nodeType: 'generate',
            promptTemplate:
              'Write an 800-1200 word blog post based on the following developed idea. Use a conversational but authoritative tone. Include a compelling hook, clear subheadings, and a strong conclusion.\n\nSource material:\n{{input}}',
            config: { temperature: 0.7, maxTokens: 4000 },
          },
        ],
      },
      {
        name: 'LinkedIn Post',
        description: 'Professional social post (150-250 words)',
        threads: [
          {
            name: 'LinkedIn Thread',
            provider: 'openrouter',
            nodeType: 'transform',
            promptTemplate:
              'Write a LinkedIn post (150-250 words) based on this content. Start with a hook line. Use short paragraphs. End with a question or call to action. Professional but human tone.\n\nSource:\n{{step.1.output}}',
            config: { temperature: 0.7, maxTokens: 1000 },
          },
        ],
      },
      {
        name: 'Twitter Thread',
        description: '5-8 tweet thread',
        threads: [
          {
            name: 'Twitter Thread',
            provider: 'openrouter',
            nodeType: 'transform',
            promptTemplate:
              'Write a Twitter/X thread (5-8 tweets) based on this content. First tweet must hook. Use clear, punchy language. Number each tweet. End with a summary tweet.\n\nSource:\n{{step.1.output}}',
            config: { temperature: 0.7, maxTokens: 1500 },
          },
        ],
      },
    ],
  },

  {
    id: 'idea-developer',
    name: 'Idea Developer',
    description: 'Explore and structure any half-baked thought into something actionable.',
    icon: 'lightbulb',
    seedPlaceholder: 'What\'s your rough idea?',
    tags: ['brainstorm'],
    steps: [
      {
        name: 'Explore',
        description: 'Unpack the idea, find angles and audiences',
        threads: [
          {
            name: 'Explore Thread',
            provider: 'openrouter',
            nodeType: 'analyze',
            promptTemplate:
              'I have a rough idea I want to develop. Help me explore it: identify the core insight, potential angles, who would care about this, and what questions I should be asking.\n\nMy idea: {{seed}}',
            config: { temperature: 0.6, maxTokens: 2500 },
          },
        ],
      },
      {
        name: 'Structure',
        description: 'Thesis, arguments, gaps, next steps',
        threads: [
          {
            name: 'Structure Thread',
            provider: 'openrouter',
            nodeType: 'analyze',
            promptTemplate:
              'Take this explored idea and give it structure. Create:\n1. A one-sentence thesis\n2. Three key arguments or angles\n3. Potential objections or gaps\n4. Suggested next steps\n\nExplored idea:\n{{input}}',
            config: { temperature: 0.5, maxTokens: 2000 },
          },
        ],
      },
    ],
  },

  {
    id: 'competitive-analysis',
    name: 'Competitive Analysis',
    description: 'Research competitors and get a strategic analysis.',
    icon: 'trophy',
    seedPlaceholder: 'What product or market to analyze?',
    tags: ['research', 'strategy'],
    steps: [
      {
        name: 'Research Competitors',
        description: 'Competitive intelligence via deep research',
        threads: [
          {
            name: 'Research Thread',
            provider: 'openrouter',
            nodeType: 'research',
            promptTemplate:
              'Research the competitive landscape for: {{seed}}. Find key players, their positioning, recent moves, pricing strategies, and market share data where available.',
            systemPrompt:
              'You are a market research analyst. Gather comprehensive competitive intelligence with specific data points and sources.',
            config: { temperature: 0.3, maxTokens: 4000 },
          },
        ],
      },
      {
        name: 'Strategic Analysis',
        description: 'Structured competitive analysis with recommendations',
        threads: [
          {
            name: 'Analysis Thread',
            provider: 'openrouter',
            nodeType: 'analyze',
            promptTemplate:
              'Based on the following competitive research, produce a structured competitive analysis:\n\n1. Market overview\n2. Key players (strengths/weaknesses)\n3. Gaps and opportunities\n4. Strategic recommendations\n\nResearch:\n{{input}}',
            systemPrompt: 'You are a strategy analyst. Be specific, actionable, and evidence-based.',
            config: { temperature: 0.4, maxTokens: 3000 },
          },
        ],
      },
    ],
  },

  {
    id: 'meeting-to-actions',
    name: 'Meeting Notes \u2192 Actions',
    description: 'Extract decisions and action items from meeting notes or transcripts.',
    icon: 'clipboard',
    seedPlaceholder: 'Paste your meeting notes or transcript...',
    tags: ['productivity'],
    steps: [
      {
        name: 'Extract',
        description: 'Pull out decisions, actions, and open questions',
        threads: [
          {
            name: 'Extract Thread',
            provider: 'openrouter',
            nodeType: 'transform',
            promptTemplate:
              'Extract the following from this meeting transcript:\n1. Key decisions made\n2. Action items (with owners if mentioned)\n3. Open questions\n4. Important context or background shared\n\nTranscript:\n{{seed}}',
            config: { temperature: 0.2, maxTokens: 2500 },
          },
        ],
      },
      {
        name: 'Format Summary',
        description: 'Polished, shareable meeting summary',
        threads: [
          {
            name: 'Format Thread',
            provider: 'openrouter',
            nodeType: 'generate',
            promptTemplate:
              'Format the following meeting extraction into a clean, shareable meeting summary. Use clear headers, bullet points, and highlight action items with deadlines where mentioned. Make it suitable for sending to the team.\n\nExtraction:\n{{input}}',
            config: { temperature: 0.3, maxTokens: 2000 },
          },
        ],
      },
    ],
  },

  {
    id: 'code-explainer',
    name: 'Code Explainer',
    description: 'Analyze code and generate documentation from it.',
    icon: 'code',
    seedPlaceholder: 'Paste your code here...',
    tags: ['dev'],
    steps: [
      {
        name: 'Analyze Code',
        description: 'Deep code analysis and review',
        threads: [
          {
            name: 'Analysis Thread',
            provider: 'openrouter',
            nodeType: 'analyze',
            promptTemplate:
              'Analyze this code. Explain:\n1. What it does (high level)\n2. How it works (step by step)\n3. Key design decisions\n4. Potential issues or improvements\n\nCode:\n{{seed}}',
            systemPrompt: 'You are an expert code reviewer. Be thorough but concise.',
            config: { temperature: 0.3, maxTokens: 3000 },
          },
        ],
      },
      {
        name: 'Generate Docs',
        description: 'Turn analysis into documentation',
        threads: [
          {
            name: 'Docs Thread',
            provider: 'openrouter',
            nodeType: 'generate',
            promptTemplate:
              'Based on this code analysis, generate clean documentation:\n- A README section explaining the module\n- Inline comments for the main functions\n- Usage examples\n\nAnalysis:\n{{input}}',
            config: { temperature: 0.5, maxTokens: 3000 },
          },
        ],
      },
    ],
  },

  {
    id: 'debate',
    name: 'Debate / Steel Man',
    description: 'Pressure-test any idea with the strongest arguments for and against.',
    icon: 'scale',
    seedPlaceholder: 'What idea or decision to debate?',
    tags: ['thinking'],
    steps: [
      {
        name: 'Steel Man',
        description: 'Best case for and against',
        threads: [
          {
            name: 'Steel Man Thread',
            provider: 'openrouter',
            nodeType: 'analyze',
            promptTemplate:
              'I want to pressure-test this idea. Present the strongest possible case FOR it, then the strongest possible case AGAINST it. Be genuinely persuasive on both sides.\n\nIdea: {{seed}}',
            systemPrompt:
              'You are a rigorous debater. Argue each side with genuine conviction and evidence. Do not hedge or be balanced within each section — commit fully to the position.',
            config: { temperature: 0.6, maxTokens: 3000 },
          },
        ],
      },
      {
        name: 'Verdict',
        description: 'Synthesize a nuanced recommendation',
        threads: [
          {
            name: 'Verdict Thread',
            provider: 'openrouter',
            nodeType: 'analyze',
            promptTemplate:
              'Based on this analysis of arguments for and against, provide:\n1. Which side has the stronger case and why\n2. What additional information would change the conclusion\n3. A nuanced recommendation\n\nAnalysis:\n{{input}}',
            config: { temperature: 0.5, maxTokens: 2000 },
          },
        ],
      },
    ],
  },
]

export function getStarterPipe(id: string): StarterPipe | undefined {
  return STARTER_PIPES.find((p) => p.id === id)
}
