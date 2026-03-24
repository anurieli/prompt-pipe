export type OutputFormatTemplate = {
  id: string
  label: string
  description: string
  instruction: string
}

export const OUTPUT_FORMATS: OutputFormatTemplate[] = [
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Formatted markdown with headers, lists, and emphasis',
    instruction: 'Respond in well-structured Markdown format.',
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'Structured JSON output',
    instruction: 'Respond with valid JSON only. No markdown, no explanation.',
  },
  {
    id: 'bullets',
    label: 'Bullet Points',
    description: 'Concise bullet-point list',
    instruction: 'Respond as a concise bullet-point list. One point per line, starting with a dash.',
  },
  {
    id: 'plain',
    label: 'Plain Text',
    description: 'Unformatted plain text',
    instruction: 'Respond in plain text without any formatting or markup.',
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Code output only',
    instruction: 'Respond with code only. No explanations, no markdown fences.',
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Markdown table format',
    instruction: 'Respond as a Markdown table with appropriate columns and rows.',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Write your own output format instructions',
    instruction: '',
  },
] as const
