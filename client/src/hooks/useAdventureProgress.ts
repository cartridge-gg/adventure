/**
 * Hook for managing adventure progress
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { AdventureProgress } from '../lib/adventureTypes';
import { mockGetPlayerTokenId, mockGetProgress, getMockState } from '../lib/mock';
import { TOTAL_LEVELS } from '../lib/adventureConfig';

export function useAdventureProgress() {
  const { address } = useAccount();
  const [progress, setProgress] = useState<AdventureProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNFT, setHasNFT] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if player has minted NFT
      const tokenResult = await mockGetPlayerTokenId(address);

      if (!tokenResult.success || !tokenResult.tokenId) {
        setHasNFT(false);
        setProgress(null);
        setIsLoading(false);
        return;
      }

      setHasNFT(true);

      // Get progress bitmap
      const progressResult = await mockGetProgress(tokenResult.tokenId);

      if (!progressResult.success) {
        throw new Error('Failed to fetch progress');
      }

      // Parse progress bitmap to get completed levels
      const bitmap = parseInt(progressResult.progress || '0x0', 16);
      const levelsCompleted: number[] = [];

      for (let i = 1; i <= TOTAL_LEVELS; i++) {
        if (bitmap & (1 << i)) {
          levelsCompleted.push(i);
        }
      }

      // Get username from mock state
      const mockState = getMockState();

      const adventureProgress: AdventureProgress = {
        tokenId: tokenResult.tokenId,
        username: mockState.username || 'Adventurer',
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
  }, [address]);

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
