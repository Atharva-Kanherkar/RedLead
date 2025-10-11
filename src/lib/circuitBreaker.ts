// src/lib/circuitBreaker.ts
import { log } from './logger';

/**
 * Simple Circuit Breaker Implementation
 *
 * Protects against cascading failures when external services are down.
 * States: Closed (normal) → Open (failing) → Half-Open (testing) → Closed
 */

enum CircuitState {
    CLOSED = 'CLOSED',     // Normal operation
    OPEN = 'OPEN',         // Too many failures - rejecting calls
    HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerOptions {
    failureThreshold: number;  // Failures before opening
    successThreshold: number;  // Successes to close from half-open
    timeout: number;           // Time in ms before trying again
}

class SimpleCircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private nextAttempt = Date.now();
    private name: string;
    private options: CircuitBreakerOptions;

    constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
        this.name = name;
        this.options = {
            failureThreshold: options.failureThreshold || 5,
            successThreshold: options.successThreshold || 2,
            timeout: options.timeout || 30000
        };
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttempt) {
                log.warn('Circuit breaker rejecting call', {
                    service: this.name,
                    state: this.state
                });
                throw new Error(`Circuit breaker is OPEN for ${this.name}`);
            }
            // Try transitioning to half-open
            this.state = CircuitState.HALF_OPEN;
            log.info('Circuit breaker transitioning to HALF_OPEN', { service: this.name });
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.successCount = 0;
                log.info('Circuit breaker CLOSED', { service: this.name });
            }
        }
    }

    private onFailure() {
        this.failureCount++;
        this.successCount = 0;

        if (this.failureCount >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.options.timeout;
            log.error('Circuit breaker OPENED', {
                service: this.name,
                failureCount: this.failureCount
            });
        }
    }
}

// Global circuit breakers for each service
const breakers = new Map<string, SimpleCircuitBreaker>();

/**
 * Get or create circuit breaker for a service
 */
const getCircuitBreaker = (serviceName: string): SimpleCircuitBreaker => {
    if (!breakers.has(serviceName)) {
        breakers.set(serviceName, new SimpleCircuitBreaker(serviceName));
    }
    return breakers.get(serviceName)!;
};

/**
 * Wrap an async function with circuit breaker protection
 */
export const withCircuitBreaker = <T extends any[], R>(
    serviceName: string,
    fn: (...args: T) => Promise<R>
): ((...args: T) => Promise<R>) => {
    const breaker = getCircuitBreaker(serviceName);

    return async (...args: T): Promise<R> => {
        return await breaker.execute(() => fn(...args));
    };
};
