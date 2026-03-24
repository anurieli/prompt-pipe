'use client'

import { useState } from 'react'

const steps = [
  {
    number: 1,
    title: 'What is OpenRouter?',
    description:
      'OpenRouter is a unified API gateway that gives you access to hundreds of AI models — Claude, GPT, Llama, Mistral, and more — through a single API key. PromptPipe uses it so you can route prompts to any model without managing multiple provider accounts.',
  },
  {
    number: 2,
    title: 'Get your API key',
    description:
      'Sign up or log in at openrouter.ai, navigate to your dashboard, and create an API key. You only need one key to access all available models.',
    link: 'https://openrouter.ai/keys',
  },
  {
    number: 3,
    title: 'Paste below',
    description:
      'Copy your API key and paste it into the API Configuration section below. Hit "Test Connection" to verify it works, then you\'re ready to build pipelines.',
  },
] as const

export function OnboardingCard() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} getting started guide`}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--surface-2)] transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--accent-muted)] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1v14M1 8h14"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-display)] text-base text-[var(--text)]">
            Getting Started
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="px-5 pb-5 pt-1">
          <div className="flex flex-col gap-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                {/* Step indicator */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full border border-[var(--accent)] bg-[var(--accent-muted)] flex items-center justify-center">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--accent)] font-semibold">
                      {step.number}
                    </span>
                  </div>
                  {step.number < steps.length && (
                    <div className="w-px flex-1 bg-[var(--border-strong)] mt-2" />
                  )}
                </div>

                {/* Step content */}
                <div className="pb-4">
                  <h3 className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--text)] mb-1">
                    {step.title}
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                  {'link' in step && step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 font-[family-name:var(--font-mono)] text-[11px] text-[var(--accent)] hover:text-[#f5d06a] transition-colors duration-150"
                    >
                      openrouter.ai/keys
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M6 3h7v7M13 3L5 11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
