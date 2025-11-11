/**
 * Hook for finding and verifying player's game sessions
 *
 * Queries Torii to find game NFTs owned by the player, then
 * calls the minigame contract to verify score and completion status.
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from '@starknet-react/core';
import { Abi } from 'starknet';
import { getChallengeByLevel, getDojoConfigForChallenge } from '../lib/challenges';
import { queryPlayerCompletedGames, queryPlayerGameSessions } from '../lib/toriiQueries';

export interface GameSessionWithState {
  token_id: string;
  score: number;
  game_over: boolean;
}

// Minimal ABI for IMinigameTokenData interface (Denshokan standard)
const MINIGAME_ABI = [
  {
    type: 'function',
    name: 'score',
    inputs: [{ name: 'token_id', type: 'core::integer::u64' }],
    outputs: [{ type: 'core::integer::u32' }],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'game_over',
    inputs: [{ name: 'token_id', type: 'core::integer::u64' }],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'view',
  },
] as const;

/**
 * Hook to find and verify player's game sessions for a specific challenge level (OPTIMIZED)
 *
 * Uses queryPlayerCompletedGames which queries Game models from Torii,
 * getting score and game_over status without additional contract calls.
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
    isLoadingTokens,
    error,
    challenge,
    dojoConfig,
  };
}

/**
 * Hook to verify a specific game session's state
 *
 * Calls the minigame contract to get score and game_over status
 */
export function useGameSessionState(
  tokenId: string | null,
  minigameContractAddress: string | null,
  minimumScore: number
) {
  // Query score
  const {
    data: scoreData,
    isLoading: isLoadingScore,
    error: scoreError,
  } = useReadContract({
    abi: MINIGAME_ABI as Abi,
    address: minigameContractAddress as `0x${string}`,
    functionName: 'score',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    enabled: !!tokenId && !!minigameContractAddress,
  });

  // Query game_over
  const {
    data: gameOverData,
    isLoading: isLoadingGameOver,
    error: gameOverError,
  } = useReadContract({
    abi: MINIGAME_ABI as Abi,
    address: minigameContractAddress as `0x${string}`,
    functionName: 'game_over',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    enabled: !!tokenId && !!minigameContractAddress,
  });

  const score = scoreData ? Number(scoreData) : 0;
  const gameOver = gameOverData ? Boolean(gameOverData) : false;
  const isLoading = isLoadingScore || isLoadingGameOver;
  const error = scoreError || gameOverError;

  return {
    score,
    gameOver,
    isLoading,
    error,
  };
}

/**
 * Combined hook that fetches all game sessions with their states (OPTIMIZED)
 *
 * Returns sessions with score and game_over already fetched from Torii,
 * no additional contract calls needed!
 */
export function useGameSessionsWithState(challengeLevel: number) {
  const { sessions, isLoadingTokens, error: tokensError, challenge, dojoConfig } = useGameSessions(challengeLevel);

  return {
    sessions,
    isLoading: isLoadingTokens,
    error: tokensError,
    challenge,
    dojoConfig,
  };
}
