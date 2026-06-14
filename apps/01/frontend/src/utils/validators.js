/**
 * Simple client-side form validators.
 */

export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return '';
}

export function validatePassword(password) {
  if (!password || !password.trim()) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return '';
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation || !confirmation.trim()) {
    return 'Please confirm your password';
  }
  if (password !== confirmation) {
    return 'Passwords do not match';
  }
  return '';
}