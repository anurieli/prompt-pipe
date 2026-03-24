'use client'

import React, { useState } from 'react'
import { MODEL_CATALOG, findModel, type ModelRole } from '@/config/model-catalog'
import { ModelPicker } from '@/components/modals/model-picker'
import type { ModelInfo } from '@/types/provider'

type TierPickerProps = {
  models: ModelInfo[]
  value: string | null
  onChange: (modelId: string) => void
}

const ROLE_COLORS: Record<ModelRole, string> = {
  fast: 'var(--green)',
  flagship: 'var(--accent)',
  reasoning: 'var(--blue)',
  code: 'var(--teal)',
}

const ROLE_LABELS: Record<ModelRole, string> = {
  fast: 'Fast',
  flagship: 'Flagship',
  reasoning: 'Reasoning',
  code: 'Code',
}

export function TierPicker({ models, value, onChange }: TierPickerProps) {
  const [showOverride, setShowOverride] = useState(false)

  // Determine which provider tab is active based on current value
  const currentCurated = value ? findModel(value) : null
  const defaultProviderId = MODEL_CATALOG[0]?.id ?? 'anthropic'
  const activeProviderId = currentCurated
    ? (MODEL_CATALOG.find((g) => g.models.some((m) => m.id === value))?.id ?? defaultProviderId)
    : defaultProviderId

  const [selectedProvider, setSelectedProvider] = useState<string>(activeProviderId)

  const currentGroup = MODEL_CATALOG.find((g) => g.id === selectedProvider) ?? MODEL_CATALOG[0]
  const selectedModel = models.find((m) => m.id === value)

  return (
    <div>
      {/* Provider tab chips */}
      <div className="flex flex-wrap gap-1 mb-3">
        {MODEL_CATALOG.map((group) => {
          const isActive = selectedProvider === group.id
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedProvider(group.id)}
              className={[
                'px-2.5 py-1 rounded-full border font-[family-name:var(--font-mono)] text-[10px]',
                'transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {group.name}
            </button>
          )
        })}
      </div>

      {/* Models for selected provider */}
      {currentGroup && (
        <div className="flex flex-col gap-1 mb-3">
          {currentGroup.models.map((model) => {
            const isSelected = value === model.id
            const roleColor = ROLE_COLORS[model.role]
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onChange(model.id)
                  setShowOverride(false)
                }}
                className={[
                  'flex items-center gap-2.5 px-3 py-2 rounded-[var(--r)] border w-full text-left',
                  'transition-all duration-150 cursor-pointer',
                  isSelected
                    ? 'bg-[var(--accent-muted)] border-[var(--accent)]'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]',
                ].join(' ')}
              >
                {/* Role badge */}
                <span
                  className="font-[family-name:var(--font-mono)] text-[9px] font-semibold uppercase tracking-[0.06em] px-1.5 py-[2px] rounded-sm shrink-0"
                  style={{
                    color: roleColor,
                    background: `color-mix(in srgb, ${roleColor} 12%, transparent)`,
                  }}
                >
                  {ROLE_LABELS[model.role]}
                </span>

                {/* Model name */}
                <span
                  className={[
                    'font-[family-name:var(--font-mono)] text-[11px] flex-1 truncate',
                    isSelected ? 'text-[var(--accent)]' : 'text-[var(--text)]',
                  ].join(' ')}
                >
                  {model.name}
                </span>

                {/* Check mark for selected */}
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[var(--accent)]">
                    <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected model indicator (when it's from full OpenRouter search, not catalog) */}
      {selectedModel && !currentCurated && !showOverride ? (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-secondary)]">
            Using: <span className="text-[var(--text)]">{selectedModel.name}</span>
          </span>
          {selectedModel.pricing ? (
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-muted)]">
              {formatPrice(selectedModel.pricing.promptPerToken * 1_000_000)} / {formatPrice(selectedModel.pricing.completionPerToken * 1_000_000)} per M
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Override toggle — escape hatch to full OpenRouter search */}
      <button
        type="button"
        onClick={() => setShowOverride(!showOverride)}
        aria-expanded={showOverride}
        className="
          font-[family-name:var(--font-mono)] text-[9px] font-medium
          text-[var(--text-faint)] hover:text-[var(--text-muted)]
          cursor-pointer transition-colors duration-150
          tracking-[0.04em] uppercase
        "
      >
        <span className="text-[10px]">{showOverride ? '\u25BC' : '\u25B6'}</span>{' '}
        Pick specific model
      </button>

      {showOverride ? (
        <div className="mt-1.5">
          <ModelPicker
            models={models}
            value={value}
            onChange={(id) => {
              onChange(id)
              setShowOverride(false)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function formatPrice(perM: number): string {
  if (perM < 0.01) return 'free'
  if (perM < 1) return `$${perM.toFixed(2)}`
  return `$${perM.toFixed(1)}`
}
