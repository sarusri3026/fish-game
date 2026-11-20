const bcrypt = require('bcryptjs');

/**
 * Password Service - Theme 4: Virtual Identity Security
 * Encapsulates password hashing algorithms, cryptographic salt generation,
 * verification, and strong password policy validation.
 */
const DEFAULT_SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt with salt rounds
 * @param {string} plainPassword 
 * @param {number} [saltRounds=10] 
 * @returns {Promise<string>} Encrypted password hash
 */
async function hashPassword(plainPassword, saltRounds = DEFAULT_SALT_ROUNDS) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('A valid plaintext password string is required for hashing.');
  }
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainPassword, salt);
}

/**
 * Verify a plaintext password against a stored bcrypt hash
 * @param {string} plainPassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>} True if password matches hash
 */
async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Validate strong password requirements
 * Policy:
 * 1. Minimum 8 characters
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one numeric digit (0-9)
 * 5. At least one special symbol (!@#$%^&*()_+-=[]{};':"|,.<>/?~`)
 * 
 * @param {string} password 
 * @returns {{ isValid: boolean, score: number, errors: string[], details: Object }}
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      errors: ['Password is required.'],
      details: {
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false
      }
    };
  }

  const details = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
  };

  if (!details.hasMinLength) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!details.hasUppercase) {
    errors.push('Password must include at least one uppercase letter (A-Z).');
  }
  if (!details.hasLowercase) {
    errors.push('Password must include at least one lowercase letter (a-z).');
  }
  if (!details.hasNumber) {
    errors.push('Password must include at least one number (0-9).');
  }
  if (!details.hasSpecialChar) {
    errors.push('Password must include at least one special character (!@#$%^&* etc.).');
  }

  const score = Object.values(details).filter(Boolean).length;

  return {
    isValid: errors.length === 0,
    score, // 0 to 5
    errors,
    details
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  DEFAULT_SALT_ROUNDS
};
