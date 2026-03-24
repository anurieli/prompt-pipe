'use client'

import { useAction } from 'convex/react'
import { useState, useEffect } from 'react'
import { api } from '../../../convex/_generated/api'
import { Tooltip } from '@/components/shared/tooltip'

type CreditState =
  | { status: 'loading' }
  | { status: 'no_key' }
  | { status: 'error'; error: string }
  | { status: 'ok'; remaining: number | null; usage: number; limit: number | null; isFreeTier: boolean }

const POLL_INTERVAL_MS = 60_000

function formatUsd(n: number): string {
  return n < 10 ? `$${n.toFixed(2)}` : `$${Math.round(n)}`
}

function getCreditLevel(remaining: number | null): 'good' | 'low' | 'critical' | 'unlimited' {
  if (remaining == null) return 'unlimited'
  if (remaining > 5) return 'good'
  if (remaining > 1) return 'low'
  return 'critical'
}

const LEVEL_STYLES: Record<string, { dot: string; text: string }> = {
  unlimited: { dot: 'bg-[var(--green)]', text: 'text-[var(--text-muted)]' },
  good: { dot: 'bg-[var(--green)]', text: 'text-[var(--text-muted)]' },
  low: { dot: 'bg-[var(--accent)]', text: 'text-[var(--accent)]' },
  critical: { dot: 'bg-[var(--red)] animate-pulse', text: 'text-[var(--red)]' },
}

export function CreditIndicator() {
  const checkCredits = useAction(api.settings.actions.checkCredits)
  const [state, setState] = useState<CreditState>({ status: 'loading' })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const result = await checkCredits()
        if (cancelled) return
        if (!result.ok) {
          setState(result.error === 'no_key' ? { status: 'no_key' } : { status: 'error', error: result.error })
          return
        }
        setState({
          status: 'ok',
          remaining: result.remaining,
          usage: result.usage,
          limit: result.limit,
          isFreeTier: result.isFreeTier,
        })
      } catch {
        if (!cancelled) setState({ status: 'error', error: 'Failed to check credits' })
      }
    }
    void poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [checkCredits, refreshTrigger])

  if (state.status === 'loading' || state.status === 'no_key') return null

  if (state.status === 'error') {
    return (
      <Tooltip content={`Credit check failed: ${state.error}`} side="bottom">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--red)]">
            credits?
          </span>
        </div>
      </Tooltip>
    )
  }

  const level = getCreditLevel(state.remaining)
  const styles = LEVEL_STYLES[level]

  const tooltipContent = state.remaining != null
    ? `OpenRouter: ${formatUsd(state.usage)} used of ${formatUsd(state.limit!)} limit`
    : `OpenRouter: ${formatUsd(state.usage)} used (no limit set)`

  const displayValue = state.remaining != null
    ? formatUsd(state.remaining)
    : 'unlimited'

  return (
    <Tooltip content={tooltipContent} side="bottom">
      <button
        type="button"
        onClick={() => setRefreshTrigger((n) => n + 1)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:border-[var(--border-strong)] transition-colors duration-150"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
        <span className={`font-[family-name:var(--font-mono)] text-[10px] ${styles.text}`}>
          {displayValue}
        </span>
      </button>
    </Tooltip>
  )
}
