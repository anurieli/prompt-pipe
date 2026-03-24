import type { LogLevel, LogDomain } from '@/types/logging'

type LogParams = {
  level: LogLevel
  domain: LogDomain
  event: string
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

/**
 * Client-side logger stub.
 * In the Convex architecture, structured logging is done via Convex mutations
 * (convex/logs/mutations.ts). This module exists only for code that hasn't
 * been fully migrated to Convex yet.
 */
export function log(_params: LogParams): void {
  // No-op in Convex architecture — logging is done server-side
}

export function logInfo(_domain: LogDomain, _event: string, _message: string, _extra?: Partial<LogParams>): void {
  // No-op
}

export function logError(_domain: LogDomain, _event: string, _message: string, _extra?: Partial<LogParams>): void {
  // No-op
}

export function logWarn(_domain: LogDomain, _event: string, _message: string, _extra?: Partial<LogParams>): void {
  // No-op
}

export function logDebug(_domain: LogDomain, _event: string, _message: string, _extra?: Partial<LogParams>): void {
  // No-op
}
