/**
 * Production-safe logging utility
 * Sanitizes sensitive data and reduces verbosity in production
 */

const isDev = __DEV__;
const isProduction = !isDev;

interface LogLevel {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: any = {};
  const sensitiveKeys = [
    'password',
    'token',
    'key',
    'secret',
    'authorization',
    'auth',
    'session',
    'access_token',
    'refresh_token',
    'api_key',
    'apikey',
    'service_role',
    'anon_key',
  ];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));

    if (isSensitive && typeof value === 'string') {
      // Truncate sensitive strings
      sanitized[key] = value.length > 10 ? `${value.substring(0, 10)}...` : '***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Production-safe logger
 */
export const logger: LogLevel = {
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args.map(sanitizeData));
    }
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.log('[INFO]', ...args.map(sanitizeData));
    }
  },
  warn: (...args: any[]) => {
    const sanitized = args.map(sanitizeData);
    console.warn('[WARN]', ...sanitized);
  },
  error: (...args: any[]) => {
    const sanitized = args.map(sanitizeData);
    console.error('[ERROR]', ...sanitized);
    // In production, you might want to send to error tracking service
    // Example: Sentry.captureException(error);
  },
};

/**
 * Log error without exposing sensitive data
 */
export function logError(error: Error | unknown, context?: string) {
  const errorObj = error instanceof Error ? {
    message: error.message,
    stack: isDev ? error.stack : undefined,
    name: error.name,
  } : error;

  logger.error(context ? `[${context}]` : '', sanitizeData(errorObj));
}

/**
 * Log user action (sanitized)
 */
export function logUserAction(action: string, metadata?: Record<string, any>) {
  if (isDev) {
    logger.info(`[USER ACTION] ${action}`, metadata ? sanitizeData(metadata) : '');
  }
}
