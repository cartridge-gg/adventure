import { AccountInterface, Call } from 'starknet';

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

/**
 * Parses contract error messages and returns user-friendly error descriptions.
 *
 * Handles common contract error patterns including:
 * - Already minted errors
 * - Level completion errors
 * - Ownership errors
 * - Signature/proof validation errors
 * - Generic fallback for unknown errors
 *
 * @param err - The error object from a contract call
 * @returns A user-friendly error message string
 *
 * @example
 * ```typescript
 * try {
 *   await contract.execute(...);
 * } catch (err) {
 *   const message = parseContractError(err);
 *   console.error(message);
 * }
 * ```
 */
export function parseContractError(err: any): string {
  // Return generic message if no error message exists
  if (!err?.message) {
    return 'An unknown error occurred';
  }

  const errorMessage = err.message;

  // Minting errors
  if (errorMessage.includes('Already owns an Adventure Map')) {
    return 'You already have an Adventure Map. Only one per wallet is allowed.';
  }

  // Ownership errors
  if (errorMessage.includes('Not map owner') || errorMessage.includes('not the owner')) {
    return 'You do not own this Adventure Map';
  }

  // Level completion errors
  if (errorMessage.includes('Level already complete')) {
    return 'You have already completed this level';
  }

  if (errorMessage.includes('Level not found') || errorMessage.includes('Invalid level')) {
    return 'This level does not exist or is not configured';
  }

  if (errorMessage.includes('Previous level not complete')) {
    return 'You must complete the previous level first';
  }

  // Signature/proof validation errors
  if (errorMessage.includes('Invalid solution') || errorMessage.includes('Invalid signature')) {
    return 'Invalid codeword. Please check and try again.';
  }

  if (errorMessage.includes('Score too low') || errorMessage.includes('Insufficient score')) {
    return 'Your score is too low to complete this level';
  }

  if (errorMessage.includes('Game not complete')) {
    return 'You must complete the game first';
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
 * @param label - Optional label for logging (e.g., "Mint Transaction", "Complete Level Transaction")
 * @returns The transaction result from account.execute()
 * @throws Error if the transaction execution reverted
 *
 * @example
 * ```typescript
 * const result = await executeTx(
 *   account,
 *   {
 *     contractAddress: contractAddr,
 *     entrypoint: 'mint',
 *     calldata: [username]
 *   },
 *   'Mint Transaction'
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
