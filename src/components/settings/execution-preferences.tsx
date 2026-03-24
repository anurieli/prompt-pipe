'use client'

import { useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export function ExecutionPreferences() {
  const settings = useQuery(api.settings.queries.getSettings)
  const upsertSetting = useMutation(api.settings.mutations.upsertSetting)

  const pauseBetweenSteps = (settings?.pause_between_steps as boolean) ?? true
  const temperature = (settings?.default_temperature as number) ?? 0.7
  const maxTokens = (settings?.default_max_tokens as number) ?? 4096
  const parallelThreadLimit = (settings?.parallel_thread_limit as number) ?? 1

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
        {/* Pause Between Steps Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block font-[family-name:var(--font-body)] text-sm text-[var(--text)] mb-0.5">
              Pause between steps
            </label>
            <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)]">
              Wait for approval before advancing to the next pipeline step
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pauseBetweenSteps}
            aria-label="Pause between steps"
            onClick={() => handleChange('pause_between_steps', !pauseBetweenSteps)}
            className={`
              relative w-10 h-[22px] rounded-full border transition-all duration-200 cursor-pointer shrink-0
              ${
                pauseBetweenSteps
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'bg-[var(--surface-3)] border-[var(--border-strong)]'
              }
            `}
          >
            <span
              className={`
                absolute top-[2px] w-4 h-4 rounded-full transition-all duration-200
                ${
                  pauseBetweenSteps
                    ? 'left-[22px] bg-[var(--bg)]'
                    : 'left-[2px] bg-[var(--text-muted)]'
                }
              `}
            />
          </button>
        </div>

        {/* Temperature Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="temperature-slider"
              className="font-[family-name:var(--font-body)] text-sm text-[var(--text)]"
            >
              Temperature
            </label>
            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--accent)] tabular-nums">
              {temperature.toFixed(1)}
            </span>
          </div>
          <input
            id="temperature-slider"
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => handleChange('default_temperature', parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--surface-3)] accent-[var(--accent)]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg)] [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--accent)]
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--bg)]"
          />
          <div className="flex justify-between mt-1">
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)]">
              Precise
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)]">
              Creative
            </span>
          </div>
        </div>

        {/* Max Tokens Input */}
        <div>
          <label
            htmlFor="max-tokens-input"
            className="block font-[family-name:var(--font-body)] text-sm text-[var(--text)] mb-0.5"
          >
            Max tokens
          </label>
          <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)] mb-2">
            Maximum number of tokens in the model response
          </p>
          <input
            id="max-tokens-input"
            type="number"
            min={1}
            max={128000}
            step={256}
            value={maxTokens}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val > 0) {
                handleChange('default_max_tokens', val)
              }
            }}
            className="w-40 px-3 py-2 rounded-[var(--r)] bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text)] font-[family-name:var(--font-mono)] text-xs focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-muted)] transition-all duration-150 tabular-nums"
          />
        </div>

        {/* Parallel Thread Limit */}
        <div>
          <label
            htmlFor="thread-limit-select"
            className="block font-[family-name:var(--font-body)] text-sm text-[var(--text)] mb-0.5"
          >
            Parallel thread limit
          </label>
          <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)] mb-2">
            Maximum number of pipeline threads running simultaneously
          </p>
          <select
            id="thread-limit-select"
            value={parallelThreadLimit}
            onChange={(e) => handleChange('parallel_thread_limit', parseInt(e.target.value, 10))}
            className="w-40 px-3 py-2 rounded-[var(--r)] bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text)] font-[family-name:var(--font-mono)] text-xs focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-muted)] transition-all duration-150 cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b6753' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} thread{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
