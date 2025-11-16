/**
 * Hook for finding player's game sessions
 *
 * APPROACH:
 * 1. Use Torii's SQL endpoint to query token_balances for player's tokens
 * 2. Use Dojo Minigame contract calls to check game_over status
 *
 * This leverages Torii's indexed ERC721 ownership data for efficient querying.
 *
 * Reference: Death Mountain client implementation
 * @see https://github.com/cartridge-gg/loot-survivor/blob/main/client/src/dojo/useGameTokens.ts
 */

import { useState, useEffect } from 'react';
import { RpcProvider } from 'starknet';
import { useAccount, useProvider } from '@starknet-react/core';
import { getChallengeByLevel, getDojoConfigForChallenge } from '../lib/challenges';
import { queryPlayerGameTokenIds } from '../lib/toriiQueries';
import { isGameComplete } from '../lib/denshokanCalls';

export interface GameSessionWithState {
  token_id: string;
  game_over: boolean;
}

/**
 * Hook to find player's game sessions for a specific challenge level
 *
 * Uses Torii's SQL endpoint to efficiently query tokens owned by the player,
 * then queries Dojo Minigame contract for game_over status.
 */
export function useGameSessions(challengeLevel: number) {
  const { address } = useAccount();
  const { provider } = useProvider();
  const [sessions, setSessions] = useState<GameSessionWithState[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const challenge = getChallengeByLevel(challengeLevel);
  const dojoConfig = challenge ? getDojoConfigForChallenge(challenge) : null;

  // Query Torii SQL endpoint for player's tokens
  // NOTE: In testnet mode (dev/sepolia), dojoConfig will be undefined and we skip Torii queries
  // Testnet mode uses MockGame contracts which are verified directly via contract calls
  useEffect(() => {
    async function fetchSessions() {
      if (!address || !challenge || !provider) {
        setSessions([]);
        return;
      }

      // Skip Torii query in testnet mode (no dojoConfig means MockGame contracts)
      if (!dojoConfig) {
        console.log('[useGameSessions] Testnet mode: skipping Torii query (using MockGame)');
        setSessions([]);
        return;
      }

      setIsLoadingTokens(true);
      setError(null);

      try {
        console.log('[useGameSessions] Querying Torii for player tokens...');

        // Step 1: Query player's token IDs from Torii SQL endpoint
        const tokenIds = await queryPlayerGameTokenIds(address, dojoConfig);

        console.log(`[useGameSessions] Found ${tokenIds.length} tokens owned by player`);

        // Step 2: Get game_over status for each token
        // Batch requests for efficiency (process 10 at a time)
        const batchSize = 10;
        const gameSessions: GameSessionWithState[] = [];

        for (let i = 0; i < tokenIds.length; i += batchSize) {
          const batch = tokenIds.slice(i, i + batchSize);

          const batchResults = await Promise.all(
            batch.map((tokenId) =>
              isGameComplete(provider as RpcProvider, dojoConfig.minigame_contract, tokenId)
            )
          );

          // Add all tokens with their game_over status
          batchResults.forEach((gameOver, idx) => {
            gameSessions.push({
              token_id: batch[idx],
              game_over: gameOver,
            });
          });
        }

        console.log(`[useGameSessions] Processed ${gameSessions.length} game sessions`);
        setSessions(gameSessions);
      } catch (err) {
        console.error('[useGameSessions] Error fetching sessions:', err);
        const errorMessage =
          err instanceof Error && err.message.includes('502')
            ? 'Game indexer temporarily unavailable. Please try again later.'
            : err instanceof Error
              ? err.message
              : 'Failed to fetch game sessions';
        setError(errorMessage);
        setSessions([]);
      } finally {
        setIsLoadingTokens(false);
      }
    }

    fetchSessions();
  }, [address, challengeLevel, dojoConfig, challenge, provider]);

  return {
    sessions,
    isLoading: isLoadingTokens,
    error,
    challenge,
    dojoConfig,
  };
}
