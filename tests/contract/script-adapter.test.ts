import { vi } from 'vitest'

// Mock the logger to prevent real DB calls
vi.mock('@/lib/logging/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
}))

import { spawn, execSync } from 'child_process'
import { createScriptAdapter } from '@/lib/providers/script-adapter'
import type { ExecuteParams, EstimateCostParams } from '@/types/provider'
import { EventEmitter } from 'events'

const mockedSpawn = vi.mocked(spawn)
const mockedExecSync = vi.mocked(execSync)

function createMockChildProcess() {
  const child = new EventEmitter() as EventEmitter & {
    stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> }
    stdout: EventEmitter
    stderr: EventEmitter
  }
  child.stdin = { write: vi.fn(), end: vi.fn() }
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  return child
}

describe('Script adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('execute()', () => {
    it('spawns process and returns stdout as text output', async () => {
      const mockChild = createMockChildProcess()
      mockedSpawn.mockReturnValue(mockChild as never)

      const adapter = createScriptAdapter('echo', ['hello'])

      const params: ExecuteParams = {
        prompt: 'Input data',
        model: 'script',
        responseType: 'text',
      }

      const resultPromise = adapter.execute(params)

      // Simulate the child process producing output and exiting
      mockChild.stdout.emit('data', Buffer.from('Script output'))
      mockChild.emit('close', 0)

      const result = await resultPromise

      expect(mockedSpawn).toHaveBeenCalledWith('echo', ['hello'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      expect(mockChild.stdin.write).toHaveBeenCalledWith('Input data')
      expect(mockChild.stdin.end).toHaveBeenCalled()

      expect(result.output).toEqual({ type: 'text', content: 'Script output' })
      expect(result.costUsd).toBe(0)
      expect(typeof result.durationMs).toBe('number')
      expect(result.raw).toEqual({
        stdout: 'Script output',
        stderr: '',
        exitCode: 0,
      })
    })

    it('rejects on non-zero exit code', async () => {
      const mockChild = createMockChildProcess()
      mockedSpawn.mockReturnValue(mockChild as never)

      const adapter = createScriptAdapter('failing-script')

      const params: ExecuteParams = {
        prompt: 'Input',
        model: 'script',
        responseType: 'text',
      }

      const resultPromise = adapter.execute(params)

      mockChild.stderr.emit('data', Buffer.from('Something went wrong'))
      mockChild.emit('close', 1)

      await expect(resultPromise).rejects.toThrow('failed (exit code 1)')
    })

    it('rejects on spawn error', async () => {
      const mockChild = createMockChildProcess()
      mockedSpawn.mockReturnValue(mockChild as never)

      const adapter = createScriptAdapter('nonexistent-command')

      const params: ExecuteParams = {
        prompt: 'Input',
        model: 'script',
        responseType: 'text',
      }

      const resultPromise = adapter.execute(params)

      mockChild.emit('error', new Error('ENOENT'))

      await expect(resultPromise).rejects.toThrow('Failed to spawn script')
    })
  })

  describe('testConnection()', () => {
    it('checks command existence and returns ok on success', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/echo'))

      const adapter = createScriptAdapter('echo')
      const result = await adapter.testConnection()

      expect(mockedExecSync).toHaveBeenCalledWith(
        'which echo',
        { stdio: 'pipe' }
      )
      expect(result.ok).toBe(true)
      expect(typeof result.responseTimeMs).toBe('number')
    })

    it('returns error when command not found', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Command not found')
      })

      const adapter = createScriptAdapter('nonexistent-command')
      const result = await adapter.testConnection()

      expect(result.ok).toBe(false)
      expect(result.error).toContain('not found on PATH')
    })
  })

  describe('listModels()', () => {
    it('returns empty array', async () => {
      const adapter = createScriptAdapter('echo')
      const models = await adapter.listModels()

      expect(models).toEqual([])
    })
  })

  describe('estimateCost()', () => {
    it('returns zero cost', () => {
      const adapter = createScriptAdapter('echo')

      const params: EstimateCostParams = {
        prompt: 'Test',
        model: 'script',
      }

      const estimate = adapter.estimateCost(params)

      expect(estimate.estimatedCostUsd).toBe(0)
      expect(estimate.inputTokens).toBe(0)
      expect(estimate.confidence).toBe('exact')
    })
  })
})
