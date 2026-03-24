import type { OutputMedia } from '../../src/types/output-media'

export type InputSource =
  | { type: 'seed' }
  | { type: 'step'; stepIndex: number }
  | { type: 'thread'; stepIndex: number; threadIndex: number }

export type VariableContext = {
  seed: string
  input: string
  ideaTitle: string
  ideaTags: string[]
  stepOutputs: Map<number, OutputMedia>
  threadOutputs: Map<string, OutputMedia>
}

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

export function resolveVariables(template: string, context: VariableContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, variable: string) => {
    const trimmed = variable.trim()

    if (trimmed === 'input') return context.input
    if (trimmed === 'seed') return context.seed
    if (trimmed === 'idea.title') return context.ideaTitle
    if (trimmed === 'idea.tags') return context.ideaTags.join(', ')

    // {{step.N.thread.M.output}}
    const threadMatch = trimmed.match(/^step\.(\d+)\.thread\.(\d+)\.output$/)
    if (threadMatch) {
      const stepIndex = parseInt(threadMatch[1], 10)
      const threadIndex = parseInt(threadMatch[2], 10)
      const media = context.threadOutputs.get(`${stepIndex}:${threadIndex}`)
      if (media) return extractText(media)
      return `{{${trimmed}}}`
    }

    // {{step.N.output}}
    const stepMatch = trimmed.match(/^step\.(\d+)\.output$/)
    if (stepMatch) {
      const stepIndex = parseInt(stepMatch[1], 10)
      const media = context.stepOutputs.get(stepIndex)
      if (media) return extractText(media)
      return `{{${trimmed}}}`
    }

    return `{{${trimmed}}}`
  })
}

export function resolveInputSources(
  inputSources: InputSource[] | undefined,
  context: VariableContext,
): string {
  if (!inputSources || inputSources.length === 0) {
    return context.input
  }

  const parts: string[] = []
  for (const source of inputSources) {
    switch (source.type) {
      case 'seed':
        parts.push(context.seed)
        break
      case 'step': {
        const media = context.stepOutputs.get(source.stepIndex)
        if (media) parts.push(extractText(media))
        break
      }
      case 'thread': {
        const media = context.threadOutputs.get(`${source.stepIndex}:${source.threadIndex}`)
        if (media) parts.push(extractText(media))
        break
      }
    }
  }
  return parts.length > 0 ? parts.join('\n\n') : context.input
}
