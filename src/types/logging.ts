export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogDomain =
  | 'pipeline'
  | 'step'
  | 'thread'
  | 'provider'
  | 'idea'
  | 'template'
  | 'settings'
  | 'export'
  | 'variable'
  | 'system'

export type LogEntry = {
  id: string
  timestamp: string // ISO 8601 with ms
  level: LogLevel
  domain: LogDomain
  event: string // machine-readable e.g. 'thread.execute.done'
  message: string
  ideaId?: string
  stepId?: string
  stepIndex?: number
  threadId?: string
  threadIndex?: number
  model?: string
  provider?: string
  data?: unknown
  durationMs?: number
}
