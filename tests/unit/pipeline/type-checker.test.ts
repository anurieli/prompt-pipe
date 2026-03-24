import {
  checkTypeCompatibility,
  validatePipeline,
} from '@/lib/pipeline/type-checker'

describe('checkTypeCompatibility', () => {
  it('text -> text passes without warning', () => {
    const result = checkTypeCompatibility('text', 'llm')
    expect(result.compatible).toBe(true)
    expect(result.warning).toBeUndefined()
  })

  it('text -> image passes without warning', () => {
    const result = checkTypeCompatibility('text', 'image-gen')
    expect(result.compatible).toBe(true)
    expect(result.warning).toBeUndefined()
  })

  it('image -> text-only LLM warns', () => {
    const result = checkTypeCompatibility('image', 'llm')
    expect(result.compatible).toBe(true)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain('Image output')
  })

  it('mixed -> text passes without warning', () => {
    const result = checkTypeCompatibility('mixed', 'llm')
    expect(result.compatible).toBe(true)
    expect(result.warning).toBeUndefined()
  })

  it('text -> webhook passes without warning', () => {
    const result = checkTypeCompatibility('text', 'webhook')
    expect(result.compatible).toBe(true)
    expect(result.warning).toBeUndefined()
  })

  it('image -> image passes without warning', () => {
    const result = checkTypeCompatibility('image', 'image-gen')
    expect(result.compatible).toBe(true)
    expect(result.warning).toBeUndefined()
  })
})

describe('validatePipeline', () => {
  it('returns empty for a single-step pipeline', () => {
    const results = validatePipeline([
      { stepIndex: 0, threads: [{ nodeType: 'llm', config: { responseType: 'text' } }] },
    ])
    expect(results).toHaveLength(0)
  })

  it('returns empty for text -> text transitions', () => {
    const results = validatePipeline([
      { stepIndex: 0, threads: [{ nodeType: 'llm', config: { responseType: 'text' } }] },
      { stepIndex: 1, threads: [{ nodeType: 'llm', config: { responseType: 'text' } }] },
    ])
    expect(results).toHaveLength(0)
  })

  it('warns for image -> text-only LLM transition', () => {
    const results = validatePipeline([
      { stepIndex: 0, threads: [{ nodeType: 'image-gen', config: { responseType: 'image' } }] },
      { stepIndex: 1, threads: [{ nodeType: 'llm', config: { responseType: 'text' } }] },
    ])
    expect(results).toHaveLength(1)
    expect(results[0].fromStepIndex).toBe(0)
    expect(results[0].toStepIndex).toBe(1)
    expect(results[0].result.warning).toBeDefined()
  })

  it('handles steps with no threads', () => {
    const results = validatePipeline([
      { stepIndex: 0, threads: [] },
      { stepIndex: 1, threads: [{ nodeType: 'llm', config: { responseType: 'text' } }] },
    ])
    expect(results).toHaveLength(0)
  })

  it('defaults to text when responseType is not set', () => {
    const results = validatePipeline([
      { stepIndex: 0, threads: [{ nodeType: 'llm', config: {} }] },
      { stepIndex: 1, threads: [{ nodeType: 'llm', config: {} }] },
    ])
    expect(results).toHaveLength(0)
  })
})
