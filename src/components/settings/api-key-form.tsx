'use client'

import { useState, useCallback } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/shared/button'

export function ApiKeyForm() {
  const settings = useQuery(api.settings.queries.getSettings)
  const connectionStatus = useUIStore((s) => s.connectionStatus)
  const connectionError = useUIStore((s) => s.connectionError)
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus)

  const saveApiKey = useAction(api.settings.actions.saveApiKey)
  const testConnection = useAction(api.settings.actions.testConnection)

  const apiKeyInfo = settings?.openrouter_api_key as { hasKey: boolean; maskedKey: string } | undefined
  const hasStoredKey = apiKeyInfo?.hasKey ?? false

  const [inputValue, setInputValue] = useState('')
  const [modelCount, setModelCount] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!inputValue.trim()) return
    setIsSaving(true)
    try {
      await saveApiKey({ key: 'openrouter_api_key', value: inputValue.trim() })
      setInputValue('') // Clear input after save — key is now encrypted server-side
    } finally {
      setIsSaving(false)
    }
  }, [inputValue, saveApiKey])

  const handleTestConnection = useCallback(async () => {
    setConnectionStatus('testing')
    setModelCount(null)

    try {
      // If user has typed a key, test that; otherwise test the stored key
      const result = inputValue.trim()
        ? await testConnection({ temporaryKey: inputValue.trim() })
        : await testConnection({})

      if (result.ok) {
        setConnectionStatus('success')
        setModelCount(result.modelsAvailable ?? null)
      } else {
        setConnectionStatus('error', result.error ?? 'Connection failed')
      }
    } catch {
      setConnectionStatus('error', 'Network error — could not reach server')
    }
  }, [inputValue, testConnection, setConnectionStatus])

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--surface)] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mb-1">
        API Configuration
      </h2>
      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] mb-4">
        Connect your OpenRouter API key to access AI models.
      </p>

      {/* API Key Input */}
      <div className="mb-4">
        <label
          htmlFor="api-key-input"
          className="block font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-secondary)] mb-1.5 tracking-[0.03em] uppercase"
        >
          OpenRouter API Key
        </label>
        <div className="flex gap-2">
          <input
            id="api-key-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={hasStoredKey ? (apiKeyInfo?.maskedKey ?? 'Key saved') : 'sk-or-v1-...'}
            className="flex-1 px-3 py-2 rounded-[var(--r)] bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text)] font-[family-name:var(--font-mono)] text-xs placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-muted)] transition-all duration-150"
            autoComplete="off"
            spellCheck={false}
          />
          <Button
            variant="default"
            size="md"
            onClick={() => void handleTestConnection()}
            disabled={(!inputValue.trim() && !hasStoredKey) || connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? (
              <>
                <Spinner />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus !== 'idle' && connectionStatus !== 'testing' && (
        <div className="mb-4">
          {connectionStatus === 'success' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--r)] bg-[var(--green-muted)] border border-[rgba(124,184,122,0.2)]">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8.5l3 3 7-7"
                  stroke="var(--green)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-[family-name:var(--font-body)] text-xs text-[var(--green)]">
                Connected{modelCount !== null ? ` — ${modelCount} models available` : ''}
              </span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--r)] bg-[var(--red-muted)] border border-[rgba(201,96,90,0.2)]">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="var(--red)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-[family-name:var(--font-body)] text-xs text-[var(--red)]">
                {connectionError ?? 'Connection failed'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="accent"
          size="md"
          onClick={() => void handleSave()}
          disabled={!inputValue.trim() || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save API Key'}
        </Button>
        {hasStoredKey && !inputValue.trim() && (
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
            Key saved ({apiKeyInfo?.maskedKey})
          </span>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="animate-spin">
      <circle cx="8" cy="8" r="6" stroke="var(--text-muted)" strokeWidth="1.5" />
      <path
        d="M14 8a6 6 0 00-6-6"
        stroke="var(--text)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
