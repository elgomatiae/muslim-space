/**
 * Network request utilities with exponential backoff and timeout
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeout?: number;
  retryable?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  timeout: 30000, // 30 seconds
  retryable: (error: any) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (!error) return false;
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.message?.includes('network') || error.message?.includes('timeout')) return true;
    return false;
  },
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  const delay = initialDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Execute request with timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Execute request with exponential backoff retry
 */
export async function retryWithBackoff<T>(
  requestFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await withTimeout(requestFn(), opts.timeout);
      return result;
    } catch (error: any) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!opts.retryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts.initialDelay, opts.maxDelay);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const { getNetworkStateAsync } = await import('expo-network');
    const networkState = await getNetworkStateAsync();
    return networkState.isConnected ?? false;
  } catch {
    // If network check fails, assume online
    return true;
  }
}
