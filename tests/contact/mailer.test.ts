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

import { sendContactEmail } from '@/lib/contact/mailer'

describe('Mailer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
