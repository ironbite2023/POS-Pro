// Production-ready logging service for inventory management system

interface LogContext {
  [key: string]: any;
}

interface LoggingService {
  error: (message: string, error?: Error, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
}

// Environment-aware logging service
class InventoryLoggingService implements LoggingService {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private sanitizeContext = (context: LogContext = {}): LogContext => {
    // Remove sensitive data that shouldn't be logged
    const sanitized = { ...context };
    
    // Remove potential sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;
    
    return sanitized;
  };

  private formatLogMessage = (level: string, message: string, context?: LogContext): string => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  };

  error = (message: string, error?: Error, context: LogContext = {}) => {
    const sanitizedContext = this.sanitizeContext({
      ...context,
      stack: error?.stack,
      errorMessage: error?.message,
      errorName: error?.name
    });

    if (this.isDevelopment) {
      console.error(this.formatLogMessage('error', message, sanitizedContext));
      if (error) {
        console.error('Error details:', error);
      }
    }

    if (this.isProduction) {
      // In production, send to external monitoring service
      // Example integrations:
      // - Sentry: Sentry.captureException(error, { extra: sanitizedContext, message });
      // - LogRocket: LogRocket.captureException(error);
      // - Custom service: sendToLoggingService('error', message, sanitizedContext);
      
      // For now, we'll use a structured console log that can be captured by log aggregation
      console.error(JSON.stringify({
        level: 'error',
        message,
        context: sanitizedContext,
        timestamp: new Date().toISOString(),
        service: 'inventory-management'
      }));
    }
  };

  warn = (message: string, context: LogContext = {}) => {
    const sanitizedContext = this.sanitizeContext(context);

    if (this.isDevelopment) {
      console.warn(this.formatLogMessage('warn', message, sanitizedContext));
    }

    if (this.isProduction) {
      console.warn(JSON.stringify({
        level: 'warn',
        message,
        context: sanitizedContext,
        timestamp: new Date().toISOString(),
        service: 'inventory-management'
      }));
    }
  };

  info = (message: string, context: LogContext = {}) => {
    const sanitizedContext = this.sanitizeContext(context);

    if (this.isDevelopment) {
      console.info(this.formatLogMessage('info', message, sanitizedContext));
    }

    if (this.isProduction) {
      // Only log important info in production to avoid noise
      console.info(JSON.stringify({
        level: 'info',
        message,
        context: sanitizedContext,
        timestamp: new Date().toISOString(),
        service: 'inventory-management'
      }));
    }
  };

  debug = (message: string, context: LogContext = {}) => {
    // Debug logs only in development
    if (this.isDevelopment) {
      const sanitizedContext = this.sanitizeContext(context);
      console.debug(this.formatLogMessage('debug', message, sanitizedContext));
    }
  };

  // Helper method for API operation logging
  apiCall = (operation: string, endpoint: string, context: LogContext = {}) => {
    this.debug(`API Call: ${operation}`, {
      ...context,
      endpoint,
      timestamp: new Date().toISOString()
    });
  };

  // Helper method for user action logging
  userAction = (action: string, userId?: string, context: LogContext = {}) => {
    this.info(`User Action: ${action}`, {
      ...context,
      userId,
      timestamp: new Date().toISOString()
    });
  };

  // Helper method for performance monitoring
  performance = (operation: string, duration: number, context: LogContext = {}) => {
    const level = duration > 2000 ? 'warn' : 'info';
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (level === 'warn') {
      this.warn(message, { ...context, duration });
    } else {
      this.debug(message, { ...context, duration });
    }
  };
}

// Export singleton instance
export const loggingService = new InventoryLoggingService();

// Export error wrapper for async operations
export const withErrorLogging = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  context: LogContext = {}
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    loggingService.debug(`Starting operation: ${operationName}`, context);
    const result = await operation();
    
    const duration = performance.now() - startTime;
    loggingService.performance(operationName, duration, { ...context, success: true });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    loggingService.error(
      `Operation failed: ${operationName}`, 
      error instanceof Error ? error : new Error(String(error)), 
      { ...context, duration, success: false }
    );
    
    throw error;
  }
};

// Export typed error classes for better error handling
export class InventoryValidationError extends Error {
  constructor(
    message: string, 
    public field: string, 
    public value?: any
  ) {
    super(message);
    this.name = 'InventoryValidationError';
  }
}

export class InventoryServiceError extends Error {
  constructor(
    message: string, 
    public operation: string, 
    public originalError?: Error
  ) {
    super(message);
    this.name = 'InventoryServiceError';
  }
}
