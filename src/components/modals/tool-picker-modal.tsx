'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CORE_NODE_TYPES, ADVANCED_NODE_TYPES, type NodeTypeId } from '@/config/providers'

type ToolPickerModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (nodeType: NodeTypeId) => void
  mode?: 'add-step' | 'split-thread'
}

export function ToolPickerModal({ open, onClose, onSelect, mode = 'add-step' }: ToolPickerModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
        aria-label="Add a step"
        className="
          bg-[var(--surface)] border border-[var(--border-strong)]
          rounded-[var(--r-lg)]
          w-[440px] max-h-[80vh] overflow-y-auto
          shadow-[0_24px_80px_rgba(0,0,0,0.6)]
          animate-[modalIn_0.2s_ease]
        "
      >
        {/* Header */}
        <div className="px-[22px] pt-5 pb-4 border-b border-[var(--border)]">
          <h3 className="font-[family-name:var(--font-display)] text-xl mb-1">
            {mode === 'split-thread' ? 'Add a Thread' : 'Add a Step'}
          </h3>
          <p className="text-[12.5px] text-[var(--text-secondary)] font-light">
            {mode === 'split-thread'
              ? 'Choose a thread type to run in parallel'
              : 'Choose a step type to process the previous output'}
          </p>
        </div>

        {/* Core node types */}
        <div className="p-2">
          {CORE_NODE_TYPES.map((nt) => (
            <button
              key={nt.id}
              type="button"
              onClick={() => onSelect(nt.id as NodeTypeId)}
              className="
                w-full flex items-center gap-3.5
                px-3.5 py-3
                rounded-[var(--r)]
                cursor-pointer
                transition-all duration-[120ms]
                border border-transparent
                hover:bg-[var(--surface-2)] hover:border-[var(--border)]
                text-left
              "
            >
              <div
                className="
                  w-9 h-9 rounded-lg
                  flex items-center justify-center
                  font-[family-name:var(--font-mono)]
                  text-sm font-bold shrink-0
                "
                style={{ background: nt.colorMuted, color: nt.color }}
              >
                {nt.letter}
              </div>
              <div>
                <h4 className="text-[13.5px] font-semibold mb-0.5">
                  {nt.label}
                </h4>
                <p className="text-[11.5px] text-[var(--text-secondary)] leading-[1.4] font-light">
                  {nt.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Advanced section */}
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="
              w-full flex items-center justify-between
              px-3.5 py-2
              text-[11px] font-[family-name:var(--font-mono)]
              text-[var(--text-muted)] uppercase tracking-[0.08em]
              cursor-pointer
              hover:text-[var(--text-secondary)]
              transition-colors duration-150
            "
          >
            <span>Advanced</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              style={{
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
            >
              <path
                d="M2 3.5l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showAdvanced && (
            <div className="animate-[slideDown_0.15s_ease]">
              {ADVANCED_NODE_TYPES.map((nt) => (
                <button
                  key={nt.id}
                  type="button"
                  onClick={() => onSelect(nt.id as NodeTypeId)}
                  className="
                    w-full flex items-center gap-3.5
                    px-3.5 py-3
                    rounded-[var(--r)]
                    cursor-pointer
                    transition-all duration-[120ms]
                    border border-transparent
                    hover:bg-[var(--surface-2)] hover:border-[var(--border)]
                    text-left
                  "
                >
                  <div
                    className="
                      w-9 h-9 rounded-lg
                      flex items-center justify-center
                      font-[family-name:var(--font-mono)]
                      text-sm font-bold shrink-0
                    "
                    style={{ background: nt.colorMuted, color: nt.color }}
                  >
                    {nt.letter}
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-semibold mb-0.5">
                      {nt.label}
                    </h4>
                    <p className="text-[11.5px] text-[var(--text-secondary)] leading-[1.4] font-light">
                      {nt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
