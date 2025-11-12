/**
 * Torii GraphQL query utilities
 *
 * Queries game sessions from external Dojo worlds using Torii's GraphQL API.
 *
 * NOTE: This is currently a stub implementation that returns empty results.
 * Full Torii integration will be implemented when needed for production deployment.
 *
 * FUTURE IMPLEMENTATION NOTES:
 * - Use tokenBalances query to find ERC721 tokens owned by player
 * - Query game-specific models (e.g., NUMS_Game, ls_AdventurerPacked) for game state
 * - For Death Mountain: decode AdventurerPacked using deathMountainDecoder
 * - See docs/TORII_DENSHOKAN_APPROACH.md for detailed implementation strategy
 */

import { DojoGameConfig } from './challenges';

export interface GameSession {
  token_id: string;
  owner: string;
  score: number;
  game_over: boolean;
}

/**
 * Query player's completed game sessions from Torii
 *
 * @param playerAddress - The player's wallet address
 * @param dojoConfig - Dojo world configuration (Torii endpoints, etc.)
 * @returns Array of game sessions with score and completion status
 *
 * NOTE: Currently returns empty array. Implement when Torii integration is needed.
 */
export async function queryPlayerCompletedGames(
  playerAddress: string,
  dojoConfig: DojoGameConfig
): Promise<GameSession[]> {
  console.log('[Torii] Stub: queryPlayerCompletedGames called for', playerAddress);
  console.log('[Torii] Endpoint:', dojoConfig.torii_graphql);

  // TODO: Implement Torii GraphQL queries
  // For now, return empty array to indicate no sessions found
  return [];
}
