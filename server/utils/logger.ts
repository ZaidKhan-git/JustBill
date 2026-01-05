/**
 * Error logging utility for Just Bill
 * In development: logs to console
 * In production: can be extended to external services (Sentry, etc.)
 */

interface LogContext {
    service: string;
    term?: string;
    error?: unknown;
    response?: unknown;
}

/**
 * Log an error to the error service
 * Currently logs to console, can be extended to external services
 */
export function logErrorToService(message: string, context: LogContext): void {
    const timestamp = new Date().toISOString();
    const isDev = process.env.NODE_ENV !== 'production';

    const logEntry = {
        timestamp,
        level: 'error',
        message,
        ...context,
    };

    if (isDev) {
        console.error(`❌ [${context.service}] ${message}`, logEntry);
    } else {
        // In production, send to external logging service
        // Example: Sentry.captureException(context.error, { extra: logEntry });
        console.error(JSON.stringify(logEntry));
    }
}

/**
 * Log a warning
 */
export function logWarning(message: string, context: LogContext): void {
    const timestamp = new Date().toISOString();

    console.warn(`⚠️ [${context.service}] ${message}`, {
        timestamp,
        level: 'warning',
        message,
        ...context,
    });
}

/**
 * Log info (for debugging)
 */
export function logInfo(message: string, context: Omit<LogContext, 'error'>): void {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`ℹ️ [${context.service}] ${message}`, context);
    }
}
