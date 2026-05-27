import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/contact/rate-limiter'
import { validateContactInput } from '@/lib/contact/validator'
import { sendContactEmail } from '@/lib/contact/mailer'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Resolve client IP
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'

    // 2. Check Rate Limiter
    if (rateLimiter.isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // 3. Parse JSON Body
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { name, email, message, honeypot } = body || {}

    // 4. Honeypot check: Silent success if filled
    if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
      console.warn(`Honeypot triggered by IP ${ip}. Silent success returned.`)
      return NextResponse.json({
        success: true,
        message: 'Submission received successfully.',
      })
    }

    // 5. Validation Check
    const validation = validateContactInput({ name, email, message })
    if (!validation.isValid || !validation.sanitizedData) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // 6. Deliver Contact Email using sanitized data
    await sendContactEmail(validation.sanitizedData)

    // 7. Return true success
    return NextResponse.json({
      success: true,
      message: 'Submission received successfully.',
    })
  } catch (error) {
    console.error('Contact Form Route Error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}
