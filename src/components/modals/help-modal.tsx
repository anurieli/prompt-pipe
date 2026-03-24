'use client'

import { useCallback, useEffect, useRef } from 'react'
import { NODE_TYPES } from '@/config/providers'

type HelpModalProps = {
  open: boolean
  onClose: () => void
}

const WORKFLOW_STEPS = [
  {
    title: 'Drop in an idea',
    description: 'Hit \u2318N or click + New Idea. Pick a Starter Pipe or describe your idea for AI to build a pipeline.',
  },
  {
    title: 'Write your seed prompt',
    description: 'The SeedBox at the top is your raw input. Whatever you type flows into the pipeline.',
  },
  {
    title: 'Build the pipeline',
    description: 'Add steps with + Add Step. Each step has a type \u2014 Research, Analyze, Generate, or Transform.',
  },
  {
    title: 'Run it',
    description: 'Hit \u2318\u23CE or click Run Pipeline. Watch each step process in sequence.',
  },
  {
    title: 'See output, export',
    description: 'Results appear in the right panel. Export as Markdown or JSON.',
  },
] as const

const SHORTCUTS = [
  { keys: '\u2318N', label: 'New idea' },
  { keys: '\u2318\u23CE', label: 'Run pipeline' },
  { keys: '?', label: 'Toggle help' },
  { keys: 'Esc', label: 'Close modal' },
] as const

export function HelpModal({ open, onClose }: HelpModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="
        fixed inset-0
        bg-black/65 backdrop-blur-[8px]
        z-50
        flex items-center justify-center
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How PromptPipe works"
        className="
          bg-[var(--surface)] border border-[var(--border-strong)]
          rounded-[var(--r-lg)]
          w-[520px] max-h-[80vh] overflow-y-auto
          shadow-[0_24px_80px_rgba(0,0,0,0.6)]
          animate-[modalIn_0.2s_ease]
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between px-[22px] pt-5 pb-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl mb-1">
              How PromptPipe Works
            </h3>
            <p className="text-[12.5px] text-[var(--text-secondary)] font-light">
              Every idea is a prompt. Every prompt gets a pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="
              p-1.5 rounded-[var(--r)]
              text-[var(--text-muted)] cursor-pointer
              hover:text-[var(--text)] hover:bg-[var(--surface-2)]
              transition-all duration-150 shrink-0 mt-0.5
            "
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Section: The Workflow */}
        <div className="px-[22px] pt-5 pb-2">
          <h4 className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-4">
            The Workflow
          </h4>
          <div className="flex flex-col">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={index} className="flex gap-3.5">
                {/* Step indicator */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-7 h-7 rounded-full border border-[var(--accent)] bg-[var(--accent-muted)] flex items-center justify-center">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--accent)] font-semibold">
                      {index + 1}
                    </span>
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border-strong)] mt-1.5 mb-1.5 min-h-[12px]" />
                  )}
                </div>

                {/* Step content */}
                <div className="pb-4">
                  <h5 className="font-[family-name:var(--font-body)] text-[13px] font-semibold text-[var(--text)] mb-0.5">
                    {step.title}
                  </h5>
                  <p className="font-[family-name:var(--font-body)] text-[11.5px] text-[var(--text-secondary)] leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-[22px] h-px bg-[var(--border)]" />

        {/* Section: Step Types */}
        <div className="px-[22px] pt-5 pb-3">
          <h4 className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-3">
            Step Types
          </h4>
          <div className="flex flex-col gap-1">
            {NODE_TYPES.map((nt) => (
              <div
                key={nt.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--r)]"
              >
                <div
                  className="
                    w-8 h-8 rounded-lg
                    flex items-center justify-center
                    font-[family-name:var(--font-mono)]
                    text-[13px] font-bold shrink-0
                  "
                  style={{ background: nt.colorMuted, color: nt.color }}
                >
                  {nt.letter}
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-[var(--text)]">
                    {nt.label}
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-light leading-[1.4]">
                    {nt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-[22px] h-px bg-[var(--border)]" />

        {/* Section: Shortcuts */}
        <div className="px-[22px] pt-5 pb-5">
          <h4 className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-3">
            Shortcuts
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center gap-2.5">
                <kbd className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] px-[7px] py-[3px] bg-[var(--surface-2)] border border-[var(--border)] rounded-[4px] min-w-[36px] text-center">
                  {shortcut.keys}
                </kbd>
                <span className="text-[11.5px] text-[var(--text-secondary)] font-light">
                  {shortcut.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
