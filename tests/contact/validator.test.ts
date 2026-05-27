import { expect, test, describe } from 'vitest'
import { validateContactInput } from '@/lib/contact/validator'

const VALID_EMAIL = 'jane@example.com'
const VALID_MESSAGE = 'Hello, this is a valid message.'
const VALID_NAME = 'Jane Doe'

describe('Input Validator', () => {
  test('passes valid inputs and returns sanitized data', () => {
    const result = validateContactInput({
      name: '  Jane Doe  ',
      email: '  jane@example.com  ',
      message: '  Hello, this is a valid message.  ',
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
    expect(result.sanitizedData).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello, this is a valid message.',
    })
  })

  test('fails empty or invalid names', () => {
    const resultShort = validateContactInput({
      name: 'A',
      email: VALID_EMAIL,
      message: VALID_MESSAGE,
    })
    expect(resultShort.isValid).toBe(false)
    expect(resultShort.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')

    const resultInvalidChar = validateContactInput({
      name: 'Jane Doe #1',
      email: VALID_EMAIL,
      message: VALID_MESSAGE,
    })
    expect(resultInvalidChar.isValid).toBe(false)
    expect(resultInvalidChar.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')
  })

  test('fails invalid emails', () => {
    const resultInvalid = validateContactInput({
      name: VALID_NAME,
      email: 'invalid-email',
      message: VALID_MESSAGE,
    })
    expect(resultInvalid.isValid).toBe(false)
    expect(resultInvalid.errors.email).toBe('Please provide a valid email address.')
  })

  test('fails short or long messages', () => {
    const resultShort = validateContactInput({
      name: VALID_NAME,
      email: VALID_EMAIL,
      message: 'Too short',
    })
    expect(resultShort.isValid).toBe(false)
    expect(resultShort.errors.message).toBe('Message must be between 10 and 1000 characters long.')
  })

  describe('Boundary checks', () => {
    test('name of length 2 and 50 should pass', () => {
      const name2 = 'Ab'
      const name50 = 'a'.repeat(50)
      
      const result2 = validateContactInput({
        name: name2,
        email: VALID_EMAIL,
        message: VALID_MESSAGE,
      })
      expect(result2.isValid).toBe(true)

      const result50 = validateContactInput({
        name: name50,
        email: VALID_EMAIL,
        message: VALID_MESSAGE,
      })
      expect(result50.isValid).toBe(true)
    })

    test('name of length 51 should fail', () => {
      const name51 = 'a'.repeat(51)
      const result = validateContactInput({
        name: name51,
        email: VALID_EMAIL,
        message: VALID_MESSAGE,
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')
    })

    test('message of length 10 and 1000 should pass', () => {
      const msg10 = 'a'.repeat(10)
      const msg1000 = 'a'.repeat(1000)

      const result10 = validateContactInput({
        name: VALID_NAME,
        email: VALID_EMAIL,
        message: msg10,
      })
      expect(result10.isValid).toBe(true)

      const result1000 = validateContactInput({
        name: VALID_NAME,
        email: VALID_EMAIL,
        message: msg1000,
      })
      expect(result1000.isValid).toBe(true)
    })

    test('message of length 1001 should fail', () => {
      const msg1001 = 'a'.repeat(1001)
      const result = validateContactInput({
        name: VALID_NAME,
        email: VALID_EMAIL,
        message: msg1001,
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.message).toBe('Message must be between 10 and 1000 characters long.')
    })
  })

  describe('Non-object or missing payload checks', () => {
    test('null and undefined payload', () => {
      const resultNull = validateContactInput(null)
      expect(resultNull.isValid).toBe(false)
      expect(resultNull.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')
      expect(resultNull.errors.email).toBe('Please provide a valid email address.')
      expect(resultNull.errors.message).toBe('Message must be between 10 and 1000 characters long.')

      const resultUndefined = validateContactInput(undefined)
      expect(resultUndefined.isValid).toBe(false)
      expect(resultUndefined.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')
      expect(resultUndefined.errors.email).toBe('Please provide a valid email address.')
      expect(resultUndefined.errors.message).toBe('Message must be between 10 and 1000 characters long.')
    })

    test('empty object payload {}', () => {
      const result = validateContactInput({})
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')
      expect(result.errors.email).toBe('Please provide a valid email address.')
      expect(result.errors.message).toBe('Message must be between 10 and 1000 characters long.')
    })

    test('non-object payloads (string, number, boolean)', () => {
      const resultString = validateContactInput('invalid-payload')
      expect(resultString.isValid).toBe(false)
      expect(resultString.errors.name).toBe('Name must be between 2 and 50 characters long and contain only valid characters.')

      const resultNumber = validateContactInput(12345)
      expect(resultNumber.isValid).toBe(false)

      const resultBool = validateContactInput(true)
      expect(resultBool.isValid).toBe(false)
    })
  })

  describe('Special characters in names', () => {
    test('allows digits, hyphens, and apostrophes', () => {
      const names = ["Jane-Doe", "O'Connor", "John 3rd", "d'Artagnan-Jean"]
      for (const name of names) {
        const result = validateContactInput({
          name,
          email: VALID_EMAIL,
          message: VALID_MESSAGE,
        })
        expect(result.isValid).toBe(true)
      }
    })
  })
})
