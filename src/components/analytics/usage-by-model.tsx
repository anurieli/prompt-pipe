'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCost, formatTokens, formatRelativeTime } from '@/lib/format'

export function UsageByModel() {
  const summary = useQuery(api.analytics.queries.getUsageSummary)

  if (!summary) {
    return (
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 mb-8">
        <div className="h-4 w-32 bg-[var(--surface-2)] rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-[var(--surface-2)] rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (summary.length === 0) {
    return (
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 mb-8">
        <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-3">
          Usage by Model
        </h2>
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)]">
          No models used yet. Run a pipeline to start tracking usage.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 mb-8">
      <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-4">
        Usage by Model
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Model', 'Provider', 'Runs', 'Input', 'Output', 'Cost', 'Last Used'].map(
                (header) => (
                  <th
                    key={header}
                    className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] pb-2 pr-4 font-semibold"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => {
              const modelShort = row.model.includes('/')
                ? row.model.split('/').pop() ?? row.model
                : row.model
              return (
                <tr
                  key={row.model}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors duration-100"
                >
                  <td className="py-2.5 pr-4">
                    <span
                      className="font-[family-name:var(--font-body)] text-sm text-[var(--text)]"
                      title={row.model}
                    >
                      {modelShort}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] px-1.5 py-0.5 bg-[var(--surface-2)] rounded">
                      {row.provider}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)]">
                    {row.totalRuns}
                  </td>
                  <td className="py-2.5 pr-4 font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)]">
                    {formatTokens(row.totalInputTokens)}
                  </td>
                  <td className="py-2.5 pr-4 font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)]">
                    {formatTokens(row.totalOutputTokens)}
                  </td>
                  <td className="py-2.5 pr-4 font-[family-name:var(--font-mono)] text-xs text-[var(--accent)]">
                    {formatCost(row.totalCostUsd)}
                  </td>
                  <td className="py-2.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                    {formatRelativeTime(row.lastUsedAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
