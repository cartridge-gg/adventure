/**
 * Challenge configuration and utilities
 *
 * Loads challenge data from spec/challenges.json and provides
 * type-safe access to game configuration for Torii queries.
 */

import challengesData from '../../../spec/challenges.json';
import { CHAIN_ENV } from './config';

export interface DojoGameConfig {
  world_address: string;
  torii_url: string;
  torii_graphql: string;
  namespace: string;
  minigame_contract: string;
  denshokan_address: string;
}

export interface Challenge {
  level: number;
  game: string;
  description: string;
  location: string;
  dojo: {
    mainnet: DojoGameConfig;
    sepolia: DojoGameConfig;
    dev?: DojoGameConfig; // Optional for local development
  };
  notes?: string;
}

export type ChallengesData = {
  challenges: Challenge[];
};

// Type-safe challenges data
export const CHALLENGES = challengesData as ChallengesData;

/**
 * Get challenge configuration for a specific level
 */
export function getChallengeByLevel(level: number): Challenge | undefined {
  return CHALLENGES.challenges.find((c) => c.level === level);
}

/**
 * Get the Dojo configuration for the current environment
 * Returns undefined for dev environment (uses local MockGame contracts instead)
 */
export function getDojoConfigForChallenge(challenge: Challenge): DojoGameConfig | undefined {
  if (CHAIN_ENV === 'dev') {
    return challenge.dojo.dev; // undefined for external games, uses MockGame locally
  }
  const env = CHAIN_ENV === 'mainnet' ? 'mainnet' : 'sepolia';
  return challenge.dojo[env];
}

/**
 * Get all challenge levels
 */
export function getAllChallengeLevels(): number[] {
  return CHALLENGES.challenges.map((c) => c.level).sort((a, b) => a - b);
}
