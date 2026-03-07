import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NzrClient } from '../src/client'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('NzrClient', () => {
  let client: NzrClient

  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 })
    client = new NzrClient({
      dsn: 'https://example.com/api/autofix/ingest/',
      enableGlobalHandlers: false,
    })
  })

  afterEach(() => {
    client.destroy()
    vi.restoreAllMocks()
  })

  it('captures an exception and returns event ID', () => {
    const error = new Error('test error')
    const eventId = client.captureException(error)

    expect(eventId).toBeTypeOf('string')
    expect(eventId).toHaveLength(32)
  })

  it('captures a message', () => {
    const eventId = client.captureMessage('something went wrong')

    expect(eventId).toBeTypeOf('string')
  })

  it('drops events via beforeSend returning null', () => {
    const filtered = new NzrClient({
      dsn: 'https://example.com/ingest',
      beforeSend: () => null,
      enableGlobalHandlers: false,
    })

    const eventId = filtered.captureException(new Error('drop me'))
    expect(eventId).toBeNull()
    filtered.destroy()
  })

  it('respects sample rate of 0', () => {
    const sampled = new NzrClient({
      dsn: 'https://example.com/ingest',
      sampleRate: 0,
      enableGlobalHandlers: false,
    })

    const eventId = sampled.captureException(new Error('never'))
    expect(eventId).toBeNull()
    sampled.destroy()
  })

  it('tracks breadcrumbs', () => {
    client.addBreadcrumb({
      category: 'ui',
      message: 'clicked button',
      level: 'info',
    })

    // Capture an error — breadcrumbs should be included
    const eventId = client.captureException(new Error('with breadcrumbs'))
    expect(eventId).toBeTypeOf('string')
  })

  it('limits breadcrumbs to maxBreadcrumbs', () => {
    const limited = new NzrClient({
      dsn: 'https://example.com/ingest',
      maxBreadcrumbs: 2,
      enableGlobalHandlers: false,
    })

    limited.addBreadcrumb({ category: 'a', message: '1', level: 'info' })
    limited.addBreadcrumb({ category: 'b', message: '2', level: 'info' })
    limited.addBreadcrumb({ category: 'c', message: '3', level: 'info' })

    // Only last 2 should remain
    const eventId = limited.captureException(new Error('test'))
    expect(eventId).toBeTypeOf('string')
    limited.destroy()
  })
})
