import { expect, test, describe } from 'vitest'
import { validateContactInput } from '@/lib/contact/validator'

describe('Input Validator', () => {
  test('passes valid inputs', () => {
    const result = validateContactInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello, this is a valid message.',
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  test('fails empty or invalid names', () => {
    const resultShort = validateContactInput({
      name: 'A',
      email: 'jane@example.com',
      message: 'Hello, this is a valid message.',
    })
    expect(resultShort.isValid).toBe(false)
    expect(resultShort.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')

    const resultInvalidChar = validateContactInput({
      name: 'Jane Doe #1',
      email: 'jane@example.com',
      message: 'Hello, this is a valid message.',
    })
    expect(resultInvalidChar.isValid).toBe(false)
  })

  test('fails invalid emails', () => {
    const resultInvalid = validateContactInput({
      name: 'Jane Doe',
      email: 'invalid-email',
      message: 'Hello, this is a valid message.',
    })
    expect(resultInvalid.isValid).toBe(false)
    expect(resultInvalid.errors.email).toBe('Please provide a valid email address.')
  })

  test('fails short or long messages', () => {
    const resultShort = validateContactInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Too short',
    })
    expect(resultShort.isValid).toBe(false)
    expect(resultShort.errors.message).toBe('Message must be between 10 and 1000 characters long.')
  })
})
