'use client'

import { useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { MODEL_CATALOG, getDefaultModel } from '@/config/model-catalog'

export function DefaultModels() {
  const settings = useQuery(api.settings.queries.getSettings)
  const upsertSetting = useMutation(api.settings.mutations.upsertSetting)

  const defaultTextModel = (settings?.default_text_model as string) ?? getDefaultModel()

  const handleChange = useCallback(
    (key: string, value: string) => {
      void upsertSetting({
        key,
        value: JSON.stringify(value),
        encrypted: false,
      })
    },
    [upsertSetting],
  )

  const selectClass = `w-full px-3 py-2 rounded-[var(--r)] bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text)] font-[family-name:var(--font-mono)] text-xs focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-muted)] transition-all duration-150 cursor-pointer appearance-none`

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b6753' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 12px center',
  }

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--surface)] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-1">
        Default Models
      </h2>
      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] mb-5">
        Pre-selected models for new pipeline steps. You can always change per-step.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="default-text-model"
            className="block font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-secondary)] mb-1.5 tracking-[0.03em] uppercase"
          >
            Text Model
          </label>
          <select
            id="default-text-model"
            value={defaultTextModel}
            onChange={(e) => handleChange('default_text_model', e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            {MODEL_CATALOG.map((group) => (
              <optgroup key={group.id} label={group.name}>
                {group.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.role})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
