import type { ErrorEvent } from './types'

/**
 * Non-blocking HTTP transport that queues events and flushes periodically.
 * Uses sendBeacon on page unload for reliable delivery.
 */
export class Transport {
  private readonly dsn: string
  private readonly timeout: number
  private readonly maxQueueSize: number
  private readonly flushInterval: number
  private queue: ErrorEvent[] = []
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(
    dsn: string,
    timeout: number = 5000,
    maxQueueSize: number = 100,
    flushIntervalMs: number = 5000,
  ) {
    this.dsn = dsn
    this.timeout = timeout
    this.maxQueueSize = maxQueueSize
    this.flushInterval = flushIntervalMs
    this.startFlushTimer()
    this.installUnloadHandler()
  }

  /** Enqueue an event for async sending. Returns false if queue is full. */
  send(event: ErrorEvent): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('nzr_autofix: event queue full, dropping event')
      return false
    }
    this.queue.push(event)

    // Flush immediately if we have 10+ events
    if (this.queue.length >= 10) {
      this.flush()
    }

    return true
  }

  /** Flush all queued events to the server. */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const batch = this.queue.splice(0)

    for (const event of batch) {
      await this.sendWithRetry(event)
    }
  }

  /** Stop the flush timer. */
  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private startFlushTimer(): void {
    if (typeof setInterval === 'undefined') return
    this.timer = setInterval(() => this.flush(), this.flushInterval)
  }

  private installUnloadHandler(): void {
    if (typeof window === 'undefined') return

    const onUnload = (): void => {
      if (this.queue.length === 0) return

      // Use sendBeacon for reliable delivery on page unload
      if (typeof navigator?.sendBeacon === 'function') {
        for (const event of this.queue) {
          const blob = new Blob([JSON.stringify(event)], {
            type: 'application/json',
          })
          navigator.sendBeacon(this.dsn, blob)
        }
        this.queue = []
      }
    }

    window.addEventListener('pagehide', onUnload)
    window.addEventListener('beforeunload', onUnload)
  }

  private async sendWithRetry(
    event: ErrorEvent,
    maxRetries: number = 3,
  ): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(this.dsn, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Autofix-DSN': this.dsn,
          },
          body: JSON.stringify(event),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) return

        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get('Retry-After') ?? '5',
            10,
          )
          await sleep(retryAfter * 1000)
          continue
        }

        if (response.status >= 500) {
          await sleep(Math.pow(2, attempt) * 1000)
          continue
        }

        // 4xx (not 429) — don't retry
        return
      } catch {
        await sleep(Math.pow(2, attempt) * 1000)
      }
    }

    console.warn('nzr_autofix: failed to send event after retries')
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
