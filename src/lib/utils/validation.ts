/**
 * Validation utilities for authentication and user input
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required'],
    };
  }

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else if (password.length >= 12) {
    score += 1;
  } else {
    score += 0.5;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common password check
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    feedback.push('Password is too common');
    score = Math.max(0, score - 2);
  }

  const isValid = feedback.length === 0 && password.length >= 8;

  return {
    isValid,
    score: Math.min(4, Math.floor(score)),
    feedback,
  };
};

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 255); // Limit length
};

/**
 * Sanitize organization name
 */
export const sanitizeOrganizationName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/[<>'"]/g, '')
    .substring(0, 100);
};

/**
 * Generate URL-safe slug from string
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validate phone number (basic international format)
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  
  // Allow international format: +[1-9][0-9]{0,14}
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
};

/**
 * Validate name (first name, last name)
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.length < 2 || name.length > 50) return false;
  
  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name);
};
