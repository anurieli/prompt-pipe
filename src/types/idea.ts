export type IdeaStatus = 'draft' | 'queued' | 'running' | 'paused' | 'done' | 'failed' | 'archived'

export type Idea = {
  id: string
  title: string
  prompt: string
  tags: string[]
  status: IdeaStatus
  pipelineTemplateId: string | null
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}
