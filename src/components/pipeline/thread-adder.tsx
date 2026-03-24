'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { CORE_NODE_TYPES } from '@/config/providers'
import type { Id } from '../../../convex/_generated/dataModel'

type ThreadAdderProps = {
  stepId: string
}

export function ThreadAdder({ stepId }: ThreadAdderProps) {
  const [adding, setAdding] = useState(false)
  const createThread = useMutation(api.threads.mutations.create)

  async function handleAdd() {
    if (adding) return
    setAdding(true)

    try {
      const defaultNodeType = CORE_NODE_TYPES[0]

      await createThread({
        stepId: stepId as Id<'pipelineSteps'>,
        threadIndex: 0,
        name: `${defaultNodeType.label} Thread`,
        provider: defaultNodeType.defaultProvider,
        nodeType: defaultNodeType.id,
        promptTemplate: '{{input}}',
        config: {
          temperature: defaultNodeType.defaults.temperature,
        },
      })
    } catch {
      // Silently handle error — user can retry
    } finally {
      setAdding(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={adding}
      className="
        w-full py-2 px-3
        border border-dashed border-[var(--border)]
        rounded-[var(--r)]
        bg-transparent
        text-[var(--text-faint)] text-[11px]
        font-[family-name:var(--font-mono)]
        cursor-pointer
        transition-all duration-150
        hover:border-[var(--border-strong)] hover:text-[var(--text-muted)] hover:bg-[var(--surface)]
        disabled:opacity-40 disabled:cursor-not-allowed
      "
    >
      {adding ? 'Adding...' : '+ Add Thread'}
    </button>
  )
}
