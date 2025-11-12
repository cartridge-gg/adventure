/**
 * Denshokan contract call utilities
 *
 * Utilities for calling the Dojo Minigame contract's game_over function.
 *
 * NOTE: Ownership is handled by Torii's SQL endpoint (token_balances table).
 * We only need to query game_over status from the Minigame contract.
 */

import { Contract, RpcProvider } from 'starknet';

/**
 * Minimal ABI for Dojo Minigame game_over call
 */
const MINIGAME_ABI = [
  {
    type: 'function',
    name: 'game_over',
    inputs: [{ name: 'token_id', type: 'core::integer::u64' }],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'view',
  },
];

/**
 * Check if a game session is complete
 *
 * @param provider - StarkNet RPC provider
 * @param minigameAddress - Dojo Minigame contract address
 * @param tokenId - Token ID representing the game session
 * @returns True if game is complete, false otherwise
 */
export async function isGameComplete(
  provider: RpcProvider,
  minigameAddress: string,
  tokenId: string
): Promise<boolean> {
  try {
    const contract = new Contract({
      abi: MINIGAME_ABI,
      address: minigameAddress,
      providerOrAccount: provider,
    });
    // Note: Minigame contract uses u64 for token_id, not u256
    const tokenIdU64 = BigInt(tokenId);

    const gameOver = await contract.game_over(tokenIdU64);

    return Boolean(gameOver);
  } catch (error) {
    console.error(`[Minigame] Error checking game status for token ${tokenId}:`, error);
    return false;
  }
}
