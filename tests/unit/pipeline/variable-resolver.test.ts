import { vi } from 'vitest'

vi.mock('@/lib/db/queries/logs', () => ({
  insertLog: vi.fn(),
}))

import { resolveVariables, type VariableContext } from '@/lib/pipeline/variable-resolver'
import type { OutputMedia } from '@/types/output-media'

function makeContext(overrides?: Partial<VariableContext>): VariableContext {
  return {
    seed: 'Write a poem about the ocean',
    input: 'The ocean is vast and blue',
    ideaTitle: 'Ocean Poem',
    ideaTags: ['creative', 'writing'],
    stepOutputs: new Map<number, OutputMedia>(),
    threadOutputs: new Map<string, OutputMedia>(),
    ...overrides,
  }
}

describe('resolveVariables', () => {
  it('resolves {{input}} correctly', () => {
    const ctx = makeContext({ input: 'Hello world' })
    const result = resolveVariables('Process this: {{input}}', ctx)
    expect(result).toBe('Process this: Hello world')
  })

  it('resolves {{seed}} correctly', () => {
    const ctx = makeContext({ seed: 'My original prompt' })
    const result = resolveVariables('Seed was: {{seed}}', ctx)
    expect(result).toBe('Seed was: My original prompt')
  })

  it('resolves {{idea.title}} correctly', () => {
    const ctx = makeContext({ ideaTitle: 'My Idea' })
    const result = resolveVariables('Title: {{idea.title}}', ctx)
    expect(result).toBe('Title: My Idea')
  })

  it('resolves {{idea.tags}} as comma-separated', () => {
    const ctx = makeContext({ ideaTags: ['tag1', 'tag2', 'tag3'] })
    const result = resolveVariables('Tags: {{idea.tags}}', ctx)
    expect(result).toBe('Tags: tag1, tag2, tag3')
  })

  it('resolves {{step.N.output}} correctly', () => {
    const stepOutputs = new Map<number, OutputMedia>()
    stepOutputs.set(0, { type: 'text', content: 'Step zero output' })
    const ctx = makeContext({ stepOutputs })

    const result = resolveVariables('Previous: {{step.0.output}}', ctx)
    expect(result).toBe('Previous: Step zero output')
  })

  it('resolves {{step.N.thread.M.output}} correctly', () => {
    const threadOutputs = new Map<string, OutputMedia>()
    threadOutputs.set('1:2', { type: 'text', content: 'Thread output here' })
    const ctx = makeContext({ threadOutputs })

    const result = resolveVariables('Thread result: {{step.1.thread.2.output}}', ctx)
    expect(result).toBe('Thread result: Thread output here')
  })

  it('returns [non-text output] for image outputs', () => {
    const stepOutputs = new Map<number, OutputMedia>()
    stepOutputs.set(0, { type: 'image', url: 'https://example.com/img.png', format: 'png' })
    const ctx = makeContext({ stepOutputs })

    const result = resolveVariables('Image: {{step.0.output}}', ctx)
    expect(result).toBe('Image: [non-text output]')
  })

  it('extracts text from mixed outputs', () => {
    const stepOutputs = new Map<number, OutputMedia>()
    stepOutputs.set(0, {
      type: 'mixed',
      items: [
        { type: 'text', content: 'Some text' },
        { type: 'image', url: 'https://example.com/img.png', format: 'png' },
      ],
    })
    const ctx = makeContext({ stepOutputs })

    const result = resolveVariables('Mixed: {{step.0.output}}', ctx)
    expect(result).toBe('Mixed: Some text')
  })

  it('leaves unresolved variables as-is', () => {
    const ctx = makeContext()
    const result = resolveVariables('Unknown: {{foo.bar}}', ctx)
    expect(result).toBe('Unknown: {{foo.bar}}')
  })

  it('leaves unresolved step output variables as-is', () => {
    const ctx = makeContext()
    const result = resolveVariables('Missing: {{step.5.output}}', ctx)
    expect(result).toBe('Missing: {{step.5.output}}')
  })

  it('leaves unresolved thread output variables as-is', () => {
    const ctx = makeContext()
    const result = resolveVariables('Missing: {{step.3.thread.1.output}}', ctx)
    expect(result).toBe('Missing: {{step.3.thread.1.output}}')
  })

  it('resolves multiple variables in one template', () => {
    const stepOutputs = new Map<number, OutputMedia>()
    stepOutputs.set(0, { type: 'text', content: 'first output' })
    const ctx = makeContext({
      seed: 'original seed',
      input: 'current input',
      ideaTitle: 'Test Idea',
      ideaTags: ['alpha', 'beta'],
      stepOutputs,
    })

    const template =
      'Seed: {{seed}}, Input: {{input}}, Title: {{idea.title}}, Tags: {{idea.tags}}, Step0: {{step.0.output}}'
    const result = resolveVariables(template, ctx)
    expect(result).toBe(
      'Seed: original seed, Input: current input, Title: Test Idea, Tags: alpha, beta, Step0: first output',
    )
  })

  it('handles template with no variables', () => {
    const ctx = makeContext()
    const result = resolveVariables('No variables here', ctx)
    expect(result).toBe('No variables here')
  })

  it('handles empty template', () => {
    const ctx = makeContext()
    const result = resolveVariables('', ctx)
    expect(result).toBe('')
  })

  it('handles variables with whitespace', () => {
    const ctx = makeContext({ input: 'test' })
    const result = resolveVariables('{{ input }}', ctx)
    expect(result).toBe('test')
  })
})
