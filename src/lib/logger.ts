// src/lib/logger.ts
import winston from 'winston';

/**
 * Structured Logger using Winston
 *
 * Provides consistent, structured logging across the application with:
 * - Log levels: error, warn, info, debug
 * - JSON formatting for easy parsing
 * - Timestamps on all logs
 * - Environment-aware configuration
 */

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'redlead-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          let metaString = '';
          if (Object.keys(meta).length > 0) {
            metaString = ` ${JSON.stringify(meta)}`;
          }
          return `${timestamp} [${service}] ${level}: ${message}${metaString}`;
        })
      )
    }),

    // Write errors to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, also log to console with pretty formatting
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

/**
 * Helper functions for common logging patterns
 */
export const log = {
  // Log an informational message
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  // Log a warning
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  // Log an error
  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    const errorMeta = error instanceof Error
      ? { error: error.message, stack: error.stack, ...meta }
      : { error, ...meta };
    logger.error(message, errorMeta);
  },

  // Log a debug message
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },

  // Log HTTP requests
  http: (method: string, path: string, statusCode: number, duration: number, meta?: Record<string, any>) => {
    logger.info('HTTP Request', {
      method,
      path,
      statusCode,
      duration,
      ...meta
    });
  },

  // Log database operations
  db: (operation: string, table: string, duration?: number, meta?: Record<string, any>) => {
    logger.debug('Database Operation', {
      operation,
      table,
      duration,
      ...meta
    });
  }
};

export default logger;
