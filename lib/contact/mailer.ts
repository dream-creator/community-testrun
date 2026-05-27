import nodemailer from 'nodemailer'

export async function sendContactEmail(data: { name: string; email: string; message: string }): Promise<void> {
  const { name, email, message } = data

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const receiver = process.env.CONTACT_RECEIVER
  const sender = process.env.CONTACT_SENDER

  if (!host || !user || !pass || !receiver || !sender) {
    throw new Error('SMTP environment variables are not fully configured.')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    auth: {
      user,
      pass,
    },
  })

  const subject = `New Contact Form Submission from ${name}`

  const textContent = `
New Contact Form Submission
============================
Name: ${name}
Email: ${email}

Message:
${message}
  `.trim()

  const htmlContent = `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 4px; padding: 20px;">
  <div style="border-bottom: 2px solid #34d399; padding-bottom: 10px; margin-bottom: 20px;">
    <h3 style="margin: 0; color: #111;">New Contact Form Submission</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #666;">Received via contact form.</p>
  </div>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 6px 0; font-weight: bold; width: 100px;">From:</td>
      <td style="padding: 6px 0;">${name} (&lt;${email}&gt;)</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Message:</td>
      <td style="padding: 6px 0; white-space: pre-wrap; line-height: 1.4;">${message}</td>
    </tr>
  </table>
</div>
  `.trim()

  await transporter.sendMail({
    from: sender,
    to: receiver,
    subject,
    text: textContent,
    html: htmlContent,
  })
}
