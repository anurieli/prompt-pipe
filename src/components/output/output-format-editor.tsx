'use client'

import { useState } from 'react'
import { OUTPUT_FORMATS } from '@/config/output-formats'

type OutputFormatEditorProps = {
  value: string | null
  onChange: (format: string | null) => void
}

export function OutputFormatEditor({ value, onChange }: OutputFormatEditorProps) {
  const [customText, setCustomText] = useState('')

  const activeFormat = OUTPUT_FORMATS.find((f) => f.id === value)
  const isCustom = value === 'custom'

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {OUTPUT_FORMATS.map((format) => {
          const isActive = value === format.id
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => {
                if (isActive) {
                  onChange(null)
                } else {
                  onChange(format.id)
                }
              }}
              title={format.description}
              className={`
                px-2.5 py-1
                rounded-[4px]
                font-[family-name:var(--font-mono)]
                text-[10px] font-medium
                tracking-[0.04em]
                border cursor-pointer
                transition-all duration-150
                ${isActive
                  ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {format.label}
            </button>
          )
        })}
      </div>

      {isCustom && (
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Write your custom output format instructions..."
          rows={3}
          className="
            mt-2 w-full
            bg-[var(--bg)] border border-[var(--border)]
            rounded-[var(--r)]
            px-3.5 py-3
            text-[var(--text)]
            font-[family-name:var(--font-mono)] text-[11.5px]
            leading-[1.6] font-light
            resize-y min-h-[56px]
            outline-none
            transition-colors duration-150
            focus:border-[var(--border-active)]
            placeholder:text-[var(--text-faint)]
          "
        />
      )}

      {activeFormat && !isCustom && (
        <p className="mt-1.5 text-[10px] text-[var(--text-faint)] font-[family-name:var(--font-mono)]">
          {activeFormat.instruction}
        </p>
      )}
    </div>
  )
}
