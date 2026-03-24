'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { getNodeType } from '@/config/providers'
import { STARTER_PIPES } from '@/config/starter-pipes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SuggestionStep = {
  name: string
  description: string
  nodeType: string
  model: string
  promptTemplate: string
  systemPrompt?: string
  temperature: number
  maxTokens: number
}

type Suggestion = {
  title: string
  tags: string[]
  intent: string
  steps: SuggestionStep[]
}

export type CreateFromPipeData = {
  title: string
  prompt: string
  tags: string[]
  steps: Array<{
    name: string
    description?: string
    threads: Array<{
      name: string
      provider: string
      nodeType: string
      model?: string
      promptTemplate: string
      systemPrompt?: string
      outputFormat?: string
      config: { temperature?: number; maxTokens?: number; responseType?: 'text' | 'image' }
    }>
  }>
}

type Screen = 'choose' | 'ai-input' | 'ai-loading' | 'ai-preview' | 'ai-error' | 'pipes'

export type NewIdeaModalProps = {
  open: boolean
  onClose: () => void
  onCreateFromPipe: (data: CreateFromPipeData) => void
  onStartFromScratch: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLACEHOLDERS = [
  'Write a blog post about the hidden costs of technical debt',
  'Research the top 5 competitors to Notion and compare their pricing',
  'Turn my rough meeting notes into a professional summary',
  'Generate a product launch email sequence for a new SaaS tool',
] as const

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex items-center gap-1.5
        text-[12px] text-[var(--text-muted)]
        font-[family-name:var(--font-mono)]
        hover:text-[var(--text-secondary)]
        transition-colors duration-150 cursor-pointer
      "
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M7 3L4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  )
}

function StepPreviewCard({ step, index }: { step: SuggestionStep; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const nt = getNodeType(step.nodeType)
  const preview = step.promptTemplate.length > 100
    ? step.promptTemplate.slice(0, 100) + '\u2026'
    : step.promptTemplate
  const displayModel = step.model.includes('/')
    ? step.model.split('/')[1]
    : step.model

  return (
    <div className="border border-[var(--border)] rounded-[var(--r)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface-2)]">
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)] w-4 shrink-0">
          {index + 1}.
        </span>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center font-[family-name:var(--font-mono)] text-[11px] font-bold shrink-0"
          style={{ background: nt?.colorMuted ?? 'var(--surface-3)', color: nt?.color ?? 'var(--text-muted)' }}
        >
          {nt?.letter ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text)] truncate leading-tight">{step.name}</p>
          <p className="text-[10.5px] text-[var(--text-muted)] leading-tight mt-[1px] font-[family-name:var(--font-mono)]">
            {nt?.label ?? step.nodeType} &middot; {displayModel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse prompt' : 'Expand prompt'}
          className="p-1 rounded text-[var(--text-faint)] cursor-pointer hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all duration-100 shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className={`px-3 py-2 border-t border-[var(--border)] ${expanded ? 'animate-[slideDown_0.15s_ease]' : ''}`}>
        <p className={`font-[family-name:var(--font-mono)] text-[10.5px] leading-relaxed ${expanded ? 'text-[var(--text-secondary)] whitespace-pre-wrap' : 'text-[var(--text-muted)]'}`}>
          {expanded ? step.promptTemplate : preview}
        </p>
      </div>
    </div>
  )
}

