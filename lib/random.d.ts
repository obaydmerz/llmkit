/**
 * Generates a random float between the minimum and maximum values.
 * @param minimum - The minimum value.
 * @param maximum - The maximum value.
 * @returns A random float between the minimum and maximum values.
 */
export function RandomFloat(minimum: number, maximum: number): number;

/**
 * Generates a random integer between the minimum and maximum values.
 * @param minimum - The minimum value.
 * @param maximum - The maximum value.
 * @returns A random integer between the minimum and maximum values.
 */
export function Random(minimum: number, maximum: number): number;

/**
 * Picks a random element from an array.
 * @param array - The array to pick an element from.
 * @returns A random element from the array.
 */
export function PickRandom<T>(array: T[]): T;
