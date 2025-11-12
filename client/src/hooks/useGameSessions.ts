/**
 * Hook for finding player's game sessions
 *
 * Queries Torii to find game NFTs owned by the player with their completion status.
 */

import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { getChallengeByLevel, getDojoConfigForChallenge } from '../lib/challenges';
import { queryPlayerCompletedGames } from '../lib/toriiQueries';

export interface GameSessionWithState {
  token_id: string;
  score: number;
  game_over: boolean;
}

/**
 * Hook to find player's game sessions for a specific challenge level
 *
 * Queries Torii for game sessions with score and completion status.
 */
export function useGameSessions(challengeLevel: number) {
  const { address } = useAccount();
  const [sessions, setSessions] = useState<GameSessionWithState[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const challenge = getChallengeByLevel(challengeLevel);
  const dojoConfig = challenge ? getDojoConfigForChallenge(challenge) : null;

  // Query Torii for player's game tokens with game state included
  // NOTE: In dev mode (Katana), dojoConfig will be undefined and we skip Torii queries
  // Dev mode uses MockGame contracts which are verified directly via contract calls
  useEffect(() => {
    async function fetchSessions() {
      if (!address || !challenge) {
        setSessions([]);
        return;
      }

      // Skip Torii query in dev mode (no dojoConfig means local MockGame)
      if (!dojoConfig) {
        console.log('[useGameSessions] Dev mode: skipping Torii query (using MockGame)');
        setSessions([]);
        return;
      }

      setIsLoadingTokens(true);
      setError(null);

      try {
        // Use optimized query that includes game state from Torii
        const gameSessionsData = await queryPlayerCompletedGames(address, dojoConfig);

        // Map to our interface
        const sessions = gameSessionsData.map((session) => ({
          token_id: session.token_id,
          score: session.score,
          game_over: session.game_over,
        }));

        setSessions(sessions);
      } catch (err) {
        console.error('[useGameSessions] Error fetching sessions:', err);
        // Set a user-friendly error message for Torii unavailability
        const errorMessage = err instanceof Error && err.message.includes('502')
          ? 'Game indexer temporarily unavailable. Please try again later.'
          : err instanceof Error ? err.message : 'Failed to fetch game sessions';
        setError(errorMessage);
        setSessions([]);
      } finally {
        setIsLoadingTokens(false);
      }
    }

    fetchSessions();
  }, [address, challengeLevel, dojoConfig, challenge]);

  return {
    sessions,
    isLoading: isLoadingTokens,
    error,
    challenge,
    dojoConfig,
  };
}
