export interface ContactInput {
  name?: string;
  email?: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof ContactInput, string>>;
  sanitizedData?: {
    name: string;
    email: string;
    message: string;
  };
}

export function validateContactInput(data: unknown): ValidationResult {
  const errors: Partial<Record<keyof ContactInput, string>> = {}

  if (typeof data !== 'object' || data === null) {
    return {
      isValid: false,
      errors: {
        name: 'Name must be between 2 and 50 characters long and contain only valid characters.',
        email: 'Please provide a valid email address.',
        message: 'Message must be between 10 and 1000 characters long.',
      },
    }
  }

  const payload = data as Record<string, unknown>
  const name = payload.name
  const email = payload.email
  const message = payload.message

  // Name: Required, 2-50 chars, alphanumeric + spaces + apostrophes + hyphens
  const nameRegex = /^[a-zA-Z0-9 '-]{2,50}$/
  let trimmedName = ''
  if (typeof name !== 'string') {
    errors.name = 'Name must be between 2 and 50 characters long and contain only valid characters.'
  } else {
    trimmedName = name.trim()
    if (!nameRegex.test(trimmedName)) {
      errors.name = 'Name must be between 2 and 50 characters long and contain only valid characters.'
    }
  }

  // Email: Required, standard email structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  let trimmedEmail = ''
  if (typeof email !== 'string') {
    errors.email = 'Please provide a valid email address.'
  } else {
    trimmedEmail = email.trim()
    if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address.'
    }
  }

  // Message: Required, 10-1000 chars
  let trimmedMessage = ''
  if (typeof message !== 'string') {
    errors.message = 'Message must be between 10 and 1000 characters long.'
  } else {
    trimmedMessage = message.trim()
    if (trimmedMessage.length < 10 || trimmedMessage.length > 1000) {
      errors.message = 'Message must be between 10 and 1000 characters long.'
    }
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
