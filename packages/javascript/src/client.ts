import type {
  NzrConfig,
  ResolvedConfig,
  ErrorEvent,
  Breadcrumb,
  StackFrame,
} from './types'
import { resolveConfig } from './config'
import { parseStackTrace } from './stack-parser'
import { sanitizeData } from './sanitizer'
import { getBrowserContext } from './context'
import { Transport } from './transport'

const SDK_NAME = '@nzr/autofix'
const SDK_VERSION = '0.1.0'

/**
 * Core NZR Autofix client.
 */
export class NzrClient {
  readonly config: ResolvedConfig
  private transport: Transport
  private breadcrumbs: Breadcrumb[] = []

  constructor(rawConfig: NzrConfig) {
    this.config = resolveConfig(rawConfig)
    this.transport = new Transport(
      this.config.dsn,
      this.config.sendTimeoutMs,
      this.config.maxQueueSize,
      this.config.flushIntervalMs,
    )
  }

  /** Capture an Error and send to the server. */
  captureException(error: Error, extra?: Record<string, unknown>): string | null {
    if (!this.shouldSample()) return null

    const frames = parseStackTrace(error.stack ?? '')
    return this.sendEvent(
      {
        type: error.name || 'Error',
        value: error.message?.substring(0, 2000) ?? '',
        frames,
      },
      extra,
    )
  }

  /** Capture a message without an exception. */
  captureMessage(
    message: string,
    level: 'error' | 'warning' | 'info' = 'error',
    extra?: Record<string, unknown>,
  ): string | null {
    if (!this.shouldSample()) return null

    return this.sendEvent(
      {
        type: 'Message',
        value: message.substring(0, 2000),
        frames: [],
      },
      extra,
      level,
    )
  }

  /** Add a breadcrumb to track user actions. */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const full: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    }
    this.breadcrumbs.push(full)
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs)
    }
  }

  /** Flush any queued events. */
  async flush(): Promise<void> {
    await this.transport.flush()
  }

  /** Destroy the client and stop background processes. */
  destroy(): void {
    this.transport.destroy()
  }

  private sendEvent(
    exception: { type: string; value: string; frames: StackFrame[] },
    extra?: Record<string, unknown>,
    _level?: string,
  ): string | null {
    const eventId = generateEventId()

    let event: ErrorEvent = {
      eventId,
      timestamp: new Date().toISOString(),
      exception,
      environment: this.config.environment,
      release: this.config.release,
      serverName: this.config.serverName,
      sdk: { name: SDK_NAME, version: SDK_VERSION },
      contexts: getBrowserContext(),
      breadcrumbs: [...this.breadcrumbs],
      extra: extra
        ? sanitizeData(extra, this.config.sanitizePatterns)
        : undefined,
    }

    // beforeSend hook
    if (this.config.beforeSend) {
      const result = this.config.beforeSend(event)
      if (result === null) return null
      event = result
    }

    if (this.transport.send(event)) {
      return eventId
    }
    return null
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }
}

function generateEventId(): string {
  // Generate a 32-char hex string
  const array = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}
