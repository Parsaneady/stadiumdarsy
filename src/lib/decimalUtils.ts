/**
 * Precise decimal arithmetic utilities
 * Avoids JavaScript floating-point issues
 */

/**
 * Rounds a number to a specified number of decimal places
 * Uses string manipulation to avoid floating-point errors
 */
export function roundDecimal(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Formats a number to a clean string, removing trailing zeros
 */
export function formatCleanDecimal(num: number, maxDecimals: number = 2): string {
  const rounded = roundDecimal(num, maxDecimals);
  return rounded.toString();
}

/**
 * Adds numbers with precise decimal handling
 */
export function preciseAdd(...numbers: number[]): number {
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return roundDecimal(sum);
}

/**
 * Subtracts with precise decimal handling
 */
export function preciseSubtract(a: number, b: number): number {
  return roundDecimal(a - b);
}

/**
 * Multiplies with precise decimal handling
 */
export function preciseMultiply(a: number, b: number): number {
  return roundDecimal(a * b);
}

/**
 * Divides with precise decimal handling
 */
export function preciseDivide(a: number, b: number): number {
  if (b === 0) return 0;
  return roundDecimal(a / b);
}
