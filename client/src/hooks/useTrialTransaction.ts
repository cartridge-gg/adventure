import { useState, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { Call } from 'starknet';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { executeTx } from '@/lib/utils';
import { ERROR_TEXT } from '@/lib/uiText';

interface UseTrialTransactionOptions {
  /**
   * The contract entrypoint to call on the Quest Manager
   */
  entrypoint: string;

  /**
   * Label for transaction logging
   */
  label: string;

  /**
   * Optional success callback invoked after transaction confirmation
   */
  onSuccess?: () => void;

  /**
   * Optional custom error parser function
   * @param err - The error object to parse
   * @returns A human-readable error message
   */
  parseError?: (err: any) => string;
}

interface UseTrialTransactionReturn {
  /**
   * Executes a trial transaction with the provided calldata
   * @param calldata - The calldata array to pass to the contract entrypoint
   */
  execute: (calldata: any[]) => Promise<void>;

  /**
   * Whether a transaction is currently in progress
   */
  isLoading: boolean;

  /**
   * Error message if transaction failed, null otherwise
   */
  error: string | null;
}

/**
 * Base hook for trial transaction execution.
 *
 * Consolidates common transaction patterns:
 * - Account/address validation
 * - Loading/error state management
 * - Transaction execution with executeTx
 * - Success callback invocation
 * - Error parsing
 *
 * @param options - Configuration for the trial transaction
 * @returns Transaction execution interface
 *
 * @example
 * ```typescript
 * const { tokenId } = useTrialProgress();
 * const { execute, isLoading, error } = useTrialTransaction({
 *   entrypoint: 'complete_chi',
 *   label: 'Chi Trial Transaction',
 *   onSuccess: () => console.log('Success!'),
 *   parseError: (err) => parseContractError(err),
 * });
 *
 * // Execute with custom calldata
 * await execute([tokenId, '0', ...otherArgs]);
 * ```
 */
export function useTrialTransaction(
  options: UseTrialTransactionOptions
): UseTrialTransactionReturn {
  const { entrypoint, label, onSuccess, parseError } = options;
  const { account, address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (calldata: string[]): Promise<void> => {
      if (!account || !address) {
        setError(ERROR_TEXT.walletNotConnected);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const call: Call = {
          contractAddress: QUEST_MANAGER_ADDRESS,
          entrypoint,
          calldata,
        };

        await executeTx(account, [call], label);

        // Call success callback to trigger progress refetch
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.error(`Error in ${label}:`, err);

        // Use custom error parser if provided, otherwise use generic message
        const errorMessage = parseError
          ? parseError(err)
          : err?.message || `Failed to execute ${label}`;

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [account, address, entrypoint, label, onSuccess, parseError]
  );

  return {
    execute,
    isLoading,
    error,
  };
}
