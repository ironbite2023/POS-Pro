/**
 * Advanced Data Sanitization System for Developer Hub
 * Prevents sensitive data exposure while maintaining debugging capability
 */

interface SanitizationOptions {
  maxDepth: number;
  maxStringLength: number;
  allowedFields: string[];
  sensitivePatterns: RegExp[];
  maskingChar: string;
  preserveStructure: boolean;
}

interface SanitizationResult {
  data: unknown;
  sensitiveFieldsFound: string[];
  truncatedFields: string[];
}

// Default sensitive field patterns
const DEFAULT_SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /auth/i,
  /bearer/i,
  /api[-_]?key/i,
  /access[-_]?token/i,
  /refresh[-_]?token/i,
  /client[-_]?secret/i,
  /private/i,
  /signature/i,
  /hash/i,
];

// Fields that should never be displayed
const BLACKLISTED_FIELDS = [
  'password',
  'client_secret',
  'api_token',
  'private_key',
  'webhook_secret',
  'access_token',
  'refresh_token',
];

// Default configuration
const DEFAULT_OPTIONS: SanitizationOptions = {
  maxDepth: 5,
  maxStringLength: 500,
  allowedFields: [],
  sensitivePatterns: DEFAULT_SENSITIVE_PATTERNS,
  maskingChar: '•',
  preserveStructure: true,
};

/**
 * Comprehensive data sanitization utility
 */
export class DataSanitizer {
  private options: SanitizationOptions;

  constructor(options: Partial<SanitizationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Main sanitization method
   */
  sanitize(data: unknown, depth = 0): SanitizationResult {
    const result: SanitizationResult = {
      data: null,
      sensitiveFieldsFound: [],
      truncatedFields: [],
    };

    try {
      result.data = this.sanitizeValue(data, depth, result);
      return result;
    } catch (error) {
      console.error('Data sanitization failed:', error);
      return {
        data: '[SANITIZATION_ERROR]',
        sensitiveFieldsFound: [],
        truncatedFields: [],
      };
    }
  }

  /**
   * Sanitize individual values based on type
   */
  private sanitizeValue(value: unknown, depth: number, result: SanitizationResult): unknown {
    // Prevent infinite recursion
    if (depth > this.options.maxDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle primitives
    if (typeof value === 'string') {
      return this.sanitizeString(value, result);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => 
        this.sanitizeValue(item, depth + 1, result)
      ).slice(0, 100); // Limit array size for display
    }

    // Handle objects
    if (typeof value === 'object') {
      return this.sanitizeObject(value as Record<string, unknown>, depth, result);
    }

    return '[UNKNOWN_TYPE]';
  }

  /**
   * Sanitize object properties
   */
  private sanitizeObject(obj: Record<string, unknown>, depth: number, result: SanitizationResult): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if field is blacklisted
      if (BLACKLISTED_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
        result.sensitiveFieldsFound.push(key);
        continue;
      }

      // Check if field matches sensitive patterns
      if (this.isSensitiveField(key)) {
        sanitized[key] = this.maskValue(value);
        result.sensitiveFieldsFound.push(key);
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = this.sanitizeValue(value, depth + 1, result);
    }

    return sanitized;
  }

  /**
   * Sanitize string values
   */
  private sanitizeString(str: string, result: SanitizationResult): string {
    // Truncate long strings
    if (str.length > this.options.maxStringLength) {
      result.truncatedFields.push(`string_${str.substring(0, 20)}...`);
      return str.substring(0, this.options.maxStringLength) + '[TRUNCATED]';
    }

    // Check for potential sensitive content in string
    if (this.containsSensitiveContent(str)) {
      return this.maskValue(str);
    }

    return str;
  }

  /**
   * Check if field name suggests sensitive content
   */
  private isSensitiveField(fieldName: string): boolean {
    return this.options.sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  /**
   * Check if string content appears sensitive
   */
  private containsSensitiveContent(str: string): boolean {
    // Check for JWT tokens
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/.test(str)) {
      return true;
    }

    // Check for API keys (long alphanumeric strings)
    if (/^[A-Za-z0-9]{32,}$/.test(str)) {
      return true;
    }

    // Check for bearer tokens
    if (str.toLowerCase().startsWith('bearer ')) {
      return true;
    }

    return false;
  }

  /**
   * Mask sensitive values appropriately
   */
  private maskValue(value: unknown): string {
    if (typeof value === 'string') {
      if (value.length <= 8) {
        return this.options.maskingChar.repeat(value.length);
      }
      // Show first and last few characters
      const start = value.substring(0, 3);
      const end = value.substring(value.length - 3);
      const middle = this.options.maskingChar.repeat(Math.min(10, value.length - 6));
      return `${start}${middle}${end}`;
    }

    return `[MASKED_${typeof value}]`;
  }

  /**
   * Create display-safe object for UI components
   */
  static createDisplaySafeData(data: unknown, options?: Partial<SanitizationOptions>): {
    displayData: unknown;
    hasSensitiveData: boolean;
    warnings: string[];
  } {
    const sanitizer = new DataSanitizer(options);
    const result = sanitizer.sanitize(data);

    return {
      displayData: result.data,
      hasSensitiveData: result.sensitiveFieldsFound.length > 0,
      warnings: [
        ...result.sensitiveFieldsFound.map(field => `Sensitive field detected: ${field}`),
        ...result.truncatedFields.map(field => `Field truncated: ${field}`),
      ],
    };
  }

  /**
   * Quick sanitization for webhook payloads
   */
  static sanitizeWebhookPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const sanitizer = new DataSanitizer({
      maxStringLength: 200,
      maxDepth: 3,
    });

    const result = sanitizer.sanitize(payload);
    return result.data as Record<string, unknown>;
  }

  /**
   * Sanitize test results for display
   */
  static sanitizeTestResult(testResult: Record<string, unknown>): Record<string, unknown> {
    const sanitizer = new DataSanitizer({
      maxStringLength: 1000,
      maxDepth: 4,
    });

    const result = sanitizer.sanitize(testResult);
    return result.data as Record<string, unknown>;
  }
}
