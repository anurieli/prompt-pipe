import type { OutputMedia } from '../../../src/types/output-media'

type ExecuteParams = {
  prompt: string
  model: string
  outputFormat?: string
  responseType: 'text' | 'image'
}

type ExecuteResult = {
  output: OutputMedia
  costUsd: number
  durationMs: number
}

export function createWebhookAdapter(url: string, method: 'GET' | 'POST' = 'POST') {
  async function execute(params: ExecuteParams): Promise<ExecuteResult> {
    const startTime = Date.now()

    const body = JSON.stringify({
      prompt: params.prompt,
      model: params.model,
      outputFormat: params.outputFormat,
    })

    const requestInit: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }

    if (method === 'POST') {
      requestInit.body = body
    }

    const response = await fetch(url, requestInit)

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}: ${response.statusText}`)
    }

    const responseText = await response.text()
    const output: OutputMedia = { type: 'text', content: responseText }

    return {
      output,
      costUsd: 0,
      durationMs: Date.now() - startTime,
    }
  }

  return { execute }
}
