import { describe, it, expect } from 'vitest'
import { sanitizeData, sanitizeString } from '../src/sanitizer'

describe('sanitizeData', () => {
  const patterns = [/password/i, /token/i, /secret/i]

  it('filters sensitive keys', () => {
    const data = {
      username: 'john',
      password: 'secret123',
      token: 'abc-xyz',
    }

    const result = sanitizeData(data, patterns)

    expect(result.username).toBe('john')
    expect(result.password).toBe('[FILTERED]')
    expect(result.token).toBe('[FILTERED]')
  })

  it('filters nested sensitive keys', () => {
    const data = {
      user: {
        name: 'john',
        auth: {
          password: 'secret123',
        },
      },
    }

    const result = sanitizeData(data, patterns) as Record<string, Record<string, unknown>>

    expect((result.user as Record<string, unknown>).name).toBe('john')
    expect(
      ((result.user as Record<string, Record<string, unknown>>).auth as Record<string, unknown>)
        .password,
    ).toBe('[FILTERED]')
  })

  it('preserves non-matching keys', () => {
    const data = { name: 'test', count: 42 }
    const result = sanitizeData(data, patterns)
    expect(result).toEqual(data)
  })
})

describe('sanitizeString', () => {
  it('filters credit card numbers', () => {
    const input = 'Card: 4111 1111 1111 1111 for order'
    const result = sanitizeString(input)
    expect(result).not.toContain('4111')
    expect(result).toContain('[FILTERED]')
  })

  it('preserves non-credit-card numbers', () => {
    const input = 'Order #12345'
    expect(sanitizeString(input)).toBe(input)
  })
})
