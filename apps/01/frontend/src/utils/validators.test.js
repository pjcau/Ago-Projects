import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from './validators';

describe('validateEmail', () => {
  it('returns error for empty input', () => {
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('   ')).toBe('Email is required');
    expect(validateEmail(null)).toBe('Email is required');
  });

  it('returns error for invalid email format', () => {
    expect(validateEmail('notanemail')).toBe('Please enter a valid email address');
    expect(validateEmail('@domain.com')).toBe('Please enter a valid email address');
    expect(validateEmail('user@')).toBe('Please enter a valid email address');
    expect(validateEmail('user@.com')).toBe('Please enter a valid email address');
  });

  it('returns empty string for valid email', () => {
    expect(validateEmail('test@example.com')).toBe('');
    expect(validateEmail('user@domain.co')).toBe('');
    expect(validateEmail('  test@example.com  ')).toBe('');
  });
});

describe('validatePassword', () => {
  it('returns error for empty input', () => {
    expect(validatePassword('')).toBe('Password is required');
    expect(validatePassword('   ')).toBe('Password is required');
    expect(validatePassword(null)).toBe('Password is required');
  });

  it('returns error for password shorter than 6 characters', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 6 characters');
    expect(validatePassword('12345')).toBe('Password must be at least 6 characters');
  });

  it('returns empty string for valid password', () => {
    expect(validatePassword('abcdef')).toBe('');
    expect(validatePassword('verylongpassword12345')).toBe('');
  });
});

describe('validatePasswordConfirmation', () => {
  it('returns error for empty confirmation', () => {
    expect(validatePasswordConfirmation('abc123', '')).toBe('Please confirm your password');
    expect(validatePasswordConfirmation('abc123', '   ')).toBe('Please confirm your password');
    expect(validatePasswordConfirmation('abc123', null)).toBe('Please confirm your password');
  });

  it('returns error when passwords do not match', () => {
    expect(validatePasswordConfirmation('abc123', 'xyz789')).toBe('Passwords do not match');
  });

  it('returns empty string when passwords match', () => {
    expect(validatePasswordConfirmation('abc123', 'abc123')).toBe('');
  });
});