import type { NzrConfig } from './types'
import { NzrClient } from './client'
import { resolveConfig } from './config'
import { setupGlobalHandlers } from './integrations/global-handlers'

export type {
  NzrConfig,
  ErrorEvent,
  StackFrame,
  Breadcrumb,
  BrowserContext,
  ResolvedConfig,
} from './types'

export { NzrClient } from './client'
export { parseStackTrace } from './stack-parser'
export { sanitizeData } from './sanitizer'
export { getBrowserContext } from './context'

let _client: NzrClient | null = null

/**
 * Initialize the NZR Autofix SDK.
 *
 * Must be called once at application startup.
 *
 * @example
 * ```ts
 * import { init } from '@nzr/autofix'
 *
 * init({ dsn: 'https://your-server.com/api/autofix/ingest/' })
 * ```
 */
export function init(config: NzrConfig): NzrClient | null {
  if (_client) {
    console.warn('nzr_autofix: init() called more than once. Ignoring.')
    return _client
  }

  const resolved = resolveConfig(config)
  if (!resolved) {
    if (typeof console !== 'undefined') {
      console.debug('nzr_autofix: no DSN configured, running in no-op mode')
    }
    return null
  }

  _client = new NzrClient(config)

  if (_client.config.enableGlobalHandlers) {
    setupGlobalHandlers(_client)
  }

  return _client
}

/** Capture an Error and send to the server. */
export function captureException(
  error: Error,
  extra?: Record<string, unknown>,
): string | null {
  if (!_client) return null
  return _client.captureException(error, extra)
}

/** Capture a message without an exception. */
export function captureMessage(
  message: string,
  level?: 'error' | 'warning' | 'info',
  extra?: Record<string, unknown>,
): string | null {
  if (!_client) return null
  return _client.captureMessage(message, level, extra)
}

/** Add a breadcrumb. */
export function addBreadcrumb(
  breadcrumb: Omit<import('./types').Breadcrumb, 'timestamp'>,
): void {
  if (!_client) return
  _client.addBreadcrumb(breadcrumb)
}

/** Get the current client instance. */
export function getClient(): NzrClient | null {
  return _client
}

/** Flush pending events. */
export async function flush(): Promise<void> {
  if (!_client) return
  await _client.flush()
}

/** Destroy the client and reset global state. */
export function close(): void {
  if (_client) {
    _client.destroy()
    _client = null
  }
}
