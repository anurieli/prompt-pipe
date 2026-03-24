'use client'

import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Tag } from '@/components/shared/tag'
import { useUIStore } from '@/stores/ui-store'

type SeedBoxInnerProps = {
  idea: Doc<'ideas'>
}

export function SeedBoxInner({ idea }: SeedBoxInnerProps) {
  const updateIdea = useMutation(api.ideas.mutations.update)
  const selectedStepId = useUIStore((s) => s.selectedStepId)

  const [title, setTitle] = useState(idea.title)
  const [prompt, setPrompt] = useState(idea.prompt)
  const [tagInput, setTagInput] = useState('')
  const [manuallyExpanded, setManuallyExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const tags = idea.tags

  // Auto-collapse when a step is selected, unless manually expanded
  const isCollapsed = selectedStepId !== null && !manuallyExpanded

  const saveField = useCallback(
    async (field: 'title' | 'prompt', value: string) => {
      if (idea[field] === value) return
      try {
        await updateIdea({ id: idea._id, [field]: value })
      } catch {
        // Structured logging in production
      }
    },
    [idea, updateIdea],
  )

  const addTag = useCallback(
    async (tag: string) => {
      const trimmed = tag.trim().toLowerCase()
      if (!trimmed || tags.includes(trimmed)) return
      const newTags = [...tags, trimmed]
      try {
        await updateIdea({ id: idea._id, tags: newTags })
      } catch {
        // Structured logging in production
      }
    },
    [idea._id, tags, updateIdea],
  )

  const removeTag = useCallback(
    async (tag: string) => {
      const newTags = tags.filter((t) => t !== tag)
      try {
        await updateIdea({ id: idea._id, tags: newTags })
      } catch {
        // Structured logging in production
      }
    },
    [idea._id, tags, updateIdea],
  )

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      void addTag(tagInput)
      setTagInput('')
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      void removeTag(tags[tags.length - 1])
    }
  }

  const handleExpandClick = () => {
    setManuallyExpanded(true)
  }

  const handleCollapseClick = () => {
    setManuallyExpanded(false)
  }

  return (
    <div className="shrink-0 border-b border-[var(--border)]">
      {/* Idea Header — always visible */}
      <div className="px-8 pt-5 pb-3 bg-[var(--bg)]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void saveField('title', title)}
            placeholder="Name your idea..."
            spellCheck={false}
            aria-label="Idea title"
            className="flex-1 bg-transparent border-none outline-none font-[family-name:var(--font-display)] text-xl text-[var(--text)] tracking-[-0.01em] placeholder:text-[var(--text-faint)]"
          />
          {isCollapsed && (
            <button
              type="button"
              onClick={handleExpandClick}
              className="
                font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)]
                uppercase tracking-[0.06em]
                hover:text-[var(--text-muted)] cursor-pointer
                transition-colors duration-150
                shrink-0
              "
            >
              show seed
            </button>
          )}
          {!isCollapsed && selectedStepId !== null && (
            <button
              type="button"
              onClick={handleCollapseClick}
              className="
                font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-faint)]
                uppercase tracking-[0.06em]
                hover:text-[var(--text-muted)] cursor-pointer
                transition-colors duration-150
                shrink-0
              "
            >
              collapse
            </button>
          )}
        </div>

        {/* Tags — always visible */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {tags.map((tag) => (
            <Tag key={tag} label={tag} onRemove={() => void removeTag(tag)} />
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length === 0 ? 'Add tags...' : '+'}
            aria-label="Add tags"
            className="bg-transparent border-none outline-none font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)] placeholder:text-[var(--text-faint)] w-16 min-w-0"
          />
        </div>
      </div>

      {/* Seed Prompt Box — collapsible */}
      {!isCollapsed && (
        <div className="px-8 pb-5 pt-2">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] overflow-hidden transition-colors focus-within:border-[var(--border-active)]">
            {/* Seed box header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] flex items-center gap-2">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="opacity-60"
                >
                  <circle cx="6" cy="6" r="2" fill="var(--accent)" />
                  <circle cx="6" cy="6" r="5" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.3" />
                </svg>
                Seed Prompt
              </span>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={() => void saveField('prompt', prompt)}
              placeholder="Dump anything here -- a sentence, a paragraph, half a thought. The pipeline transforms it step by step."
              spellCheck={false}
              aria-label="Seed prompt"
              className="w-full bg-transparent border-none outline-none text-[var(--text)] font-[family-name:var(--font-body)] text-sm leading-[1.7] px-4 py-3 resize-none min-h-[56px] font-light placeholder:text-[var(--text-faint)]"
              rows={3}
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border)]">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)]">
                {prompt.length} chars
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-faint)]">
                seed &rarr; step 1
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
