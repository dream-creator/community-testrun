import { expect, test, describe, vi, beforeEach } from 'vitest'

const { mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: '123' })
  const createTransport = vi.fn().mockReturnValue({
    sendMail,
  })
  return { mockSendMail: sendMail, mockCreateTransport: createTransport }
})

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}))

import { sendContactEmail, resetTransporter } from '@/lib/contact/mailer'

describe('Mailer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTransporter()

    // Set standard environment variables
    process.env.SMTP_HOST = 'smtp.test.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test-user'
    process.env.SMTP_PASS = 'test-pass'
    process.env.CONTACT_RECEIVER = 'receiver@test.com'
    process.env.CONTACT_SENDER = 'sender@test.com'
  })

  test('creates transport and dispatches contact email successfully', async () => {
    const mailData = {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'This is a message from Alice.',
    }

    await sendContactEmail(mailData)

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      auth: {
        user: 'test-user',
        pass: 'test-pass',
      },
    })

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'sender@test.com',
      to: 'receiver@test.com',
      subject: 'New Contact Form Submission from Alice',
      text: expect.stringContaining('Name: Alice'),
      html: expect.stringContaining('New Contact Form Submission'),
    })
  })

  test('caches the transporter and does not recreate it on subsequent calls', async () => {
    const mailData = {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'This is a message from Alice.',
    }

    await sendContactEmail(mailData)
    await sendContactEmail(mailData)

    expect(mockCreateTransport).toHaveBeenCalledTimes(1)
    expect(mockSendMail).toHaveBeenCalledTimes(2)
  })

  describe('Environment configuration validation', () => {
    const requiredEnvKeys = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'CONTACT_RECEIVER',
      'CONTACT_SENDER',
    ]

    requiredEnvKeys.forEach((key) => {
      test(`throws an error when ${key} is missing`, async () => {
        const mailData = {
          name: 'Alice',
          email: 'alice@example.com',
          message: 'Hello!',
        }

        // Delete the environment variable
        const originalValue = process.env[key]
        delete process.env[key]

        await expect(sendContactEmail(mailData)).rejects.toThrow(
          'SMTP environment variables are not fully configured.'
        )

        // Restore original value
        process.env[key] = originalValue
      })
    })

    test('throws an error when SMTP_PORT is set to an invalid non-numeric string', async () => {
      const mailData = {
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello!',
      }

      process.env.SMTP_PORT = 'abc'

      await expect(sendContactEmail(mailData)).rejects.toThrow(
        'SMTP_PORT is not a valid number.'
      )
    })
  })

  describe('HTML Injection security check', () => {
    test('escapes HTML tags in name, email, and message for HTML body', async () => {
      const mailData = {
        name: '<script>alert("name")</script>',
        email: '<script>alert("email")</script>@test.com',
        message: 'Hello <img src="x" onerror="alert(1)"> world!',
      }

      await sendContactEmail(mailData)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;'),
        })
      )

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('&lt;script&gt;alert(&quot;email&quot;)&lt;/script&gt;@test.com'),
        })
      )

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Hello &lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt; world!'),
        })
      )

      // Plain text content should NOT be escaped (retains raw chars)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('<script>alert("name")</script>'),
        })
      )
    })
  })
})
