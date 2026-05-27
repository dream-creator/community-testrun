export interface ContactInput {
  name?: string;
  email?: string;
  message?: string;
}

export const VALIDATION_ERRORS = {
  NAME_INVALID: 'Name must be between 2 and 50 characters long and contain only valid characters.',
  EMAIL_INVALID: 'Please provide a valid email address.',
  MESSAGE_INVALID: 'Message must be between 10 and 1000 characters long.',
  PAYLOAD_INVALID: 'Invalid payload format.',
} as const

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof ContactInput, string>>;
  sanitizedData?: {
    name: string;
    email: string;
    message: string;
  };
}

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 50
const MIN_MESSAGE_LENGTH = 10
const MAX_MESSAGE_LENGTH = 1000

export function validateContactInput(data: unknown): ValidationResult {
  const errors: Partial<Record<keyof ContactInput, string>> = {}

  if (typeof data !== 'object' || data === null) {
    return {
      isValid: false,
      errors: {
        name: VALIDATION_ERRORS.NAME_INVALID,
        email: VALIDATION_ERRORS.EMAIL_INVALID,
        message: VALIDATION_ERRORS.MESSAGE_INVALID,
      },
    }
  }

  const payload = data as Record<string, unknown>
  const name = payload.name
  const email = payload.email
  const message = payload.message

  // Name: Required, 2-50 chars, alphanumeric + spaces + apostrophes + hyphens
  const nameRegex = /^[a-zA-Z0-9 '-]+$/
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (
    typeof name !== 'string' ||
    trimmedName.length < MIN_NAME_LENGTH ||
    trimmedName.length > MAX_NAME_LENGTH ||
    !nameRegex.test(trimmedName)
  ) {
    errors.name = VALIDATION_ERRORS.NAME_INVALID
  }

  // Email: Required, standard email structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const trimmedEmail = typeof email === 'string' ? email.trim() : ''
  if (typeof email !== 'string' || !emailRegex.test(trimmedEmail)) {
    errors.email = VALIDATION_ERRORS.EMAIL_INVALID
  }

  // Message: Required, 10-1000 chars
  const trimmedMessage = typeof message === 'string' ? message.trim() : ''
  if (
    typeof message !== 'string' ||
    trimmedMessage.length < MIN_MESSAGE_LENGTH ||
    trimmedMessage.length > MAX_MESSAGE_LENGTH
  ) {
    errors.message = VALIDATION_ERRORS.MESSAGE_INVALID
  }

  const isValid = Object.keys(errors).length === 0

  if (isValid) {
    return {
      isValid: true,
      errors,
      sanitizedData: {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      },
    }
  }

  return {
    isValid: false,
    errors,
  }
}
