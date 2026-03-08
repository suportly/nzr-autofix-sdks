import type { NzrConfig, ResolvedConfig } from './types'

const DEFAULT_SANITIZE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api_?key/i,
  /authorization/i,
  /session/i,
  /cookie/i,
  /credit.?card/i,
  /private.?key/i,
]

/**
 * Read environment variable from multiple sources:
 * - Vite: import.meta.env.VITE_*
 * - Node.js: process.env.*
 */
function getEnv(key: string): string {
  // Vite env vars (prefixed with VITE_)
  try {
    const viteKey = `VITE_${key}`
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[viteKey]) {
      return (import.meta as any).env[viteKey]
    }
  } catch {
    // import.meta not available
  }

  // Node.js / SSR
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key]!
    }
  } catch {
    // process not available
  }

  return ''
}

/**
 * Resolve user config into a full ResolvedConfig.
 * Auto-loads from environment variables when values are not explicitly provided.
 * Returns null when DSN is missing, indicating no-op mode.
 */
export function resolveConfig(raw: NzrConfig): ResolvedConfig | null {
  // Auto-load from environment if not explicitly provided
  const dsn = raw.dsn || getEnv('NZR_AUTOFIX_DSN')
  const debug = raw.debug ?? ['1', 'true'].includes(getEnv('NZR_AUTOFIX_DEBUG').toLowerCase())

  if (!dsn) {
    if (debug) {
      console.warn('[NZR Autofix] No DSN configured — running in no-op mode')
    }
    return null
  }

  const sanitizePatterns = raw.sanitizePatterns
    ? raw.sanitizePatterns.map((p) => new RegExp(p, 'i'))
    : [...DEFAULT_SANITIZE_PATTERNS]

  // If endpointUrl not provided, try env then fallback to dsn URL
  const endpointUrl =
    raw.endpointUrl ??
    (getEnv('NZR_AUTOFIX_ENDPOINT_URL') ||
    (dsn.startsWith('http://') || dsn.startsWith('https://') ? dsn : ''))

  if (!endpointUrl) {
    if (debug) {
      console.warn('[NZR Autofix] No endpoint URL — set endpointUrl or VITE_NZR_AUTOFIX_ENDPOINT_URL')
    }
    return null
  }

  const environment = raw.environment ?? (getEnv('NZR_AUTOFIX_ENVIRONMENT') || 'production')
  const release = raw.release ?? (getEnv('NZR_AUTOFIX_RELEASE') || '')

  const config: ResolvedConfig = {
    dsn,
    endpointUrl,
    environment,
    release,
    serverName:
      raw.serverName ??
      (typeof window !== 'undefined' ? window.location.hostname : 'unknown'),
    sampleRate: Math.max(0, Math.min(1, raw.sampleRate ?? 1.0)),
    maxBreadcrumbs: raw.maxBreadcrumbs ?? 50,
    maxQueueSize: raw.maxQueueSize ?? 100,
    flushIntervalMs: raw.flushIntervalMs ?? 5000,
    sendTimeoutMs: raw.sendTimeoutMs ?? 5000,
    sanitizePatterns,
    beforeSend: raw.beforeSend ?? null,
    enableGlobalHandlers: raw.enableGlobalHandlers ?? true,
  }

  if (debug) {
    const dsnPreview = dsn.length > 30 ? dsn.slice(0, 30) + '...' : dsn
    console.log(`[NZR Autofix] Initialized (DSN: ${dsnPreview}, endpoint: ${endpointUrl}, env: ${environment})`)
  }

  return config
}
