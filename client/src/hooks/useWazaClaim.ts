import { useCallback } from 'react';

import { splitTokenIdToU256 } from '@/lib/utils';
import { useTrialTransaction } from './useTrialTransaction';

interface UseWazaClaimReturn {
  tryCollection: (collectionAddress: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useWazaClaim(tokenId: string, onSuccess?: () => void): UseWazaClaimReturn {
  const { execute, isLoading, error } = useTrialTransaction({
    entrypoint: 'complete_waza',
    label: 'Waza Trial Transaction',
    onSuccess,
  });

  // Try to complete Waza trial with a specific collection
  const tryCollection = useCallback(
    async (collectionAddress: string) => {
      // Call complete_waza on Quest Manager contract directly
      // The contract will verify ownership
      const { low, high } = splitTokenIdToU256(tokenId);
      await execute([low, high, collectionAddress]);
    },
    [tokenId, execute]
  );

  return {
    tryCollection,
    isLoading,
    error,
  };
}
