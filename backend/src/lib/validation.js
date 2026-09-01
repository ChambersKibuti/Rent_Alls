/**
 * Input validation utilities for production-safe request handling
 */

// Email regex pattern (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  email = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  return { valid: true, value: email };
}

export function validatePassword(password) {
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
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain uppercase, lowercase, and numeric characters' 
    };
  }
  return { valid: true };
}

export function validateFullName(name) {
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
  return { valid: true, value: name };
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone is required' };
  }
  phone = phone.trim();
  // Allow common phone formats (with digits, spaces, dashes, +)
  if (!/^[\d\s\-+()]{10,20}$/.test(phone)) {
    return { valid: false, error: 'Invalid phone format' };
  }
  return { valid: true, value: phone };
}

export function validateNationalId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'National ID is required' };
  }
  id = id.trim();
  if (id.length < 5 || id.length > 50) {
    return { valid: false, error: 'Invalid national ID format' };
  }
  return { valid: true, value: id };
}
