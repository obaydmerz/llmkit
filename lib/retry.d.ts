/**
 * Checks if an error can be caught based on the error instance, allowed errors, and retry counter.
 *
 * @param {Error} errorInstance - The error instance to check.
 * @param {number | Record<string, number>} errors - The allowed number of retries for errors.
 * @param {number} [counter=0] - The current retry counter.
 * @returns {boolean} - Returns true if the error can be caught, otherwise false.
 */
declare function canCatchError(
  errorInstance: Error,
  errors: number | Record<string, number>,
  counter?: number
): boolean;

/**
 * Creates a retry-enabled version of the provided function with specified options.
 *
 * @param {Function} func - The function to be retried.
 * @param {Object} [options] - Retry options.
 * @param {number} [options.minCooldown=1000] - Minimum cooldown time between retries in milliseconds.
 * @param {number} [options.maxCooldown=5000] - Maximum cooldown time between retries in milliseconds.
 * @param {number | Record<string, number>} [options.errors=10] - Allowed number of retries for errors.
 * @param {number} [options.maxRetries=10] - Maximum number of retries.
 * @returns {Function} - The retry-enabled function.
 */
declare function createRetry(
  func: (retryNum?: number, ...originalArgs: any[]) => Promise<any>,
  options?: {
    minCooldown?: number;
    maxCooldown?: number;
    errors?: number | Record<string, number>;
    maxRetries?: number;
  }
): Function;

/**
 * Retries a function based on the provided options until it succeeds or the maximum retries are reached.
 *
 * @param {Function} func - The function to be retried.
 * @param {Object} [options] - Retry options.
 * @param {number} [options.minCooldown=1000] - Minimum cooldown time between retries in milliseconds.
 * @param {number} [options.maxCooldown=5000] - Maximum cooldown time between retries in milliseconds.
 * @param {number | Record<string, number>} [options.errors=10] - Allowed number of retries for errors.
 * @param {number} [options.maxRetries=10] - Maximum number of retries.
 * @returns {Promise<any>} - The result of the function if it succeeds within the allowed retries, otherwise the last occurred error.
 */
declare function retry(
  func: (retryNum?: number) => Promise<any>,
  options?: {
    minCooldown?: number;
    maxCooldown?: number;
    errors?: number | Record<string, number>;
    maxRetries?: number;
  }
): Promise<any>;

export { retry, createRetry };
