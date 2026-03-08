import { describe, it, expect } from 'vitest'
import { resolveConfig } from '../src/config'

describe('resolveConfig', () => {
  it('returns null if dsn is empty', () => {
    expect(resolveConfig({ dsn: '' })).toBeNull()
  })

  it('returns null if dsn is omitted', () => {
    expect(resolveConfig({})).toBeNull()
  })

  it('applies defaults', () => {
    const config = resolveConfig({ dsn: 'https://example.com/ingest' })

    expect(config).not.toBeNull()
    expect(config!.dsn).toBe('https://example.com/ingest')
    expect(config!.environment).toBe('production')
    expect(config!.release).toBe('')
    expect(config!.sampleRate).toBe(1.0)
    expect(config!.maxBreadcrumbs).toBe(50)
    expect(config!.maxQueueSize).toBe(100)
    expect(config!.flushIntervalMs).toBe(5000)
    expect(config!.sendTimeoutMs).toBe(5000)
    expect(config!.sanitizePatterns).toHaveLength(9)
    expect(config!.beforeSend).toBeNull()
    expect(config!.enableGlobalHandlers).toBe(true)
  })

  it('overrides with user values', () => {
    const config = resolveConfig({
      dsn: 'https://example.com/ingest',
      environment: 'staging',
      sampleRate: 0.5,
      maxBreadcrumbs: 10,
    })

    expect(config!.environment).toBe('staging')
    expect(config!.sampleRate).toBe(0.5)
    expect(config!.maxBreadcrumbs).toBe(10)
  })

  it('clamps sampleRate to 0-1', () => {
    expect(
      resolveConfig({ dsn: 'https://example.com/ingest', sampleRate: 2.0 })!.sampleRate,
    ).toBe(1.0)
    expect(
      resolveConfig({ dsn: 'https://example.com/ingest', sampleRate: -0.5 })!.sampleRate,
    ).toBe(0)
  })
})
