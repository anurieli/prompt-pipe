'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useUIStore } from '@/stores/ui-store'
import { QueueItem } from '@/components/queue/queue-item'
import { Button } from '@/components/shared/button'
import { Tooltip } from '@/components/shared/tooltip'
import { NewIdeaModal, type CreateFromPipeData } from '@/components/modals/new-idea-modal'
import { getDefaultModel } from '@/config/model-catalog'

export function QueueList() {
  const ideas = useQuery(api.ideas.queries.list, { includeArchived: true })
  const settings = useQuery(api.settings.queries.getSettings)
  const activeIdeaId = useUIStore((s) => s.activeIdeaId)
  const setActiveIdea = useUIStore((s) => s.setActiveIdea)
  const createIdea = useMutation(api.ideas.mutations.create)
  const createFromPipe = useMutation(api.ideas.mutations.createFromPipe)
  const archiveIdea = useMutation(api.ideas.mutations.archive)
  const removeIdea = useMutation(api.ideas.mutations.remove)
  const duplicateIdea = useMutation(api.ideas.mutations.duplicate)

  const newIdeaModal = useUIStore((s) => s.newIdeaModal)
  const openNewIdeaModal = useUIStore((s) => s.openNewIdeaModal)
  const closeNewIdeaModal = useUIStore((s) => s.closeNewIdeaModal)

  const [showArchive, setShowArchive] = useState(false)

  const ideaList = ideas ?? []

  const archivedCount = useMemo(() => {
    return ideaList.filter((i) => i.status === 'archived').length
  }, [ideaList])

  const filteredIdeas = useMemo(() => {
    if (showArchive) {
      return ideaList.filter((i) => i.status === 'archived')
    }
    return ideaList.filter((i) => i.status !== 'archived')
  }, [ideaList, showArchive])

  const handleNewIdea = useCallback(() => {
    openNewIdeaModal('open')
  }, [openNewIdeaModal])

  const handleCreateFromPipe = useCallback(
    async (data: CreateFromPipeData) => {
      const defaultModel = (settings?.default_text_model as string | undefined) ?? getDefaultModel()
      try {
        const id = await createFromPipe({
          title: data.title,
          prompt: data.prompt,
          tags: data.tags,
          defaultModel,
          steps: data.steps.map((step) => ({
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
        setActiveIdea(id)
      } catch {
        // Structured logging would go here in production
      }
    },
    [createFromPipe, setActiveIdea, settings],
  )

  const handleStartFromScratch = useCallback(async () => {
    try {
      const id = await createIdea({
        title: 'Untitled idea',
        prompt: '',
      })
      setActiveIdea(id)
      closeNewIdeaModal()
    } catch {
      // Structured logging would go here in production
    }
  }, [createIdea, setActiveIdea, closeNewIdeaModal])

  const handleArchive = useCallback(
    (id: string) => {
      archiveIdea({ id: id as Id<'ideas'> })
    },
    [archiveIdea],
  )

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this idea and all its pipeline data? This cannot be undone.')) return
      removeIdea({ id: id as Id<'ideas'> })
      if (activeIdeaId === id) {
        setActiveIdea(null)
      }
    },
    [removeIdea, activeIdeaId, setActiveIdea],
  )

  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        const newId = await duplicateIdea({ id: id as Id<'ideas'> })
        setActiveIdea(newId)
      } catch {
        // Structured logging would go here in production
      }
    },
    [duplicateIdea, setActiveIdea],
  )

  return (
    <div className="flex flex-col h-full">
      {/* New Idea Button */}
      <div className="px-2 pt-4 pb-2">
        <Tooltip content="Create a new prompt idea" side="right" shortcut={'\u2318N'}>
          <Button
            variant="accent"
            size="md"
            className="w-full justify-center"
            onClick={handleNewIdea}
          >
            + New Idea
          </Button>
        </Tooltip>
      </div>

      {/* Scrollable list */}
      <div role="list" aria-label="Ideas queue" className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredIdeas.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="font-[family-name:var(--font-display)] text-sm text-[var(--text-muted)] italic">
              {showArchive ? 'No archived ideas.' : 'No ideas yet. Drop one in.'}
            </p>
          </div>
        ) : (
          filteredIdeas.map((idea) => (
            <QueueItem
              key={idea._id}
              idea={idea}
              isActive={idea._id === activeIdeaId}
              onClick={() => setActiveIdea(idea._id)}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))
        )}
      </div>

      {/* Archive toggle at bottom */}
      {archivedCount > 0 ? (
        <div className="px-3 py-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setShowArchive((prev) => !prev)}
            className={[
              'flex items-center gap-1.5 w-full px-2 py-1.5 rounded-[4px] transition-all duration-150',
              'font-[family-name:var(--font-mono)] text-[10px] tracking-[0.08em]',
              showArchive
                ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                : 'text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface)]',
            ].join(' ')}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4h12v1H2V4zM3 6v7a1 1 0 001 1h8a1 1 0 001-1V6M6.5 8.5h3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            Archive {archivedCount}
          </button>
        </div>
      ) : null}

      {/* New Idea Modal */}
      <NewIdeaModal
        open={newIdeaModal === 'open'}
        onClose={closeNewIdeaModal}
        onCreateFromPipe={handleCreateFromPipe}
        onStartFromScratch={handleStartFromScratch}
      />
    </div>
  )
}
