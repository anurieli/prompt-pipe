'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/shared/button'

export function DataManagement() {
  const settings = useQuery(api.settings.queries.getSettings)
  const deleteSetting = useMutation(api.settings.mutations.deleteSetting)
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const handleExport = useCallback(() => {
    const exportData = { ...(settings ?? {}) }
    // API keys are already masked from the query — safe to export
    const payload = {
      exportedAt: new Date().toISOString(),
      application: 'PromptPipe',
      version: '0.1',
      settings: exportData,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `promptpipe-settings-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [settings])

  const handleClearAll = useCallback(async () => {
    const allKeys = [
      'openrouter_api_key',
      'default_text_model',
      'default_image_model',
      'pause_between_steps',
      'default_temperature',
      'default_max_tokens',
      'parallel_thread_limit',
    ]

    try {
      for (const key of allKeys) {
        await deleteSetting({ key })
      }
    } catch {
      // Silently handle
    }

    setConnectionStatus('idle')
    setShowConfirmClear(false)
  }, [deleteSetting, setConnectionStatus])

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--surface)] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-1">
        Data Management
      </h2>
      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] mb-5">
        Export or clear your settings data.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text)]">
              Export settings
            </p>
            <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)]">
              Download your preferences as a JSON file (API keys are masked)
            </p>
          </div>
          <Button variant="default" size="sm" onClick={handleExport}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 11v2.5a1 1 0 001 1h10a1 1 0 001-1V11M8 2v9M5 8l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Export
          </Button>
        </div>

        <div className="h-px bg-[var(--border)]" />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text)]">
              Clear all data
            </p>
            <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)]">
              Reset all settings to defaults. This cannot be undone.
            </p>
          </div>
          {showConfirmClear ? (
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-body)] text-[11px] text-[var(--red)]">
                Are you sure?
              </span>
              <Button variant="danger" size="sm" onClick={() => void handleClearAll()}>
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirmClear(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setShowConfirmClear(true)}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M6.5 7v4.5M9.5 7v4.5M3.5 4l.5 9.5a1 1 0 001 1h6a1 1 0 001-1L12.5 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
