/**
 * Hook for loading leaderboard data
 *
 * Queries all NFT progress data in parallel batches and sorts by completion.
 * Since there's no total_supply function, we query sequentially until we hit errors.
 */

import { useState, useCallback } from 'react';
import { useContract } from '@starknet-react/core';
import { Abi } from 'starknet';
import { MAP_ADDRESS, MAP_ABI, ADVENTURE_ABI, ADVENTURE_ADDRESS } from '../lib/config';
import { TOTAL_LEVELS } from '../lib/adventureConfig';

export interface LeaderboardEntry {
  tokenId: string;
  username: string;
  levelsCompleted: number[];
  completionPercentage: number;
  timestamp: number;
}

const BATCH_SIZE = 20;
const MAX_TOKENS = 500; // Safety limit to prevent infinite loops

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const { contract: mapContract } = useContract({
    address: MAP_ADDRESS as `0x${string}`,
    abi: MAP_ABI as Abi,
  });

  const { contract: adventureContract } = useContract({
    address: ADVENTURE_ADDRESS as `0x${string}`,
    abi: ADVENTURE_ABI as Abi,
  });

  /**
   * Decode progress bitmap to get completed levels
   */
  const decodeLevels = useCallback((progressBitmap: bigint): number[] => {
    const completed: number[] = [];
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      const mask = 1n << BigInt(level);
      if ((progressBitmap & mask) !== 0n) {
        completed.push(level);
      }
    }
    return completed;
  }, []);

  /**
   * Load data for a single token ID
   */
  const loadTokenData = useCallback(async (tokenId: bigint): Promise<LeaderboardEntry | null> => {
    if (!mapContract || !adventureContract) return null;

    try {
      // Query owner_of to check if token exists (will throw if it doesn't)
      await mapContract.owner_of(tokenId);

      // Token exists, query its data
      const [progressData, usernameData, timestampData] = await Promise.all([
        adventureContract.get_progress(tokenId),
        mapContract.get_username(tokenId),
        mapContract.get_timestamp(tokenId),
      ]);

      const progressBitmap = progressData as bigint;
      const levelsCompleted = decodeLevels(progressBitmap);

      // Decode username from felt252
      let username = 'Anonymous';
      try {
        const usernameFelt = usernameData as bigint;
        if (usernameFelt > 0n) {
          // Convert felt252 to string (Cairo short string encoding)
          const hex = usernameFelt.toString(16);
          const bytes = hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
          username = String.fromCharCode(...bytes.filter(b => b !== 0));
        }
      } catch (e) {
        // Keep default username
      }

      return {
        tokenId: tokenId.toString(),
        username,
        levelsCompleted,
        completionPercentage: (levelsCompleted.length / TOTAL_LEVELS) * 100,
        timestamp: Number(timestampData as bigint),
      };
    } catch (error) {
      // Token doesn't exist or other error
      return null;
    }
  }, [mapContract, adventureContract, decodeLevels]);

  /**
   * Load all leaderboard data
   */
  const loadLeaderboard = useCallback(async () => {
    if (!mapContract || !adventureContract) {
      setError('Contracts not loaded');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEntries([]);
    setProgress({ current: 0, total: 0 });

    try {
      const allEntries: LeaderboardEntry[] = [];
      let tokenId = 0n;
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 5; // Stop after 5 consecutive missing tokens

      // Load tokens in batches
      while (tokenId < MAX_TOKENS && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
        // Create batch of token IDs to query
        const batchStart = tokenId;
        const batchTokenIds: bigint[] = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
          batchTokenIds.push(batchStart + BigInt(i));
        }

        // Query batch in parallel
        const batchResults = await Promise.all(
          batchTokenIds.map(id => loadTokenData(id))
        );

        // Process results
        let foundInBatch = false;
        for (const entry of batchResults) {
          if (entry) {
            allEntries.push(entry);
            foundInBatch = true;
            consecutiveErrors = 0; // Reset error counter
          }
        }

        // Update progress
        tokenId += BigInt(BATCH_SIZE);
        setProgress({ current: allEntries.length, total: allEntries.length });

        // If no tokens found in this batch, increment error counter
        if (!foundInBatch) {
          consecutiveErrors++;
        }

        // Update state with current entries (progressive loading)
        setEntries([...allEntries].sort((a, b) => {
          // Sort by completion percentage (descending), then by timestamp (ascending)
          if (b.completionPercentage !== a.completionPercentage) {
            return b.completionPercentage - a.completionPercentage;
          }
          return a.timestamp - b.timestamp;
        }));
      }

      // Final update
      setProgress({ current: allEntries.length, total: allEntries.length });
    } catch (err) {
      console.error('[Leaderboard] Error loading:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [mapContract, adventureContract, loadTokenData]);

  return {
    entries,
    isLoading,
    progress,
    error,
    loadLeaderboard,
  };
}
