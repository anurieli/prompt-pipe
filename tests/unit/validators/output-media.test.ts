import {
  OutputMediaTextSchema,
  OutputMediaImageSchema,
  OutputMediaImagesSchema,
  OutputMediaSchema,
  ImageFormatSchema,
} from '@/lib/validators/output-media'

describe('OutputMedia validators', () => {
  describe('OutputMediaTextSchema', () => {
    it('valid text media passes', () => {
      const result = OutputMediaTextSchema.safeParse({
        type: 'text',
        content: 'Hello world',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('OutputMediaImageSchema', () => {
    it('valid image media passes with png format', () => {
      const result = OutputMediaImageSchema.safeParse({
        type: 'image',
        url: 'https://example.com/image.png',
        format: 'png',
      })
      expect(result.success).toBe(true)
    })

    it('valid image media passes with jpg format', () => {
      const result = OutputMediaImageSchema.safeParse({
        type: 'image',
        url: 'https://example.com/image.jpg',
        format: 'jpg',
      })
      expect(result.success).toBe(true)
    })

    it('valid image media passes with webp format', () => {
      const result = OutputMediaImageSchema.safeParse({
        type: 'image',
        url: 'https://example.com/image.webp',
        format: 'webp',
      })
      expect(result.success).toBe(true)
    })

    it('valid image media passes with optional alt text', () => {
      const result = OutputMediaImageSchema.safeParse({
        type: 'image',
        url: 'https://example.com/image.png',
        alt: 'A nice image',
        format: 'png',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.alt).toBe('A nice image')
      }
    })
  })

  describe('OutputMediaImagesSchema', () => {
    it('valid images media passes', () => {
      const result = OutputMediaImagesSchema.safeParse({
        type: 'images',
        items: [
          { url: 'https://example.com/a.png', format: 'png' },
          { url: 'https://example.com/b.jpg', alt: 'photo', format: 'jpg' },
        ],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.items).toHaveLength(2)
      }
    })
  })

  describe('OutputMediaSchema (union)', () => {
    it('valid mixed media passes with nested items', () => {
      const result = OutputMediaSchema.safeParse({
        type: 'mixed',
        items: [
          { type: 'text', content: 'Hello' },
          { type: 'image', url: 'https://example.com/img.png', format: 'png' },
          {
            type: 'mixed',
            items: [
              { type: 'text', content: 'Nested text' },
            ],
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('invalid type fails', () => {
      const result = OutputMediaSchema.safeParse({
        type: 'video',
        content: 'test',
      })
      expect(result.success).toBe(false)
    })

    it('missing required fields fail for text', () => {
      const result = OutputMediaTextSchema.safeParse({
        type: 'text',
        // missing content
      })
      expect(result.success).toBe(false)
    })

    it('missing required fields fail for image', () => {
      const result = OutputMediaImageSchema.safeParse({
        type: 'image',
        // missing url and format
      })
      expect(result.success).toBe(false)
    })

    it('missing required fields fail for images', () => {
      const result = OutputMediaImagesSchema.safeParse({
        type: 'images',
        // missing items
      })
      expect(result.success).toBe(false)
    })
  })

  describe('ImageFormatSchema', () => {
    it('invalid image format fails', () => {
      const result = ImageFormatSchema.safeParse('gif')
      expect(result.success).toBe(false)
    })

    it('valid formats pass', () => {
      expect(ImageFormatSchema.safeParse('png').success).toBe(true)
      expect(ImageFormatSchema.safeParse('jpg').success).toBe(true)
      expect(ImageFormatSchema.safeParse('webp').success).toBe(true)
    })
  })
})
