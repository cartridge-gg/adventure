/**
 * Hook for managing adventure progress
 *
 * Queries the contract to get player's NFT and progress data
 */

import { useMemo } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { Abi } from 'starknet';
import { AdventureProgress } from '../lib/adventureTypes';
import { TOTAL_LEVELS } from '../lib/adventureConfig';
import { ADVENTURE_ADDRESS, ADVENTURE_ABI, MAP_ADDRESS, MAP_ABI } from '../lib/config';

export function useAdventureProgress() {
  const { address } = useAccount();

  // Get token_id from Adventure contract (reads PlayerToken model)
  const {
    data: tokenIdData,
    isPending: tokenIdIsPending,
    error: tokenIdError,
  } = useReadContract({
    abi: ADVENTURE_ABI as Abi,
    address: ADVENTURE_ADDRESS as `0x${string}`,
    functionName: 'get_player_token_id',
    args: [address || '0x0'],
    enabled: !!address && !!ADVENTURE_ADDRESS && !!ADVENTURE_ABI,
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

  // TODO: Fetch level completion data from Map contract
  // For now, return basic progress structure
  const progress = useMemo((): AdventureProgress | null => {
    if (!address || !hasNFT || !tokenId) return null;

    return {
      tokenId,
      username: 'Adventurer', // TODO: Fetch from contract or controller
      levelsCompleted: [], // TODO: Query Map contract for completed levels
      totalLevels: TOTAL_LEVELS,
      completionPercentage: 0,
    };
  }, [address, hasNFT, tokenId]);

  const isLoading = address ? tokenIdIsPending : false;

  return {
    progress,
    isLoading,
    hasNFT,
    error: tokenIdError,
  };
}
