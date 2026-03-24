export type OutputMedia =
  | { type: 'text'; content: string }
  | { type: 'image'; url: string; alt?: string; format: 'png' | 'jpg' | 'webp' }
  | { type: 'images'; items: Array<{ url: string; alt?: string; format: 'png' | 'jpg' | 'webp' }> }
  | { type: 'mixed'; items: OutputMedia[] }
