import type { OutputMedia } from './output-media'

export type StepStatus = 'idle' | 'running' | 'done' | 'failed' | 'skipped'
export type ThreadStatus = 'idle' | 'running' | 'done' | 'failed'

export type PipelineStep = {
  id: string
  ideaId: string
  stepIndex: number
  name: string
  description: string | null
  status: StepStatus
  createdAt: string
}

export type StepThread = {
  id: string
  stepId: string
  threadIndex: number
  name: string
  provider: string
  nodeType: string
  model: string | null
  promptTemplate: string
  outputFormat: string | null
  systemPrompt: string | null
  config: ThreadConfig
  status: ThreadStatus
  input: string | null
  output: OutputMedia | null
  error: string | null
  tokenUsage: { input: number; output: number } | null
  costUsd: number | null
  startedAt: string | null
  completedAt: string | null
}

export type ThreadConfig = {
  temperature?: number
  maxTokens?: number
  responseType?: 'text' | 'image'
}

export type PipelineTemplate = {
  id: string
  name: string
  description: string | null
  templateData: TemplateData
  createdAt: string
  updatedAt: string
}

export type TemplateData = {
  steps: Array<{
    name: string
    description?: string
    threads: Array<{
      name: string
      provider: string
      nodeType: string
      model?: string
      promptTemplate: string
      outputFormat?: string
      systemPrompt?: string
      config: Record<string, unknown>
    }>
  }>
}
