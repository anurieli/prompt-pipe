'use client'

import { useEffect, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUIStore } from '@/stores/ui-store'
import { usePipelineStream } from '@/hooks/use-pipeline-stream'
import { RightPanel } from '@/components/layout/right-panel'
import { RunBar } from '@/components/layout/run-bar'
import { SeedBox } from '@/components/seed/seed-box'
import { PipelineView } from '@/components/pipeline/pipeline-view'
import { EmptyStateQuote } from '@/components/shared/empty-state-quote'
import { ApiKeyForm } from '@/components/settings/api-key-form'

export default function Home() {
  const activeIdeaId = useUIStore((s) => s.activeIdeaId)
  const pipelineStream = usePipelineStream()
  const hasApiKey = useQuery(api.settings.queries.hasApiKey, { key: 'openrouter_api_key' })

  // Global keyboard shortcut: Cmd/Ctrl+Enter to run pipeline
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (activeIdeaId && !pipelineStream.isRunning) {
          void pipelineStream.startRun(activeIdeaId)
        }
      }
    },
    [activeIdeaId, pipelineStream],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleGlobalKeyDown])

  // Show setup gate if no API key saved (and query has resolved)
  if (hasApiKey === false) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto py-12 px-6">
        <div className="w-full max-w-[520px] flex flex-col gap-6">
          {/* Heading */}
          <div className="text-center">
            <h1 className="font-[family-name:var(--font-display)] text-[2rem] text-[var(--text)] mb-3 leading-tight">
              Welcome to PromptPipe
            </h1>
            <p className="font-[family-name:var(--font-body)] text-[13.5px] text-[var(--text-secondary)] leading-relaxed max-w-[400px] mx-auto">
              PromptPipe uses{' '}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                OpenRouter
              </a>{' '}
              to access AI models from Anthropic, OpenAI, Google, xAI, and more — all through a single API key.
            </p>
          </div>

          {/* API Key form */}
          <ApiKeyForm />

          {/* Billing tip */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-[var(--r)] bg-[var(--surface-2)] border border-[var(--border)]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-[1px] text-[var(--accent)]">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="font-[family-name:var(--font-body)] text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              We recommend setting a{' '}
              <a
                href="https://openrouter.ai/settings/limits"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] underline underline-offset-2"
              >
                billing limit on OpenRouter
              </a>{' '}
              to avoid unexpected charges.
            </p>
          </div>

          {/* Create account link */}
          <div className="text-center">
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors duration-150 underline underline-offset-2"
            >
              Create an OpenRouter account →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Center Content */}
      <main aria-label="Pipeline editor" className="flex-1 flex flex-col overflow-hidden bg-[var(--bg)]">
        {activeIdeaId ? (
          <>
            {/* Single scrollable area for seed + pipeline */}
            <div className="flex-1 overflow-y-auto">
              <SeedBox />
              <PipelineView
                ideaId={activeIdeaId}
                isPipelineRunning={pipelineStream.isRunning}
                isPaused={pipelineStream.isPaused}
                pausedAtStep={pipelineStream.pausedAtStep}
                onResume={pipelineStream.resumeRun}
                onRerunFromStep={(stepIndex) => void pipelineStream.rerunFromStep(activeIdeaId, stepIndex)}
              />
            </div>
          </>
        ) : (
          <EmptyStateQuote />
        )}

        {/* RunBar at bottom */}
        {activeIdeaId ? <RunBar pipelineStream={pipelineStream} /> : null}
      </main>

      {/* Right Panel — output display + export */}
      {activeIdeaId ? <RightPanel /> : null}
    </div>
  )
}
