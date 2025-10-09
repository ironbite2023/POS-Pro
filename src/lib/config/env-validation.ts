/**
 * Environment Variable Validation
 * Ensures all required configuration is present for secure operation
 */

interface EnvConfig {
  // Supabase Configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string; // Only required for server-side operations

  // Application Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL?: string;

  // Optional Configuration
  REDIS_URL?: string;
  SENTRY_DSN?: string;
  LOG_LEVEL?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvConfig>;
}

/**
 * Validate that all required environment variables are present and correctly formatted
 */
export const validateRequiredEnvVars = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Partial<EnvConfig> = {};

  // Required variables for all environments
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  // Server-side only variables (only required in production or when running server functions)
  const serverRequiredVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const isProduction = process.env.NODE_ENV === 'production';
  const isServerSide = typeof window === 'undefined';

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    } else if (value === 'placeholder-key' || value === 'https://placeholder.supabase.co') {
      errors.push(`Environment variable ${varName} contains placeholder value: ${value}`);
    } else {
      // Validate format
      if (varName.includes('SUPABASE_URL') && !value.startsWith('https://')) {
        errors.push(`${varName} must start with https://`);
      }
      
      // Store validated config
      const configKey = varName.replace('NEXT_PUBLIC_', '') as keyof EnvConfig;
      (config as any)[configKey] = value;
    }
  }

  // Check server-side variables if needed
  if (isServerSide || isProduction) {
    for (const varName of serverRequiredVars) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        if (isProduction) {
          errors.push(`Missing required server environment variable: ${varName}`);
        } else {
          warnings.push(`Missing server environment variable: ${varName} (may be needed for full functionality)`);
        }
      } else if (value === 'placeholder-key') {
        errors.push(`Server environment variable ${varName} contains placeholder value`);
      } else {
        const configKey = varName as keyof EnvConfig;
        (config as any)[configKey] = value;
      }
    }
  }

  // Set NODE_ENV
  config.NODE_ENV = (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development';

  // Check optional but recommended variables
  const recommendedVars = {
    'NEXT_PUBLIC_APP_URL': 'Application URL for proper redirects',
    'REDIS_URL': 'Redis connection for production rate limiting',
    'SENTRY_DSN': 'Error tracking and monitoring',
  };

  for (const [varName, description] of Object.entries(recommendedVars)) {
    const value = process.env[varName];
    if (!value && isProduction) {
      warnings.push(`Missing recommended environment variable: ${varName} (${description})`);
    } else if (value) {
      const configKey = varName.replace('NEXT_PUBLIC_', '') as keyof EnvConfig;
      (config as any)[configKey] = value;
    }
  }

  // Additional validation
  if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
    // Basic format validation
    if (!config.SUPABASE_URL.includes('.supabase.co')) {
      warnings.push('SUPABASE_URL format may be incorrect (expected: *.supabase.co)');
    }
    
    if (config.SUPABASE_ANON_KEY.length < 100) {
      warnings.push('SUPABASE_ANON_KEY appears to be too short (expected JWT format)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config,
  };
};

/**
 * Validate environment variables and throw on critical errors
 */
export const validateEnvironmentOrThrow = (): EnvConfig => {
  const result = validateRequiredEnvVars();
  
  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('🟡 Environment Configuration Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Throw on errors
  if (!result.isValid) {
    console.error('🔴 Environment Configuration Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
  }

  console.log('✅ Environment configuration validated successfully');
  return result.config as EnvConfig;
};

/**
 * Get validated environment configuration (safe version that doesn't throw)
 */
export const getValidatedEnvConfig = (): ValidationResult => {
  try {
    return validateRequiredEnvVars();
  } catch (error) {
    console.error('Failed to validate environment variables:', error);
    return {
      isValid: false,
      errors: ['Failed to read environment variables'],
      warnings: [],
      config: {},
    };
  }
};

/**
 * Check if we're in a secure environment (production with proper config)
 */
export const isSecureEnvironment = (): boolean => {
  const result = validateRequiredEnvVars();
  
  return (
    result.isValid &&
    result.config.NODE_ENV === 'production' &&
    result.config.SUPABASE_URL?.startsWith('https://') === true &&
    result.warnings.length === 0
  );
};

/**
 * Development helper to show environment status
 */
export const logEnvironmentStatus = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const result = validateRequiredEnvVars();
    
    console.log('🔧 Environment Status:');
    console.log(`  Environment: ${result.config.NODE_ENV}`);
    console.log(`  Supabase URL: ${result.config.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Supabase Anon Key: ${result.config.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Service Role Key: ${result.config.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '⚠️ Missing'}`);
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => console.log(`    ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('⚠️ Warnings:');
      result.warnings.forEach(warning => console.log(`    ${warning}`));
    }
  }
};
