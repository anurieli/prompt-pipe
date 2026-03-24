'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Tooltip } from '@/components/shared/tooltip'
import { HelpModal } from '@/components/modals/help-modal'
import { CreditIndicator } from '@/components/layout/credit-indicator'

export function Topbar() {
  const [showHelp, setShowHelp] = useState(false)

  const toggleHelp = useCallback(() => setShowHelp((prev) => !prev), [])

  // Global ? key to toggle help (skips when typing in inputs)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }
      e.preventDefault()
      setShowHelp((prev) => !prev)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header role="banner" className="flex items-center justify-between px-6 h-[52px] border-b border-[var(--border)] bg-[var(--surface)] shrink-0 relative">
      {/* Accent glow line */}
      <span
        className="absolute bottom-[-1px] left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--accent-muted), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Left: Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 flex items-center justify-center">
            <svg viewBox="0 0 28 28" fill="none" width={28} height={28}>
              <rect
                x="2"
                y="2"
                width="24"
                height="24"
                rx="5"
                stroke="var(--accent)"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="9" cy="9" r="2.5" fill="var(--orange)" />
              <circle cx="19" cy="9" r="2.5" fill="var(--blue)" />
              <circle cx="14" cy="19" r="2.5" fill="var(--teal)" />
              <line
                x1="10.5"
                y1="10.5"
                x2="13"
                y2="17"
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
              <line
                x1="17.5"
                y1="10.5"
                x2="15"
                y2="17"
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-display)] text-lg text-[var(--text)] tracking-[-0.02em]">
            PromptPipe
          </span>
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] px-[7px] py-[2px] border border-[var(--border)] rounded-[4px] tracking-[0.03em]">
          v0.1
        </span>
      </div>

      {/* Right: Credits + Shortcuts + Settings */}
      <div className="flex items-center gap-2">
        <CreditIndicator />
        <Tooltip content="New idea" side="bottom">
          <kbd className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] px-[7px] py-[3px] bg-[var(--surface-2)] border border-[var(--border)] rounded-[4px] cursor-default">
            &#8984;N
          </kbd>
        </Tooltip>
        <Tooltip content="Run pipeline" side="bottom">
          <kbd className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] px-[7px] py-[3px] bg-[var(--surface-2)] border border-[var(--border)] rounded-[4px] cursor-default">
            &#8984;&#9166;
          </kbd>
        </Tooltip>
        <Tooltip content="How it works" side="bottom" shortcut="?">
          <button
            type="button"
            onClick={toggleHelp}
            aria-label="How it works"
            className="
              w-6 h-6 rounded-full
              border border-[var(--border-strong)]
              flex items-center justify-center
              font-[family-name:var(--font-mono)] text-[11px] font-semibold
              text-[var(--text-secondary)] cursor-pointer
              transition-all duration-150
              hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]
            "
          >
            ?
          </button>
        </Tooltip>
        <Tooltip content="Settings" side="bottom">
          <Link
            href="/settings"
            className="ml-2 p-1.5 rounded-[var(--r)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all duration-150"
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6.5 1.5h3l.4 1.7.6.3 1.6-.7 2.1 2.1-.7 1.6.3.6 1.7.4v3l-1.7.4-.3.6.7 1.6-2.1 2.1-1.6-.7-.6.3-.4 1.7h-3l-.4-1.7-.6-.3-1.6.7-2.1-2.1.7-1.6-.3-.6L.5 9.5v-3l1.7-.4.3-.6-.7-1.6 2.1-2.1 1.6.7.6-.3L6.5 1.5z"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </Link>
        </Tooltip>
      </div>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  )
}
