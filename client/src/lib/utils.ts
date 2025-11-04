import { AccountInterface, Call } from 'starknet';
import { TrialStatus } from './types';

/**
 * Splits a token ID string into u256 components (low, high).
 *
 * In Starknet, u256 values are represented as two 128-bit components:
 * - low: the lower 128 bits
 * - high: the upper 128 bits
 *
 * @param tokenId - The token ID as a string or number
 * @returns An object containing the low and high components as strings
 *
 * @example
 * ```typescript
 * const { low, high } = splitTokenIdToU256("123456789");
 * // Returns: { low: "123456789", high: "0" }
 * ```
 */
export function splitTokenIdToU256(tokenId: string | number): { low: string; high: string } {
  const tokenIdBigInt = BigInt(tokenId);
  const low = tokenIdBigInt & ((1n << 128n) - 1n);
  const high = tokenIdBigInt >> 128n;

  return {
    low: low.toString(),
    high: high.toString(),
  };
}

interface FormatDurationOptions {
  /**
   * Whether to show seconds in the output.
   * @default false
   */
  showSeconds?: boolean;

  /**
   * Whether to use verbose output with full time unit names and pluralization.
   * When false, uses short format (e.g., "1h 30m").
   * When true, uses long format (e.g., "1 hour", "30 minutes").
   * @default false
   */
  verbose?: boolean;
}

/**
 * Formats a duration in seconds into a human-readable string.
 *
 * Supports two formatting modes:
 * - Short format (default): "1h 30m", "45m", "30s"
 * - Verbose format: "1 hour", "30 minutes", "45 seconds" (with proper pluralization)
 *
 * @param seconds - The duration in seconds
 * @param options - Formatting options
 * @returns A formatted duration string
 *
 * @example
 * ```typescript
 * formatDuration(3665); // "1h 1m"
 * formatDuration(3665, { showSeconds: true }); // "1h 1m 5s"
 * formatDuration(3600, { verbose: true }); // "1 hour"
 * formatDuration(7200, { verbose: true }); // "2 hours"
 * formatDuration(90, { verbose: true }); // "1 minute"
 * formatDuration(45); // "45s"
 * formatDuration(45, { verbose: true }); // "45 seconds"
 * ```
 */
