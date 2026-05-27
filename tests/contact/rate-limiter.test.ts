import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest'
import { InMemoryRateLimiter } from '@/lib/contact/rate-limiter'

describe('In-Memory Rate Limiter', () => {
  let rateLimiter: InMemoryRateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    // Create limiter with window of 60000ms and max 3 requests
    rateLimiter = new InMemoryRateLimiter(60000, 3)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('allows up to MAX_REQUESTS submissions', () => {
    const ip = '192.168.1.1'
    expect(rateLimiter.isRateLimited(ip)).toBe(false)
    expect(rateLimiter.isRateLimited(ip)).toBe(false)
    expect(rateLimiter.isRateLimited(ip)).toBe(false)
  })

  test('blocks requests exceeding MAX_REQUESTS', () => {
    const ip = '192.168.1.2'
    rateLimiter.isRateLimited(ip)
    rateLimiter.isRateLimited(ip)
    rateLimiter.isRateLimited(ip)
    expect(rateLimiter.isRateLimited(ip)).toBe(true) // 4th call is limited
  })

  test('resets limit after sliding window duration', () => {
    const ip = '192.168.1.3'
    rateLimiter.isRateLimited(ip)
    rateLimiter.isRateLimited(ip)
    rateLimiter.isRateLimited(ip)
    expect(rateLimiter.isRateLimited(ip)).toBe(true)

    // Fast forward by 60 seconds (60000ms)
    vi.advanceTimersByTime(60000)

    expect(rateLimiter.isRateLimited(ip)).toBe(false) // Limit reset
  })
})
