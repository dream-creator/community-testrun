export function validateContactInput(data: any): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const { name, email, message } = data || {}

  // Name: Required, 2-50 chars, alphanumeric + spaces + apostrophes + hyphens
  const nameRegex = /^[a-zA-Z0-9\s'-]{2,50}$/
  if (typeof name !== 'string' || !nameRegex.test(name.trim())) {
    errors.name = 'Name must be between 2 and 50 characters long and contain only valid characters.'
  }

  // Email: Required, standard email structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid email address.'
  }

  // Message: Required, 10-1000 chars
  if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 1000) {
    errors.message = 'Message must be between 10 and 1000 characters long.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
