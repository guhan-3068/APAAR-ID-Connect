/**
 * Authentication Form Validation Utilities
 * Used for client-side form checking and format enforcement
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email address is required' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. user@institution.edu.in)' }
  }
  return { isValid: true }
}

export function validatePassword(password: string, minLength = 6): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters long` }
  }
  return { isValid: true }
}

export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' }
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }
  return { isValid: true }
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  return { isValid: true }
}
