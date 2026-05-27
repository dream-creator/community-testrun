# Next.js Contact Form API Route Design Specification

**Date:** 2026-05-27  
**Status:** Approved  
**Author:** Antigravity (AI Coding Assistant)  

---

## 1. Goal & Overview
The goal is to build a new, secure, and robust Next.js API route that handles contact form submissions. The route validates inputs, implements client rate limiting and bot-spam protection (honeypot), and dispatches contact messages via Nodemailer SMTP.

---

## 2. Requirements & Constraints
*   **Routing:** App Router route handler located at `app/api/contact/route.ts` (using `POST`).
*   **Spam Protection (Honeypot):** A hidden field (named `honeypot`) is validated. If populated (which bots do automatically), the request is silently accepted with a `200 OK` response, but no email is sent.
*   **Rate Limiting:** IP-based sliding window tracking in-memory: maximum **3 submissions per minute** per client IP. Returns `429 Too Many Requests` when exceeded.
*   **Validation:** 
    *   `name`: Required, 2-50 characters, letters/numbers/spaces/hyphens/apostrophes only.
    *   `email`: Required, valid RFC-like email format validation.
    *   `message`: Required, 10-1000 characters.
    *   Returns `400 Bad Request` with specific field errors if validation fails.
*   **Delivery:** Nodemailer with standard SMTP configuration retrieved from environment variables. Returns `500 Internal Server Error` if mailing fails.
*   **Testing:** Vitest for Test-Driven Development (TDD), covering both unit tests for individual modules and integration tests for the API handler.

---

## 3. Architecture & File Structure
To ensure clean boundaries and ease of testing, the feature uses a **Modular Architecture** where logic is separated into independent, testable service layers:

```
contact-api/
├── app/
│   └── api/
│       └── contact/
│           └── route.ts         # Route Handler / Controller
├── lib/
│   └── contact/
│       ├── validator.ts         # Input Validation Service
│       ├── rate-limiter.ts      # In-Memory Rate Limiter Service
│       └── mailer.ts            # Nodemailer SMTP Service
└── tests/
    └── contact/
        ├── route.test.ts        # Integration Tests
        ├── validator.test.ts    # Validator Unit Tests
        ├── rate-limiter.test.ts # Rate Limiter Unit Tests
        └── mailer.test.ts       # Mailer Unit Tests
```

---

## 4. Component Details

### A. Input Validator (`lib/contact/validator.ts`)
Validates names, emails, and messages.
*   **Constraints:**
    *   `name`: `typeof name === 'string' && /^[a-zA-Z0-9\s'-]{2,50}$/.test(name)`
    *   `email`: `typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)`
    *   `message`: `typeof message === 'string' && message.length >= 10 && message.length <= 1000`
*   **Exports:**
    *   `validateContactInput(data: any): { isValid: boolean; errors: Record<string, string> }`

### B. Rate Limiter (`lib/contact/rate-limiter.ts`)
Tracks request frequencies per IP.
*   **Store:** `Map<string, number[]>` holding millisecond timestamps.
*   **Window Size:** `60,000 ms` (1 minute).
*   **Max Requests:** `3` requests.
*   **Exports:**
    *   `isRateLimited(ip: string): boolean`

### C. Mailer Service (`lib/contact/mailer.ts`)
Dispatches email notifications using Nodemailer.
*   **Environment Configuration:**
    *   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
    *   `CONTACT_RECEIVER`, `CONTACT_SENDER`
*   **Template:**
    *   Subject: `New Contact Form Submission from ${name}`
    *   Body: HTML & Text format displaying sender name, sender email, and the formatted message.
*   **Exports:**
    *   `sendContactEmail(data: { name: string; email: string; message: string }): Promise<void>`

---

## 5. API Response Formats

### 200 OK (Success or Silent Honeypot Success)
```json
{
  "success": true,
  "message": "Submission received successfully."
}
```

### 400 Bad Request (Validation Errors)
```json
{
  "error": "Validation failed",
  "errors": {
    "email": "Please provide a valid email address.",
    "message": "Message must be between 10 and 1000 characters long."
  }
}
```

### 429 Too Many Requests (Rate Limited)
```json
{
  "error": "Too many requests. Please try again later."
}
```

### 500 Internal Server Error (SMTP Failure)
```json
{
  "error": "Failed to send message. Please try again later."
}
```

---

## 6. Verification & Testing Plan
*   **Unit Testing:**
    *   `validator.test.ts`: Asserts valid inputs pass, and invalid names, emails, and lengths trigger correct error payloads.
    *   `rate-limiter.test.ts`: Verifies an IP is blocked on the 4th request inside a 60s window, and becomes unblocked once timestamps slide out.
    *   `mailer.test.ts`: Mock nodemailer and assert SMTP transporter is initialized and sendMail is called with correct options and templates.
*   **Integration Testing:**
    *   `route.test.ts`: Verifies complete HTTP pipeline. Asserts mock requests return 200, 400, 429, or 500 depending on payloads and mock conditions.
