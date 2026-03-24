'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCost, formatTokens } from '@/lib/format'

export function UsageOverview() {
  const stats = useQuery(api.analytics.queries.getTotalStats)

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)]">
          Usage Overview
        </h2>
        <Link
          href="/analytics"
          className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--accent)] hover:text-[var(--text)] transition-colors duration-150"
        >
          View details →
        </Link>
      </div>

      {!stats ? (
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <span className="font-[family-name:var(--font-body)] text-sm">Loading...</span>
        </div>
      ) : stats.totalRuns === 0 ? (
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)]">
          No usage recorded yet. Run a pipeline to start tracking.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1">
              Total Cost
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
              {formatCost(stats.totalCostUsd)}
            </span>
          </div>
          <div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1">
              Total Tokens
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
              {formatTokens(stats.totalInputTokens + stats.totalOutputTokens)}
            </span>
          </div>
          <div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1">
              Pipeline Runs
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
              {stats.totalRuns}
            </span>
          </div>
          <div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1">
              Models Used
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
              {stats.uniqueModels}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
