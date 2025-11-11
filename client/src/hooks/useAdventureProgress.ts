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
import { ADVENTURE_ADDRESS, ADVENTURE_ABI } from '../lib/config';

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
    args: address ? [address] : undefined,
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

  // Query progress bitmap from contract (single call instead of 6 separate calls)
  const {
    data: progressData,
    isPending: progressIsPending,
  } = useReadContract({
    abi: ADVENTURE_ABI as Abi,
    address: ADVENTURE_ADDRESS as `0x${string}`,
    functionName: 'get_progress',
    args: [tokenId ? BigInt(tokenId) : 0n],
    enabled: !!tokenId && !!ADVENTURE_ADDRESS && !!ADVENTURE_ABI,
  });

  // Decode bitmap to get completed levels
  const levelsCompleted = useMemo(() => {
    if (!tokenId || !progressData) return [];

    const progressBitmap = progressData as bigint;
    const completed: number[] = [];

    // Check each level bit (contract uses: 1 << level_number as the mask)
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      const mask = 1n << BigInt(level);
      if ((progressBitmap & mask) !== 0n) {
        completed.push(level);
      }
    }

    return completed;
  }, [tokenId, progressData]);

  const progress = useMemo((): AdventureProgress | null => {
    if (!address || !hasNFT || !tokenId) return null;

    return {
      tokenId,
      username: 'Adventurer',
      levelsCompleted,
      totalLevels: TOTAL_LEVELS,
      completionPercentage: (levelsCompleted.length / TOTAL_LEVELS) * 100,
    };
  }, [address, hasNFT, tokenId, levelsCompleted]);

  // Only wait for queries that are actually running
  const isLoading = address ? (tokenIdIsPending || (!!tokenId && progressIsPending)) : false;

  return {
    progress,
    isLoading,
    hasNFT,
    error: tokenIdError,
  };
}
