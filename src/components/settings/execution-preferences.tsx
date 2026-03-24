'use client'

import { useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

type TemperaturePreset = {
  id: string
  label: string
  value: number
  description: string
}

const TEMPERATURE_PRESETS: TemperaturePreset[] = [
  {
    id: 'precise',
    label: 'Precise',
    value: 0.1,
    description: 'Factual extraction, data parsing, code generation',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    value: 0.5,
    description: 'Analysis, summaries, structured reasoning',
  },
  {
    id: 'creative',
    label: 'Creative',
    value: 0.7,
    description: 'Writing, brainstorming, content drafting',
  },
  {
    id: 'expressive',
    label: 'Expressive',
    value: 1.0,
    description: 'Storytelling, marketing copy, ideation',
  },
  {
    id: 'wild',
    label: 'Wild',
    value: 1.5,
    description: 'Experimental prompts, unexpected angles, maximum variety',
  },
]

const DEFAULT_PRESET = 'balanced'

function getPresetForTemp(temp: number): string {
  let closest = TEMPERATURE_PRESETS[0]
  let minDiff = Math.abs(temp - closest.value)
  for (const preset of TEMPERATURE_PRESETS) {
    const diff = Math.abs(temp - preset.value)
    if (diff < minDiff) {
      closest = preset
      minDiff = diff
    }
  }
  return closest.id
}

export function ExecutionPreferences() {
  const settings = useQuery(api.settings.queries.getSettings)
  const upsertSetting = useMutation(api.settings.mutations.upsertSetting)

  const temperature = (settings?.default_temperature as number) ?? 0.5
  const activePresetId = getPresetForTemp(temperature)

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      void upsertSetting({
        key,
        value: JSON.stringify(value),
        encrypted: false,
      })
    },
    [upsertSetting],
  )

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--surface)] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-1">
        Execution Preferences
      </h2>
      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] mb-5">
        Default settings for pipeline execution. These can be overridden per-step.
      </p>

      <div className="flex flex-col gap-5">
        {/* Temperature Presets */}
        <div>
          <label className="block font-[family-name:var(--font-body)] text-sm text-[var(--text)] mb-0.5">
            Creativity level
          </label>
          <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)] mb-3">
            Controls how deterministic or creative model responses are
          </p>

          <div className="flex flex-col gap-1.5">
            {TEMPERATURE_PRESETS.map((preset) => {
              const isActive = preset.id === activePresetId
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleChange('default_temperature', preset.value)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-[var(--r)] border transition-all duration-150
                    ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                        : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-[family-name:var(--font-body)] text-xs font-medium ${
                        isActive ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                      }`}
                    >
                      {preset.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)]">
                        {preset.value.toFixed(1)}
                      </span>
                      {preset.id === DEFAULT_PRESET && (
                        <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.08em] text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5 rounded-sm">
                          default
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)] mt-0.5">
                    {preset.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
