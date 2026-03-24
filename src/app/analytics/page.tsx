'use client'

import { StatCards } from '@/components/analytics/stat-cards'
import { UsageByModel } from '@/components/analytics/usage-by-model'
import { UsageOverTime } from '@/components/analytics/usage-over-time'

export default function AnalyticsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg)]">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 h-[52px] flex items-center border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm">
        <h1 className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
          Analytics
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <StatCards />
        <UsageByModel />
        <UsageOverTime />
      </div>
    </div>
  )
}
