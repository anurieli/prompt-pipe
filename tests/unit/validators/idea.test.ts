import {
  CreateIdeaSchema,
  UpdateIdeaSchema,
  IdeaStatusSchema,
} from '@/lib/validators/idea'

describe('Idea validators', () => {
  describe('CreateIdeaSchema', () => {
    it('valid input passes', () => {
      const result = CreateIdeaSchema.safeParse({
        title: 'My Idea',
        prompt: 'Write a poem about cats',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('My Idea')
        expect(result.data.prompt).toBe('Write a poem about cats')
      }
    })

    it('empty title fails', () => {
      const result = CreateIdeaSchema.safeParse({
        title: '',
        prompt: 'Some prompt',
      })
      expect(result.success).toBe(false)
    })

    it('empty prompt fails', () => {
      const result = CreateIdeaSchema.safeParse({
        title: 'Valid Title',
        prompt: '',
      })
      expect(result.success).toBe(false)
    })

    it('title too long fails', () => {
      const result = CreateIdeaSchema.safeParse({
        title: 'a'.repeat(201),
        prompt: 'Some prompt',
      })
      expect(result.success).toBe(false)
    })

    it('title at max length passes', () => {
      const result = CreateIdeaSchema.safeParse({
        title: 'a'.repeat(200),
        prompt: 'Some prompt',
      })
      expect(result.success).toBe(true)
    })

    it('tags are optional', () => {
      const withoutTags = CreateIdeaSchema.safeParse({
        title: 'Title',
        prompt: 'Prompt',
      })
      expect(withoutTags.success).toBe(true)
      if (withoutTags.success) {
        expect(withoutTags.data.tags).toBeUndefined()
      }

      const withTags = CreateIdeaSchema.safeParse({
        title: 'Title',
        prompt: 'Prompt',
        tags: ['ai', 'writing'],
      })
      expect(withTags.success).toBe(true)
      if (withTags.success) {
        expect(withTags.data.tags).toEqual(['ai', 'writing'])
      }
    })
  })

  describe('UpdateIdeaSchema', () => {
    it('all optional fields work', () => {
      const emptyResult = UpdateIdeaSchema.safeParse({})
      expect(emptyResult.success).toBe(true)

      const fullResult = UpdateIdeaSchema.safeParse({
        title: 'Updated Title',
        prompt: 'Updated prompt',
        tags: ['new-tag'],
        status: 'running',
      })
      expect(fullResult.success).toBe(true)
      if (fullResult.success) {
        expect(fullResult.data.title).toBe('Updated Title')
        expect(fullResult.data.status).toBe('running')
      }
    })

    it('invalid status fails', () => {
      const result = UpdateIdeaSchema.safeParse({
        status: 'unknown',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('IdeaStatusSchema', () => {
    const validStatuses = ['draft', 'queued', 'running', 'paused', 'done', 'failed'] as const

    it('all 6 valid statuses pass', () => {
      for (const status of validStatuses) {
        const result = IdeaStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      }
    })

    it('invalid status fails', () => {
      const result = IdeaStatusSchema.safeParse('cancelled')
      expect(result.success).toBe(false)
    })
  })
})
