// src/lib/retry.ts
import { log } from './logger';

/**
 * Retry utility with exponential backoff
 *
 * Retries a function that returns a Promise with configurable attempts and delays.
 * Uses exponential backoff to prevent overwhelming external services.
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  onRetry: () => {}
};

/**
 * Retries an async function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) {
        log.error('Retry failed after all attempts', lastError, {
          attempts: opts.maxAttempts,
          finalError: lastError.message
        });
        throw lastError;
      }

      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );

      log.warn('Retry attempt', {
        attempt,
        maxAttempts: opts.maxAttempts,
        nextRetryIn: delay,
        error: lastError.message
      });

      opts.onRetry(attempt, lastError);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Checks if an error is retryable (network errors, timeouts, 5xx errors)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED') {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  // Rate limit errors (429) - retry after delay
  if (error.response?.status === 429) {
    return true;
  }

  return false;
}

/**
 * Retry wrapper specifically for HTTP requests
 * Only retries on network errors and 5xx status codes
 */
export async function retryHttp<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retry(async () => {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableError(error)) {
        // Not a retryable error, throw immediately
        throw error;
      }
      // Retryable error, let retry mechanism handle it
      throw error;
    }
  }, options);
}
