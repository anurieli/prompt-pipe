import { spawn, execSync } from 'child_process'
import { logInfo, logError } from '@/lib/logging/logger'
import type { OutputMedia } from '@/types/output-media'
import type {
  ProviderAdapter,
  ExecuteParams,
  ExecuteResult,
  ConnectionTestResult,
  ModelInfo,
  CostEstimate,
  EstimateCostParams,
} from '@/types/provider'

export function createScriptAdapter(
  command: string,
  args: string[] = [],
): ProviderAdapter {
  async function execute(params: ExecuteParams): Promise<ExecuteResult> {
    const startTime = Date.now()

    return new Promise<ExecuteResult>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      child.on('error', (error: Error) => {
        const durationMs = Date.now() - startTime

        logError('provider', 'provider.execute.error', `Script spawn failed: ${error.message}`, {
          provider: 'script',
          durationMs,
          data: { command, args },
        })

        reject(new Error(`Failed to spawn script "${command}": ${error.message}`))
      })

      child.on('close', (code: number | null) => {
        const durationMs = Date.now() - startTime

        if (code !== 0) {
          const errorMessage = stderr.trim() || `Script exited with code ${code}`

          logError('provider', 'provider.execute.error', `Script exited with code ${code}: ${errorMessage}`, {
            provider: 'script',
            durationMs,
            data: { command, args, exitCode: code },
          })

          reject(new Error(`Script "${command}" failed (exit code ${code}): ${errorMessage}`))
          return
        }

        const output: OutputMedia = { type: 'text', content: stdout }

        logInfo('provider', 'provider.execute.done', `Script "${command}" completed`, {
          provider: 'script',
          durationMs,
        })

        resolve({
          output,
          costUsd: 0,
          durationMs,
          raw: { stdout, stderr, exitCode: code },
        })
      })

      // Write prompt to stdin and close it
      child.stdin.write(params.prompt)
      child.stdin.end()
    })
  }

  async function testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now()

    try {
      const lookupCommand = process.platform === 'win32' ? 'where' : 'which'
      execSync(`${lookupCommand} ${command}`, { stdio: 'pipe' })

      const responseTimeMs = Date.now() - startTime

      logInfo('provider', 'provider.test_connection.ok', `Script "${command}" found on PATH`, {
        provider: 'script',
        durationMs: responseTimeMs,
      })

      return { ok: true, responseTimeMs }
    } catch {
      const responseTimeMs = Date.now() - startTime
      const errorMessage = `Command "${command}" not found on PATH`

      logError('provider', 'provider.test_connection.error', errorMessage, {
        provider: 'script',
        durationMs: responseTimeMs,
      })

      return { ok: false, error: errorMessage, responseTimeMs }
    }
  }

  async function listModels(): Promise<ModelInfo[]> {
    return []
  }

  function estimateCost(params: EstimateCostParams): CostEstimate {
    void params
    return { estimatedCostUsd: 0, inputTokens: 0, confidence: 'exact' }
  }

  return {
    id: 'script',
    execute,
    testConnection,
    listModels,
    estimateCost,
  }
}
