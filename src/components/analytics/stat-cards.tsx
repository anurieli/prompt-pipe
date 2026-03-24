'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCost, formatTokens } from '@/lib/format'

export function StatCards() {
  const stats = useQuery(api.analytics.queries.getTotalStats)

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 animate-pulse"
          >
            <div className="h-3 w-16 bg-[var(--surface-2)] rounded mb-3" />
            <div className="h-6 w-20 bg-[var(--surface-2)] rounded" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Cost',
      value: formatCost(stats.totalCostUsd),
      color: 'var(--accent)',
    },
    {
      label: 'Total Tokens',
      value: formatTokens(stats.totalInputTokens + stats.totalOutputTokens),
      color: 'var(--blue)',
    },
    {
      label: 'Pipeline Runs',
      value: stats.totalRuns.toLocaleString(),
      color: 'var(--green)',
    },
    {
      label: 'Models Used',
      value: stats.uniqueModels.toString(),
      color: 'var(--lavender)',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-2">
            {card.label}
          </span>
          <span
            className="font-[family-name:var(--font-display)] text-xl"
            style={{ color: card.color }}
          >
            {card.value}
          </span>
        </div>
      ))}
    </div>
  )
}