export function formatDuration(seconds: number, options: FormatDurationOptions = {}): string {
  const { showSeconds = false, verbose = false } = options;

  // Handle edge cases
  if (seconds < 0) {
    return verbose ? '0 seconds' : '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (verbose) {
    // Verbose format with full words and pluralization
    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    }

    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }

    // For verbose mode, always show seconds if it's the only unit or if showSeconds is true
    if ((showSeconds && secs > 0) || (hours === 0 && minutes === 0)) {
      parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
    }

    return parts.join(' ') || '0 seconds';
  } else {
    // Short format
    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}h`);
    }

    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }

    // For short format, show seconds if:
    // 1. showSeconds is true and there are seconds to show, OR
    // 2. There are no hours or minutes (duration is less than a minute)
    if ((showSeconds && secs > 0) || (hours === 0 && minutes === 0)) {
      parts.push(`${secs}s`);
    }

    return parts.join(' ') || '0s';
  }
}

/**
 * Parses contract error messages and returns user-friendly error descriptions.
 *
 * Handles common contract error patterns including:
 * - Time lock errors (shows duration with proper formatting)
 * - Ownership errors
 * - Validation errors
 * - Quiz submission errors
 * - Generic fallback for unknown errors
 *
 * @param err - The error object from a contract call
 * @param timeLockDuration - Optional time lock duration in seconds (for time-locked operations)
 * @returns A user-friendly error message string
 *
 * @example
 * ```typescript
 * try {
 *   await contract.execute(...);
 * } catch (err) {
 *   const message = parseContractError(err, 86400);
 *   console.error(message);
 * }
 * ```
 */
export function parseContractError(err: any, timeLockDuration?: number): string {
  // Return generic message if no error message exists
  if (!err?.message) {
    return 'An unknown error occurred';
  }

  const errorMessage = err.message;

  // Time lock errors
  if (errorMessage.includes('Time lock not elapsed')) {
    if (timeLockDuration) {
      const formattedDuration = formatDuration(timeLockDuration, { verbose: true });
      return `You must wait ${formattedDuration} after minting before completing this trial`;
    }
    return 'The time lock has not elapsed yet';
  }

  // Ownership errors
  if (errorMessage.includes('Not token owner') || errorMessage.includes('not the owner')) {
    return 'You do not own this token';
  }

  // Validation errors
  if (errorMessage.includes('Vow cannot be empty')) {
    return 'Please write your vow';
  }

  if (errorMessage.includes('cannot be empty') || errorMessage.includes('required')) {
    return 'Please provide all required information';
  }

  // Quiz-specific errors
  if (errorMessage.includes('incorrect') || errorMessage.includes('Incorrect answers')) {
    return 'Not enough correct answers. You need at least 3 correct to pass.';
  }

  // Completion status errors
  if (errorMessage.includes('already completed')) {
    return 'You have already completed this trial';
  }

  if (errorMessage.includes('not eligible') || errorMessage.includes('cannot complete')) {
    return 'You are not eligible to complete this trial';
  }

  // Transaction errors
  if (errorMessage.includes('rejected') || errorMessage.includes('User rejected')) {
    return 'Transaction was rejected';
  }

  if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
    return 'Insufficient funds to complete this transaction';
  }

  // Generic fallback - return the original message if no pattern matches
  return errorMessage;
}

/**
 * Executes a transaction on Starknet and waits for confirmation.
 *
 * This helper function simplifies the process of executing transactions by:
 * - Executing the transaction call(s)
 * - Logging the transaction hash
 * - Waiting for transaction confirmation
 * - Checking transaction execution status (success vs reverted)
 * - Throwing an error if the transaction reverted
 * - Providing optional labeled logging for different transaction types
 *
 * @param account - The Starknet account interface to execute the transaction from
 * @param calls - The transaction call(s) to execute (single Call or array of Calls)
 * @param label - Optional label for logging (e.g., "Waza Trial Transaction", "Chi Trial Transaction")
 * @returns The transaction result from account.execute()
 * @throws Error if the transaction execution reverted
 *
 * @example
 * ```typescript
 * const result = await executeTx(
 *   account,
 *   {
 *     contractAddress: contractAddr,
 *     entrypoint: 'complete_trial',
 *     calldata: [tokenId]
 *   },
 *   'Waza Trial Transaction'
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Execute multiple calls in one transaction
 * const result = await executeTx(
 *   account,
 *   [
 *     { contractAddress: addr1, entrypoint: 'approve', calldata: [...] },
 *     { contractAddress: addr2, entrypoint: 'transfer', calldata: [...] }
 *   ],
 *   'Multi-call Transaction'
 * );
 * ```
 */
export async function executeTx(
  account: AccountInterface,
  calls: Call | Call[],
  label?: string
) {
  if (label) {
    console.log(`=== ${label} ===`);
  }

  const tx = await account.execute(calls);
  console.log(`Tx hash: ${tx.transaction_hash}`);

  const receipt = await account.waitForTransaction(tx.transaction_hash);
  console.log('Tx confirmed!');

  // Check if the transaction execution was successful
  // In Starknet, a transaction can be "confirmed" (included in a block) even if it reverted
  if (receipt.isReverted()) {
    const revertReason = (receipt as any).revert_reason || 'Transaction execution failed';
    console.error('Transaction reverted:', revertReason);
    throw new Error(revertReason);
  }

  return tx;
}

/**
 * Returns a set of boolean flags based on the trial status.
 *
 * This utility provides convenient boolean flags for common trial status checks,
 * reducing duplication across trial components.
 *
 * @param status - The current status of the trial
 * @returns An object containing boolean flags for different status states
 *
 * @example
 * ```typescript
 * const { isDisabled, isCompleted, isAvailable, isLocked } = getTrialStatusFlags('completed');
 * // Returns: { isDisabled: true, isCompleted: true, isAvailable: false, isLocked: false }
 * ```
 */
export function getTrialStatusFlags(status: TrialStatus) {
  return {
    isDisabled: status === 'completed' || status === 'locked',
    isCompleted: status === 'completed',
    isAvailable: status === 'available',
    isLocked: status === 'locked',
  };
}
