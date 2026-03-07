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

export function resolveConfig(raw: NzrConfig): ResolvedConfig {
  if (!raw.dsn) {
    throw new Error('nzr_autofix: dsn is required')
  }

  const sanitizePatterns = raw.sanitizePatterns
    ? raw.sanitizePatterns.map((p) => new RegExp(p, 'i'))
    : [...DEFAULT_SANITIZE_PATTERNS]

  return {
    dsn: raw.dsn,
    environment: raw.environment ?? 'production',
    release: raw.release ?? '',
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
}
