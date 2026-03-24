'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ModelInfo } from '@/types/provider'

type ModelPickerProps = {
  models: ModelInfo[]
  value: string | null
  onChange: (modelId: string) => void
}

export function ModelPicker({ models, value, onChange }: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedModel = models.find((m) => m.id === value)

  const filtered = search.trim()
    ? models.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase())
      )
    : models

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
      setSearch('')
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function formatPrice(perToken: number): string {
    const perMillion = perToken * 1_000_000
    if (perMillion < 0.01) return 'free'
    return `$${perMillion.toFixed(2)}/M`
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Select model${selectedModel ? `: ${selectedModel.name}` : ''}`}
        className="
          w-full px-3 py-2
          bg-[var(--surface)] border border-[var(--border)]
          rounded-[4px]
          text-left
          font-[family-name:var(--font-mono)] text-[11px]
          text-[var(--text)]
          hover:border-[var(--border-strong)]
          transition-colors duration-150
          cursor-pointer
          truncate
        "
      >
        {selectedModel ? selectedModel.name : 'Select model...'}
      </button>

      {open && (
        <div
          className="
            absolute top-full left-0 right-0 mt-1 z-20
            bg-[var(--surface)] border border-[var(--border-strong)]
            rounded-[var(--r)] overflow-hidden
            shadow-[0_12px_40px_rgba(0,0,0,0.5)]
            max-h-[260px] flex flex-col
          "
        >
          <div className="p-2 border-b border-[var(--border)]">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              aria-label="Search models"
              className="
                w-full px-2.5 py-1.5
                bg-[var(--bg)] border border-[var(--border)]
                rounded-[4px]
                font-[family-name:var(--font-mono)] text-[11px]
                text-[var(--text)]
                placeholder:text-[var(--text-faint)]
                outline-none
                focus:border-[var(--border-active)]
              "
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[var(--text-muted)] text-[11px] font-[family-name:var(--font-mono)]">
                No models found
              </div>
            ) : (
              filtered.slice(0, 50).map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange(model.id)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={`
                    w-full px-3 py-2 text-left
                    flex items-center justify-between gap-2
                    transition-colors duration-100
                    cursor-pointer
                    ${model.id === value
                      ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                      : 'hover:bg-[var(--surface-2)] text-[var(--text)]'
                    }
                  `}
                >
                  <div className="min-w-0">
                    <div className="font-[family-name:var(--font-mono)] text-[11px] font-medium truncate">
                      {model.name}
                    </div>
                    <div className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)] truncate">
                      {model.id}
                    </div>
                  </div>
                  {model.pricing && (
                    <div className="shrink-0 text-right">
                      <div className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-muted)]">
                        {formatPrice(model.pricing.promptPerToken)}
                      </div>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
