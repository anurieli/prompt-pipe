'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUIStore } from '@/stores/ui-store'
import { SeedBoxInner } from '@/components/seed/seed-box-inner'
import type { Id } from '../../../convex/_generated/dataModel'

export function SeedBox() {
  const activeIdeaId = useUIStore((s) => s.activeIdeaId)
  const idea = useQuery(
    api.ideas.queries.get,
    activeIdeaId ? { id: activeIdeaId as Id<'ideas'> } : 'skip',
  )

  if (!idea) return null

  // Key forces full remount when switching ideas
  return <SeedBoxInner key={idea._id} idea={idea} />
}
