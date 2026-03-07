/** Configuration options for the NZR Autofix SDK. */
export interface NzrConfig {
  /** Data Source Name — the ingest endpoint URL with auth token. */
  dsn: string
  /** Environment name (e.g., 'production', 'staging'). Default: 'production'. */
  environment?: string
  /** Application release/version string. */
  release?: string
  /** Server or client identifier. Default: window.location.hostname. */
  serverName?: string
  /** Sample rate between 0.0 and 1.0. Default: 1.0. */
  sampleRate?: number
  /** Maximum breadcrumbs to keep. Default: 50. */
  maxBreadcrumbs?: number
  /** Maximum events queued before dropping. Default: 100. */
  maxQueueSize?: number
  /** Flush interval in milliseconds. Default: 5000. */
  flushIntervalMs?: number
  /** HTTP timeout in milliseconds. Default: 5000. */
  sendTimeoutMs?: number
  /** Regex patterns for sensitive data scrubbing. */
  sanitizePatterns?: string[]
  /** Hook to modify or drop events before sending. Return null to drop. */
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null
  /** Enable automatic global error handlers. Default: true. */
  enableGlobalHandlers?: boolean
}

/** A parsed stack trace frame. */
export interface StackFrame {
  filename: string
  function: string
  lineno: number
  colno: number
  absPath?: string
  contextLine?: string
  preContext?: string[]
  postContext?: string[]
}

/** An error event payload sent to the ingest API. */
export interface ErrorEvent {
  eventId: string
  timestamp: string
  exception: {
    type: string
    value: string
    frames: StackFrame[]
  }
  environment: string
  release: string
  serverName: string
  sdk: { name: string; version: string }
  contexts: BrowserContext
  breadcrumbs: Breadcrumb[]
  extra?: Record<string, unknown>
}

/** Browser context information. */
export interface BrowserContext {
  browser: {
    name: string
    version: string
  }
  os: {
    name: string
    version: string
  }
  device: {
    type: string
  }
  screen: {
    width: number
    height: number
  }
  url: string
  locale: string
}

/** A breadcrumb for tracking user actions before an error. */
export interface Breadcrumb {
  timestamp: string
  category: string
  message: string
  level: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}

/** Resolved SDK configuration with defaults applied. */
export interface ResolvedConfig {
  dsn: string
  environment: string
  release: string
  serverName: string
  sampleRate: number
  maxBreadcrumbs: number
  maxQueueSize: number
  flushIntervalMs: number
  sendTimeoutMs: number
  sanitizePatterns: RegExp[]
  beforeSend: ((event: ErrorEvent) => ErrorEvent | null) | null
  enableGlobalHandlers: boolean
}
