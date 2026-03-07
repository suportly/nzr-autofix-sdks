import type { NzrClient } from '../client'

/**
 * Install global error handlers to automatically capture unhandled errors
 * and unhandled promise rejections.
 */
export function setupGlobalHandlers(client: NzrClient): void {
  if (typeof window === 'undefined') return

  // Capture unhandled errors
  const originalOnError = window.onerror
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ) => {
    if (error) {
      client.captureException(error)
    } else {
      client.captureMessage(
        typeof message === 'string' ? message : 'Unknown error',
      )
    }

    if (typeof originalOnError === 'function') {
      return originalOnError.call(window, message, source, lineno, colno, error)
    }
    return false
  }

  // Capture unhandled promise rejections
  const originalOnUnhandledRejection = window.onunhandledrejection
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason

    if (reason instanceof Error) {
      client.captureException(reason)
    } else {
      client.captureMessage(
        reason?.toString?.() ?? 'Unhandled promise rejection',
        'error',
      )
    }

    if (typeof originalOnUnhandledRejection === 'function') {
      originalOnUnhandledRejection.call(window, event)
    }
  }
}