function LoadingView() {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-5">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] opacity-20" style={{ animation: 'spin 2s linear infinite' }} />
        <div className="absolute inset-[5px] rounded-full border-2 border-[var(--accent)] opacity-40" style={{ animation: 'spin 1.5s linear infinite reverse' }} />
        <div className="w-5 h-5 rounded-full bg-[var(--accent-muted)] border border-[var(--accent)]" style={{ animation: 'status-pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div className="text-center">
        <p className="font-[family-name:var(--font-body)] text-[14px] text-[var(--text)] mb-1">Analyzing your idea{dots}</p>
        <p className="text-[11.5px] text-[var(--text-muted)] font-light">Designing the optimal pipeline</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NewIdeaModal({ open, onClose, onCreateFromPipe, onStartFromScratch }: NewIdeaModalProps) {
  const [screen, setScreen] = useState<Screen>('choose')
  const [inputValue, setInputValue] = useState('')
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)

  const overlayRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestPipeline = useAction(api.pipeline.suggest.suggestPipeline)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setScreen('choose')
      setInputValue('')
      setSuggestion(null)
      setEditedTitle('')
      setEditedTags([])
      setErrorMessage('')
      setShowConfirm(false)
      setPlaceholderIndex(0)
      setPlaceholderVisible(true)
    }
  }, [open])

  // Placeholder cycling
  useEffect(() => {
    if (!open || screen !== 'ai-input') return
    const cycle = setInterval(() => {
      setPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length)
        setPlaceholderVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(cycle)
  }, [open, screen])

  // Focus textarea
  useEffect(() => {
    if (open && screen === 'ai-input') {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open, screen])

  // Keyboard
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && screen === 'ai-input') {
        void handleAISubmit()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, screen, inputValue])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose],
  )

  // AI flow
  const handleAISubmit = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setScreen('ai-loading')
    try {
      const result = await suggestPipeline({ input: trimmed })
      if (!result.ok || !result.suggestion) {
        setErrorMessage(result.error ?? 'AI suggestion failed. Please try again.')
        setScreen('ai-error')
        return
      }
      setSuggestion(result.suggestion)
      setEditedTitle(result.suggestion.title)
      setEditedTags([...result.suggestion.tags])
      setScreen('ai-preview')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
      setScreen('ai-error')
    }
  }, [inputValue, suggestPipeline])

  const handleCreateFromSuggestion = useCallback(() => {
    if (!suggestion) return
    onCreateFromPipe({
      title: editedTitle || suggestion.title,
      prompt: inputValue,
      tags: editedTags,
      steps: suggestion.steps.map((step) => ({
        name: step.name,
        description: step.description,
        threads: [{
          name: `${step.name} Thread`,
          provider: 'openrouter',
          nodeType: step.nodeType,
          model: step.model,
          promptTemplate: step.promptTemplate,
          systemPrompt: step.systemPrompt,
          config: { temperature: step.temperature, maxTokens: step.maxTokens },
        }],
      })),
    })
    onClose()
  }, [suggestion, editedTitle, editedTags, inputValue, onCreateFromPipe, onClose])

  // Pipe flow
  const handleSelectPipe = useCallback((pipeId: string) => {
    const pipe = STARTER_PIPES.find((p) => p.id === pipeId)
    if (!pipe) return
    onCreateFromPipe({
      title: pipe.name,
      prompt: pipe.seedPlaceholder,
      tags: pipe.tags,
      steps: pipe.steps.map((step) => ({
        name: step.name,
        description: step.description,
        threads: step.threads.map((thread) => ({
          name: thread.name,
          provider: thread.provider,
          nodeType: thread.nodeType,
          model: thread.model,
          promptTemplate: thread.promptTemplate,
          systemPrompt: thread.systemPrompt,
          outputFormat: thread.outputFormat,
          config: {
            temperature: thread.config.temperature,
            maxTokens: thread.config.maxTokens,
            responseType: thread.config.responseType,
          },
        })),
      })),
    })
    onClose()
  }, [onCreateFromPipe, onClose])

  if (!open) return null

  // Dynamic header
  const headers: Record<Screen, { title: string; subtitle: string }> = {
    choose: { title: 'New Idea', subtitle: 'How do you want to start?' },
    'ai-input': { title: 'Generate with AI', subtitle: 'Describe your idea and AI will design a pipeline.' },
    'ai-loading': { title: 'Generate with AI', subtitle: 'Building your pipeline...' },
    'ai-preview': { title: 'Your Pipeline', subtitle: 'Review what AI designed, then create.' },
    'ai-error': { title: 'Generate with AI', subtitle: 'Something went wrong.' },
    pipes: { title: 'Starter Pipes', subtitle: 'Pick a pre-built pipeline to get going instantly.' },
  }
  const header = headers[screen]
  const showBack = screen !== 'choose'

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/65 backdrop-blur-[8px] z-50 flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New idea"
        className="
          bg-[var(--surface)] border border-[var(--border-strong)]
          rounded-[var(--r-lg)]
          w-[560px] max-h-[86vh] overflow-y-auto
          shadow-[0_24px_80px_rgba(0,0,0,0.6)]
          animate-[modalIn_0.2s_ease]
          flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between px-[22px] pt-5 pb-4 border-b border-[var(--border)] shrink-0">
          <div className="flex flex-col gap-1">
            {showBack && <BackButton onClick={() => setScreen('choose')} />}
            <h3 className="font-[family-name:var(--font-display)] text-xl">{header.title}</h3>
            <p className="text-[12.5px] text-[var(--text-secondary)] font-light">{header.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-[var(--r)] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all duration-150 shrink-0 mt-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ============================================================= */}
        {/* CHOOSE SCREEN — 3 options, no scroll                          */}
        {/* ============================================================= */}
        {screen === 'choose' && (
          <div className="flex flex-col gap-2.5 p-5">
            {/* Option 1: AI */}
            <button
              type="button"
              onClick={() => setScreen('ai-input')}
              className="
                flex items-center gap-4 p-4
                rounded-[var(--r-lg)]
                border border-[var(--border)]
                bg-[var(--surface-2)]
                cursor-pointer text-left
                transition-all duration-[120ms]
                hover:bg-[var(--surface-3)] hover:border-[var(--accent)]
                group
              "
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center shrink-0 group-hover:bg-[var(--accent-strong)] transition-colors duration-150">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2v4M10 14v4M2 10h4M14 10h4M4.93 4.93l2.83 2.83M12.24 12.24l2.83 2.83M15.07 4.93l-2.83 2.83M7.76 12.24l-2.83 2.83" />
                </svg>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[var(--text)] mb-0.5">Generate with AI</h4>
                <p className="text-[12px] text-[var(--text-secondary)] font-light leading-[1.4]">
                  Describe your idea. AI designs the optimal pipeline for you.
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 ml-auto text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Option 2: Starter Pipes */}
            <button
              type="button"
              onClick={() => setScreen('pipes')}
              className="
                flex items-center gap-4 p-4
                rounded-[var(--r-lg)]
                border border-[var(--border)]
                bg-[var(--surface-2)]
                cursor-pointer text-left
                transition-all duration-[120ms]
                hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)]
                group
              "
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--blue-muted)] flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="5" height="5" rx="1" />
                  <rect x="12" y="3" width="5" height="5" rx="1" />
                  <rect x="3" y="12" width="5" height="5" rx="1" />
                  <rect x="12" y="12" width="5" height="5" rx="1" />
                </svg>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[var(--text)] mb-0.5">Starter Pipes</h4>
                <p className="text-[12px] text-[var(--text-secondary)] font-light leading-[1.4]">
                  Pick a pre-built pipeline. Research, content, analysis, and more.
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 ml-auto text-[var(--text-faint)] group-hover:text-[var(--text-secondary)] transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Option 3: From scratch */}
            <button
              type="button"
              onClick={() => { onStartFromScratch(); onClose() }}
              className="
                flex items-center gap-4 p-4
                rounded-[var(--r-lg)]
                border border-[var(--border)]
                bg-[var(--surface-2)]
                cursor-pointer text-left
                transition-all duration-[120ms]
                hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)]
                group
              "
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="10" y1="5" x2="10" y2="15" />
                  <line x1="5" y1="10" x2="15" y2="10" />
                </svg>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[var(--text)] mb-0.5">Start from scratch</h4>
                <p className="text-[12px] text-[var(--text-secondary)] font-light leading-[1.4]">
                  Blank canvas. Build your own pipeline step by step.
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 ml-auto text-[var(--text-faint)] group-hover:text-[var(--text-secondary)] transition-colors">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* AI INPUT SCREEN                                                */}
        {/* ============================================================= */}
        {screen === 'ai-input' && (
          <div className="flex flex-col gap-4 px-[22px] py-5">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={4}
                className="
                  w-full resize-none
                  bg-[var(--surface-2)] border border-[var(--border-strong)]
                  rounded-[var(--r)] px-4 py-3.5
                  text-[13.5px] text-[var(--text)]
                  font-[family-name:var(--font-body)]
                  focus:outline-none focus:border-[var(--border-active)]
                  transition-colors duration-150 leading-relaxed
                "
                style={{ caretColor: 'var(--accent)' }}
              />
              {!inputValue && (
                <p
                  className="pointer-events-none absolute top-[14px] left-4 right-4 text-[13.5px] text-[var(--text-faint)] font-[family-name:var(--font-body)] leading-relaxed transition-opacity duration-300"
                  style={{ opacity: placeholderVisible ? 1 : 0 }}
                >
                  {PLACEHOLDERS[placeholderIndex]}
                </p>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-faint)] font-[family-name:var(--font-mono)] -mt-1">
              Press <kbd className="px-[5px] py-[2px] bg-[var(--surface-3)] border border-[var(--border)] rounded text-[10px]">{'\u2318\u23CE'}</kbd> to submit
            </p>
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => void handleAISubmit()}
                disabled={!inputValue.trim()}
                className="
                  flex items-center gap-2 px-5 py-2.5
                  bg-[var(--accent)] text-[#111110]
                  rounded-[var(--r)] text-[13px] font-semibold
                  font-[family-name:var(--font-body)] cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                  hover:brightness-110 transition-all duration-150
                "
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l6 5-6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Build Pipeline
              </button>
            </div>
          </div>
        )}

        {/* AI LOADING */}
        {screen === 'ai-loading' && <LoadingView />}

        {/* ============================================================= */}
        {/* AI PREVIEW SCREEN                                              */}
        {/* ============================================================= */}
        {screen === 'ai-preview' && suggestion && (
          <div className="flex flex-col">
            <div className="px-[22px] pt-5 pb-4 border-b border-[var(--border)]">
              <label className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-2">Title</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-[var(--r)] px-3 py-2 text-[14px] font-[family-name:var(--font-body)] font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--border-active)] transition-colors duration-150"
              />
            </div>
            {editedTags.length > 0 && (
              <div className="px-[22px] pt-4 pb-4 border-b border-[var(--border)]">
                <label className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {editedTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-full font-[family-name:var(--font-mono)] text-[10.5px] text-[var(--text-secondary)]">
                      {tag}
                      <button type="button" onClick={() => setEditedTags((prev) => prev.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`} className="text-[var(--text-faint)] cursor-pointer hover:text-[var(--text-secondary)] transition-colors duration-100 leading-none">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="px-[22px] pt-4 pb-4 border-b border-[var(--border)]">
              <label className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-3">
                Pipeline &middot; {suggestion.steps.length} {suggestion.steps.length === 1 ? 'step' : 'steps'}
              </label>
              <div className="flex flex-col gap-2">
                {suggestion.steps.map((step, i) => (
                  <StepPreviewCard key={i} step={step} index={i} />
                ))}
              </div>
            </div>
            <div className="px-[22px] py-4 flex flex-col gap-2.5">
              {showConfirm ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[13px] text-[var(--text-secondary)] font-[family-name:var(--font-body)] text-center leading-relaxed">
                    Please check that the prompts and structure are working as you want.
                  </p>
                  <button type="button" onClick={handleCreateFromSuggestion} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--accent)] text-[#111110] rounded-[var(--r)] text-[13.5px] font-semibold font-[family-name:var(--font-body)] cursor-pointer hover:brightness-110 transition-all duration-150">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Looks good — create it
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowConfirm(true)} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--accent)] text-[#111110] rounded-[var(--r)] text-[13.5px] font-semibold font-[family-name:var(--font-body)] cursor-pointer hover:brightness-110 transition-all duration-150">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l6 5-6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Move on next
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* AI ERROR SCREEN                                                */}
        {/* ============================================================= */}
        {screen === 'ai-error' && (
          <div className="flex flex-col items-center justify-center gap-5 px-[22px] py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--red-muted)] border border-[var(--red)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 6v5M10 14h.01" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </div>
            <div>
              <p className="font-[family-name:var(--font-body)] text-[14px] text-[var(--text)] mb-1.5">Couldn&apos;t generate a suggestion</p>
              <p className="text-[12px] text-[var(--text-muted)] font-light leading-relaxed max-w-[340px]">{errorMessage}</p>
            </div>
            <div className="flex flex-col items-center gap-2.5 w-full max-w-[280px]">
              <button type="button" onClick={() => setScreen('ai-input')} className="w-full px-5 py-2.5 bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-[var(--r)] text-[13px] font-[family-name:var(--font-body)] cursor-pointer hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition-all duration-150">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* PIPES SCREEN                                                   */}
        {/* ============================================================= */}
        {screen === 'pipes' && (
          <div className="p-4 grid grid-cols-2 gap-2.5">
            {STARTER_PIPES.map((pipe) => {
              const nodeTypes: string[] = []
              for (const step of pipe.steps) {
                for (const thread of step.threads) {
                  if (!nodeTypes.includes(thread.nodeType)) nodeTypes.push(thread.nodeType)
                }
              }
              return (
                <button
                  key={pipe.id}
                  type="button"
                  onClick={() => handleSelectPipe(pipe.id)}
                  className="flex flex-col gap-2.5 p-4 rounded-[var(--r)] text-left cursor-pointer transition-all duration-[120ms] border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13.5px] font-semibold leading-snug">{pipe.name}</span>
                    <span className="shrink-0 mt-px font-[family-name:var(--font-mono)] text-[10.5px] text-[var(--text-muted)]">
                      {pipe.steps.length} step{pipe.steps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[var(--text-secondary)] leading-[1.45] font-light">{pipe.description}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {nodeTypes.map((ntId) => {
                      const nt = getNodeType(ntId)
                      if (!nt) return null
                      return (
                        <span key={ntId} className="inline-flex items-center justify-center w-5 h-5 rounded font-[family-name:var(--font-mono)] text-[10px] font-bold" style={{ background: nt.colorMuted, color: nt.color }} title={nt.label}>
                          {nt.letter}
                        </span>
                      )
                    })}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
