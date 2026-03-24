import { log, logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger'

describe('logger', () => {
  describe('log()', () => {
    it('does not throw (no-op in Convex architecture)', () => {
      expect(() =>
        log({
          level: 'info',
          domain: 'pipeline',
          event: 'test.event',
          message: 'Test message',
        })
      ).not.toThrow()
    })
  })

  describe('convenience functions', () => {
    it('logInfo does not throw', () => {
      expect(() => logInfo('pipeline', 'pipeline.start', 'Pipeline started')).not.toThrow()
    })

    it('logError does not throw', () => {
      expect(() => logError('provider', 'provider.fail', 'Provider error')).not.toThrow()
    })

    it('logWarn does not throw', () => {
      expect(() => logWarn('settings', 'settings.missing', 'Missing key')).not.toThrow()
    })

    it('logDebug does not throw', () => {
      expect(() => logDebug('step', 'step.trace', 'Debug trace')).not.toThrow()
    })
  })
})
