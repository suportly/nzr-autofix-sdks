const FILTERED = '[FILTERED]'

/**
 * Recursively sanitize values in an object whose keys match sensitive patterns.
 */
export function sanitizeData(
  data: Record<string, unknown>,
  patterns: RegExp[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (patterns.some((p) => p.test(key))) {
      result[key] = FILTERED
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeData(value as Record<string, unknown>, patterns)
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Sanitize string values that look like credit card numbers or tokens.
 */
export function sanitizeString(value: string): string {
  // Credit card numbers (13-19 digits with optional spaces/dashes)
  return value.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,7}\b/g,
    FILTERED,
  )
}
