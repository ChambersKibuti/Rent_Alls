/**
 * Frontend input validation utilities
 * These mirror backend validation for consistent UX
 */

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength requirements
const PASSWORD_MIN_LENGTH = 8;

/**
 * Validates email format
 */
export function validateEmailFrontend(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  email = email.trim();
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Validates password strength
 */
export function validatePasswordFrontend(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { 
      valid: false, 
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` 
    };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }
  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }
  // Check for digit
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  return { valid: true };
}

/**
 * Get password strength indicator
 */
export function getPasswordStrength(password) {
  if (!password) return { strength: 0, label: 'Too weak' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score++;
  
  if (score <= 1) return { strength: 1, label: 'Weak' };
  if (score === 2) return { strength: 2, label: 'Fair' };
  if (score === 3) return { strength: 3, label: 'Good' };
  return { strength: 4, label: 'Strong' };
}

/**
 * Validates passwords match
 */
export function validatePasswordsMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
}

/**
 * Validates full name
 */
export function validateFullNameFrontend(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Full name is required' };
  }
  name = name.trim();
  if (name.length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Full name is too long' };
  }
  return { valid: true };
}

/**
 * Validates phone number
 */
export function validatePhoneFrontend(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone is required' };
  }
  phone = phone.trim();
  if (!/^[\d\s\-+()]{10,20}$/.test(phone)) {
    return { valid: false, error: 'Invalid phone format' };
  }
  return { valid: true };
}

/**
 * Validates national ID
 */
export function validateNationalIdFrontend(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'National ID is required' };
  }
  id = id.trim();
  if (id.length < 5 || id.length > 50) {
    return { valid: false, error: 'Invalid national ID format' };
  }
  return { valid: true };
}
