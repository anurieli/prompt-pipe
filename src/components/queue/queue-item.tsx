'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { StatusDot } from '@/components/shared/status-dot'

type QueueItemProps = {
  idea: Doc<'ideas'>
  isActive: boolean
  onClick: () => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function QueueItem({ idea, isActive, onClick, onArchive, onDelete, onDuplicate }: QueueItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        closeMenu()
      }
    }

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen, closeMenu])

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const canArchive = idea.status === 'done' || idea.status === 'failed'
  const hasRun = idea.status === 'running' || idea.status === 'done' || idea.status === 'failed' || idea.status === 'paused'

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={`${idea.title || 'Untitled idea'} — ${idea.status}`}
        aria-current={isActive ? 'true' : undefined}
        className={[
          'w-full text-left p-3 rounded-[var(--r)] cursor-pointer',
          'transition-all duration-[120ms] ease-out mb-0.5',
          'border relative',
          isActive
            ? 'bg-[var(--accent-muted)] border-[var(--border-active)]'
            : hasRun
              ? 'bg-[var(--accent-muted)] border-transparent hover:border-[var(--border)]'
              : 'border-transparent hover:bg-[var(--surface)] hover:border-[var(--border)]',
        ].join(' ')}
      >
        {/* Active accent bar */}
        {isActive ? (
          <span
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-[1px] bg-[var(--accent)]"
            aria-hidden="true"
          />
        ) : null}

        {/* Title */}
        <div className="text-[13px] font-medium leading-[1.3] text-[var(--text)] mb-1.5 truncate pr-6">
          {idea.title || 'Untitled idea'}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
          <StatusDot status={idea.status} />
          {idea.status === 'failed' ? (
            <span className="text-[var(--red)]">failed</span>
          ) : null}
          <span className="ml-auto shrink-0">{relativeTime(idea.updatedAt)}</span>
        </div>
      </button>

      {/* Overflow menu trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen((prev) => !prev)
        }}
        className={[
          'absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center',
          'rounded-[4px] transition-all duration-150',
          'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
          menuOpen
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-60',
        ].join(' ')}
        aria-label="Idea actions"
      >
        <span className="font-[family-name:var(--font-mono)] text-[14px] leading-none tracking-[1px]">···</span>
      </button>

      {/* Dropdown menu */}
      {menuOpen ? (
        <div
          ref={menuRef}
          className={[
            'absolute top-9 right-2 z-50 min-w-[140px]',
            'bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--r)] shadow-lg',
            'animate-[modalIn_0.15s_ease-out]',
            'py-1',
          ].join(' ')}
        >
          {canArchive ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onArchive(idea._id)
                closeMenu()
              }}
              className="w-full text-left px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors duration-150"
            >
              Archive
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(idea._id)
              closeMenu()
            }}
            className="w-full text-left px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors duration-150"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(idea._id)
              closeMenu()
            }}
            className="w-full text-left px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--red)] hover:bg-[var(--red-muted)] transition-colors duration-150"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}
