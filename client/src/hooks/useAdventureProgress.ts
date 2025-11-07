/**
 * Hook for managing adventure progress
 *
 * Queries the contract to get player's NFT and progress data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { AdventureProgress } from '../lib/adventureTypes';
import { TOTAL_LEVELS } from '../lib/adventureConfig';
import { useAdventureContract } from './useAdventureContract';

export function useAdventureProgress() {
  const { address } = useAccount();
  const { getPlayerTokenId, isLevelComplete } = useAdventureContract();
  const [progress, setProgress] = useState<AdventureProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNFT, setHasNFT] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!address) {
      setIsLoading(false);
      setHasNFT(false);
      setProgress(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if player has minted NFT
      // NOTE: This function needs to be implemented based on your contract
      // For now, we'll use a placeholder approach
      const tokenResult = await getPlayerTokenId(address);

      if (!tokenResult.success || !tokenResult.tokenId) {
        // Player hasn't minted yet
        setHasNFT(false);
        setProgress(null);
        setIsLoading(false);
        return;
      }

      setHasNFT(true);
      const tokenId = tokenResult.tokenId;

      // Query level completion status for all levels
      const levelsCompleted: number[] = [];

      // Check each level (1 through TOTAL_LEVELS)
      for (let levelNum = 1; levelNum <= TOTAL_LEVELS; levelNum++) {
        try {
          const levelResult = await isLevelComplete(tokenId, levelNum);
          if (levelResult.success && levelResult.isComplete) {
            levelsCompleted.push(levelNum);
          }
        } catch (err) {
          console.warn(`Failed to check level ${levelNum}:`, err);
          // Continue checking other levels
        }
      }

      const adventureProgress: AdventureProgress = {
        tokenId,
        username: 'Adventurer', // TODO: Fetch from contract or controller
        levelsCompleted,
        totalLevels: TOTAL_LEVELS,
        completionPercentage: (levelsCompleted.length / TOTAL_LEVELS) * 100,
      };

      setProgress(adventureProgress);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [address, getPlayerTokenId, isLevelComplete]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    isLoading,
    hasNFT,
    error,
    refetch: fetchProgress,
  };
}
