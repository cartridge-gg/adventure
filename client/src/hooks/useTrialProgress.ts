import { useMemo } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { QUEST_MANAGER_ADDRESS, QUEST_MANAGER_ABI, RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { TrialProgress } from '@/lib/types';
import { Abi } from 'starknet';

interface UseTrialProgressReturn {
  progress: TrialProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  hasNFT: boolean;
  tokenId: string | null;
}

export function useTrialProgress(): UseTrialProgressReturn {
  const { address } = useAccount();

  // Get token_id from Quest Manager (reads PlayerToken model)
  const {
    data: tokenIdData,
    isPending: tokenIdIsPending,
  } = useReadContract({
    abi: QUEST_MANAGER_ABI as Abi,
    address: QUEST_MANAGER_ADDRESS as `0x${string}`,
    functionName: 'get_player_token_id',
    args: [address || '0x0'],
    enabled: !!address && !!QUEST_MANAGER_ADDRESS,
  });

  // Extract token_id
  const tokenId = useMemo(() => {
    if (!tokenIdData || !address) {
      return null;
    }
    const tokenIdValue = tokenIdData as bigint;
    return tokenIdValue > 0n ? tokenIdValue.toString() : null;
  }, [tokenIdData, address]);

  // Derive hasNFT from tokenId (if we have a token_id, we have an NFT)
  const hasNFT = !!tokenId;

  // Fetch progress from contract using token_id
  const {
    data: progressData,
    isPending: progressIsPending,
    error: progressError,
    refetch,
  } = useReadContract({
    abi: RONIN_PACT_ABI as Abi,
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    functionName: 'get_progress',
    args: [tokenId ? BigInt(tokenId) : 0n],
    enabled: hasNFT && !!tokenId && !!RONIN_PACT_ADDRESS,
  });

  // Parse progress data
  const progress = useMemo(() => {
    if (!address || !hasNFT || !progressData) return null;
    const data = progressData as any;
    return {
      waza_complete: Boolean(data.waza_complete),
      chi_complete: Boolean(data.chi_complete),
      shin_complete: Boolean(data.shin_complete),
    };
  }, [progressData, address, hasNFT, tokenId]);

  // Only check progressIsPending if we're actually querying for progress (i.e., hasNFT is true)
  const isLoading = address ? (tokenIdIsPending || (hasNFT && progressIsPending)) : false;

  return {
    progress,
    isLoading,
    error: progressError?.message || null,
    refetch,
    hasNFT,
    tokenId,
  };
}
