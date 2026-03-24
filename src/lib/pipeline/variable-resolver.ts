import type { OutputMedia } from '@/types/output-media'
import { logWarn } from '@/lib/logging/logger'

export type VariableContext = {
  seed: string
  input: string
  ideaTitle: string
  ideaTags: string[]
  stepOutputs: Map<number, OutputMedia>
  threadOutputs: Map<string, OutputMedia>
}

/**
 * Extract text content from an OutputMedia value.
 * Returns the text content for text types, or a placeholder for non-text types.
 */
function extractText(media: OutputMedia): string {
  switch (media.type) {
    case 'text':
      return media.content
    case 'image':
    case 'images':
      return '[non-text output]'
    case 'mixed': {
      const textParts = media.items
        .map((item) => extractText(item))
        .filter((t) => t !== '[non-text output]')
      return textParts.length > 0 ? textParts.join('\n') : '[non-text output]'
    }
  }
}

/**
 * Resolve template variables in a string using the provided context.
 *
 * Supported variables:
 * - {{input}} — input to the current step
 * - {{seed}} — original seed prompt
 * - {{idea.title}} — idea title
 * - {{idea.tags}} — comma-separated tags
 * - {{step.N.output}} — output text of step N (0-indexed)
 * - {{step.N.thread.M.output}} — output of thread M in step N
 *
 * Unresolved variables are left as-is with a warning logged.
 */
export function resolveVariables(template: string, context: VariableContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, variable: string) => {
    const trimmed = variable.trim()

    if (trimmed === 'input') {
      return context.input
    }

    if (trimmed === 'seed') {
      return context.seed
    }

    if (trimmed === 'idea.title') {
      return context.ideaTitle
    }

    if (trimmed === 'idea.tags') {
      return context.ideaTags.join(', ')
    }

    // {{step.N.thread.M.output}}
    const threadMatch = trimmed.match(/^step\.(\d+)\.thread\.(\d+)\.output$/)
    if (threadMatch) {
      const stepIndex = parseInt(threadMatch[1], 10)
      const threadIndex = parseInt(threadMatch[2], 10)
      const key = `${stepIndex}:${threadIndex}`
      const media = context.threadOutputs.get(key)
      if (media) {
        return extractText(media)
      }
      logWarn('variable', 'variable.unresolved', `Unresolved variable: {{${trimmed}}}`, {
        data: { variable: trimmed },
      })
      return `{{${trimmed}}}`
    }

    // {{step.N.output}}
    const stepMatch = trimmed.match(/^step\.(\d+)\.output$/)
    if (stepMatch) {
      const stepIndex = parseInt(stepMatch[1], 10)
      const media = context.stepOutputs.get(stepIndex)
      if (media) {
        return extractText(media)
      }
      logWarn('variable', 'variable.unresolved', `Unresolved variable: {{${trimmed}}}`, {
        data: { variable: trimmed },
      })
      return `{{${trimmed}}}`
    }

    // Unknown variable — leave as-is and log warning
    logWarn('variable', 'variable.unresolved', `Unresolved variable: {{${trimmed}}}`, {
      data: { variable: trimmed },
    })
    return `{{${trimmed}}}`
  })
}
