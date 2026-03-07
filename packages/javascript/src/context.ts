import type { BrowserContext } from './types'

/**
 * Collect browser context information.
 */
export function getBrowserContext(): BrowserContext {
  if (typeof window === 'undefined') {
    return getServerContext()
  }

  const ua = navigator.userAgent
  const browser = parseBrowser(ua)
  const os = parseOS(ua)

  return {
    browser,
    os,
    device: { type: getDeviceType() },
    screen: {
      width: window.screen?.width ?? 0,
      height: window.screen?.height ?? 0,
    },
    url: window.location?.href ?? '',
    locale: navigator.language ?? 'en',
  }
}

function getServerContext(): BrowserContext {
  return {
    browser: { name: 'node', version: typeof process !== 'undefined' ? process.version : '' },
    os: { name: typeof process !== 'undefined' ? process.platform : '', version: '' },
    device: { type: 'server' },
    screen: { width: 0, height: 0 },
    url: '',
    locale: 'en',
  }
}

function parseBrowser(ua: string): { name: string; version: string } {
  const browsers: [string, RegExp][] = [
    ['Edge', /Edg\/(\d+[\d.]*)/],
    ['Chrome', /Chrome\/(\d+[\d.]*)/],
    ['Firefox', /Firefox\/(\d+[\d.]*)/],
    ['Safari', /Version\/(\d+[\d.]*).*Safari/],
  ]

  for (const [name, pattern] of browsers) {
    const matched = pattern.test(ua) ? ua.match(pattern) : null
    if (matched) return { name, version: matched[1] }
  }

  return { name: 'unknown', version: '' }
}

function parseOS(ua: string): { name: string; version: string } {
  const windowsMatch = ua.match(/Windows NT (\d+[\d.]*)/)
  if (/Windows/.test(ua)) {
    return { name: 'Windows', version: windowsMatch?.[1] ?? '' }
  }
  const macMatch = ua.match(/Mac OS X (\d+[._\d]*)/)
  if (macMatch) {
    return { name: 'macOS', version: macMatch[1].replace(/_/g, '.') }
  }
  if (/Linux/.test(ua)) return { name: 'Linux', version: '' }
  const androidMatch = ua.match(/Android (\d+[\d.]*)/)
  if (androidMatch) {
    return { name: 'Android', version: androidMatch[1] }
  }
  const iosMatch = ua.match(/OS (\d+[_\d]*)/)
  if (/iOS|iPhone|iPad/.test(ua) && iosMatch) {
    return { name: 'iOS', version: iosMatch[1].replace(/_/g, '.') }
  }
  return { name: 'unknown', version: '' }
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'server'
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return 'mobile'
  if (/Tablet|iPad/i.test(ua)) return 'tablet'
  return 'desktop'
}
