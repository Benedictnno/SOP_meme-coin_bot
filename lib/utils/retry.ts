// lib/utils/retry.ts - Centralized error handling with retry logic

/**
 * Executes a function with retry logic and exponential backoff
 * @param fn - The async function to execute
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @returns The result of the function or null if all retries fail
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T | null> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const isLastAttempt = i === retries - 1;

            if (isLastAttempt) {
                console.error(`Max retries (${retries}) reached:`, error);
                return null;
            }

            // Exponential backoff: delay * 2^attempt
            const backoffDelay = delay * Math.pow(2, i);
            console.warn(`Attempt ${i + 1} failed, retrying in ${backoffDelay}ms...`, error);

            await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
    }

    return null;
}

/**
 * Adds a delay to respect rate limits
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validates if a string is a valid Solana address (base58, 32-44 chars)
 * @param address - The address to validate
 * @returns True if valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
    // Solana addresses are base58 encoded and typically 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .trim()
        .slice(0, 1000); // Limit length to prevent abuse
}

/**
 * Formats a number as USD currency
 * @param value - The number to format
 * @returns Formatted currency string
 */
export function formatUSD(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formats a percentage value
 * @param value - The percentage value (e.g., 150 for 150%)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
}

/**
 * Truncates a Solana address for display
 * @param address - The full address
 * @param chars - Number of characters to show on each end (default: 4)
 * @returns Truncated address (e.g., "Abc1...xyz9")
 */
export function truncateAddress(address: string, chars: number = 4): string {
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
