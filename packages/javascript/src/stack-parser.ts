import type { StackFrame } from './types'

/**
 * Chrome / Edge / Node.js format:
 *   at functionName (filename:line:col)
 *   at filename:line:col
 */
const CHROME_RE =
  /^\s*at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?$/

/**
 * Firefox / Safari format:
 *   functionName@filename:line:col
 *   @filename:line:col
 */
const FIREFOX_RE =
  /^\s*(?:(.+?)@)?(.+?):(\d+):(\d+)\s*$/

/**
 * Parse a stack trace string into structured frames.
 *
 * Supports Chrome, Firefox, and Safari stack trace formats.
 */
export function parseStackTrace(stack: string): StackFrame[] {
  if (!stack) return []

  const lines = stack.split('\n')
  const frames: StackFrame[] = []

  for (const line of lines) {
    const frame = parseLine(line)
    if (frame) frames.push(frame)
  }

  return frames
}

function parseLine(line: string): StackFrame | null {
  // Try Chrome format first
  let match = CHROME_RE.exec(line)
  if (match) {
    return {
      function: match[1] || '<anonymous>',
      filename: extractFilename(match[2]),
      absPath: match[2],
      lineno: parseInt(match[3], 10),
      colno: parseInt(match[4], 10),
    }
  }

  // Try Firefox/Safari format
  match = FIREFOX_RE.exec(line)
  if (match) {
    // Skip lines that are just the error message (no file info)
    if (!match[2] || match[2].includes(': ')) return null

    return {
      function: match[1] || '<anonymous>',
      filename: extractFilename(match[2]),
      absPath: match[2],
      lineno: parseInt(match[3], 10),
      colno: parseInt(match[4], 10),
    }
  }

  return null
}

function extractFilename(path: string): string {
  if (!path) return '<unknown>'
  // Handle URLs and file paths
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}
