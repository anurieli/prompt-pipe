'use client'

import { useState, useEffect, useCallback } from 'react'

const SECTIONS = [
  { id: 'onboarding', label: 'Getting Started' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'default-models', label: 'Default Models' },
  { id: 'execution', label: 'Execution' },
  { id: 'usage', label: 'Usage' },
  { id: 'data-management', label: 'Data' },
]

export function SettingsToc() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id)

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id)
      if (!el) continue

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveId(section.id)
            }
          }
        },
        { rootMargin: '-20% 0px -70% 0px' },
      )
      observer.observe(el)
      observers.push(observer)
    }

    return () => {
      for (const obs of observers) obs.disconnect()
    }
  }, [])

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  return (
    <nav aria-label="Settings sections" className="hidden lg:block w-[180px] shrink-0">
      <div className="sticky top-6">
        <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3 block">
          Sections
        </span>
        <ul className="flex flex-col gap-0.5">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => handleClick(section.id)}
                className={[
                  'w-full text-left px-2 py-1.5 rounded-[var(--r)] transition-all duration-150',
                  'font-[family-name:var(--font-body)] text-xs',
                  activeId === section.id
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)]',
                ].join(' ')}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
