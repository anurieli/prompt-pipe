'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCost, formatTokens } from '@/lib/format'

export function UsageOverTime() {
  const data = useQuery(api.analytics.queries.getUsageOverTime, { days: 30 })
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!data) {
    return (
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="h-4 w-40 bg-[var(--surface-2)] rounded mb-4 animate-pulse" />
        <div className="h-32 bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-3">
          Usage Over Time
        </h2>
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)]">
          No usage data in the last 30 days.
        </p>
      </div>
    )
  }

  const maxCost = Math.max(...data.map((d) => d.totalCostUsd))
  const chartHeight = 120

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-4">
        Usage Over Time
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] ml-2">
          Last 30 days
        </span>
      </h2>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <div className="flex items-end gap-px h-full">
          {data.map((day, i) => {
            const height = maxCost > 0 ? (day.totalCostUsd / maxCost) * chartHeight : 0
            const isHovered = hoveredIdx === i

            return (
              <div
                key={day.date}
                className="relative flex-1 flex items-end justify-center cursor-pointer"
                style={{ height: chartHeight }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  className="w-full rounded-t-[2px] transition-all duration-100"
                  style={{
                    height: Math.max(height, 2),
                    backgroundColor: isHovered ? 'var(--accent)' : 'var(--accent-muted)',
                    border: isHovered ? '1px solid var(--accent)' : 'none',
                  }}
                />

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 px-3 py-2 rounded-[var(--r)] bg-[var(--surface-3)] border border-[var(--border-strong)] shadow-lg whitespace-nowrap">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] block mb-1">
                      {day.date}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--accent)] block">
                      {formatCost(day.totalCostUsd)}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-secondary)] block">
                      {formatTokens(day.totalInputTokens + day.totalOutputTokens)} tokens
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] block">
                      {day.runCount} run{day.runCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)]">
          {data[0]?.date.slice(5) ?? ''}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)]">
          {data[data.length - 1]?.date.slice(5) ?? ''}
        </span>
      </div>
    </div>
  )
}
