import { expect, test, describe, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/contact/route'
import { NextRequest } from 'next/server'
import { rateLimiter } from '@/lib/contact/rate-limiter'
import { validateContactInput } from '@/lib/contact/validator'
import { sendContactEmail } from '@/lib/contact/mailer'

vi.mock('@/lib/contact/rate-limiter', () => ({
  rateLimiter: {
    isRateLimited: vi.fn(),
  },
}))

vi.mock('@/lib/contact/validator', () => ({
  validateContactInput: vi.fn(),
}))

vi.mock('@/lib/contact/mailer', () => ({
  sendContactEmail: vi.fn(),
}))

describe('POST /api/contact Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (body: any, ip: string = '127.0.0.1') => {
    return new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'x-forwarded-for': ip,
      },
    })
  }

  test('returns 429 if rate limited', async () => {
    vi.mocked(rateLimiter.isRateLimited).mockReturnValue(true)
    const req = createRequest({ name: 'Alice', email: 'alice@example.com', message: 'Hello Alice' })
    const res = await POST(req)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toBe('Too many requests. Please try again later.')
  })

  test('returns 400 if JSON payload is malformed', async () => {
    vi.mocked(rateLimiter.isRateLimited).mockReturnValue(false)
    const req = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      body: 'invalid-json',
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid JSON payload')
  })

  test('returns silent 200 OK if honeypot is filled (bot submission)', async () => {
    vi.mocked(rateLimiter.isRateLimited).mockReturnValue(false)
    const req = createRequest({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'Spam spam spam',
      honeypot: 'filled_by_bot',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(sendContactEmail).not.toHaveBeenCalled()
  })

  test('returns 400 if field validation fails', async () => {
    vi.mocked(rateLimiter.isRateLimited).mockReturnValue(false)
    vi.mocked(validateContactInput).mockReturnValue({
      isValid: false,
      errors: { email: 'Please provide a valid email address.' },
    })

    const req = createRequest({ name: 'Alice', email: 'bad-email', message: 'Message' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Validation failed')
    expect(json.errors.email).toBe('Please provide a valid email address.')
  })

  test('returns 500 if mail dispatcher fails', async () => {
    vi.mocked(rateLimiter.isRateLimited).mockReturnValue(false)
    vi.mocked(validateContactInput).mockReturnValue({
      isValid: true,
      errors: {},
      sanitizedData: { name: 'Alice', email: 'alice@test.com', message: 'Message here' },
    })
    vi.mocked(sendContactEmail).mockRejectedValue(new Error('SMTP failure'))

    const req = createRequest({ name: 'Alice', email: 'alice@test.com', message: 'Message here' })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to send message. Please try again later.')
  })

  test('returns 200 OK on successful submission with sanitized data', async () => {
    vi.mocked(rateLimiter.isRateLimited).mockReturnValue(false)
    vi.mocked(validateContactInput).mockReturnValue({
      isValid: true,
      errors: {},
      sanitizedData: { name: 'Alice', email: 'alice@test.com', message: 'Message here' },
    })
    vi.mocked(sendContactEmail).mockResolvedValue()

    const req = createRequest({ name: 'Alice', email: 'alice@test.com', message: 'Message here' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toBe('Submission received successfully.')
    expect(sendContactEmail).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@test.com',
      message: 'Message here',
    })
  })
})
