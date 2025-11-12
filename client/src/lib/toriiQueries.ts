/**
 * Torii query utilities
 *
 * Queries game sessions from external Dojo worlds using Torii's SQL endpoint.
 *
 * APPROACH:
 * Use Torii's /sql endpoint to query the token_balances table directly.
 * This gives us token ownership indexed by Torii without needing contract calls.
 *
 * Reference: Death Mountain client implementation
 * @see https://github.com/cartridge-gg/loot-survivor/blob/main/client/src/dojo/useGameTokens.ts
 */

import { DojoGameConfig } from './challenges';

/**
 * Add padding to StarkNet addresses (ensure 66 character format with 0x prefix)
 */
function addAddressPadding(address: string): string {
  const cleaned = address.toLowerCase().replace('0x', '');
  return '0x' + cleaned.padStart(64, '0');
}

/**
 * Query player's game session token IDs from Torii SQL endpoint
 *
 * Uses Torii's indexed token_balances table to find tokens owned by the player.
 * This is much more efficient than querying all tokens and checking ownership.
 *
 * @param playerAddress - The player's wallet address
 * @param dojoConfig - Dojo world configuration (Torii endpoints, Denshokan address, etc.)
 * @returns Array of token IDs owned by the player
 */
export async function queryPlayerGameTokenIds(
  playerAddress: string,
  dojoConfig: DojoGameConfig
): Promise<string[]> {
  console.log('[Torii] Querying player tokens from:', dojoConfig.torii_url);
  console.log('[Torii] Player:', playerAddress);
  console.log('[Torii] Denshokan:', dojoConfig.denshokan_address);

  try {
    const paddedPlayer = addAddressPadding(playerAddress);
    const paddedContract = addAddressPadding(dojoConfig.denshokan_address);

    const query = `
      SELECT token_id FROM token_balances
      WHERE account_address = "${paddedPlayer}"
      AND contract_address = "${paddedContract}"
      LIMIT 10000
    `;

    const url = `${dojoConfig.torii_url}/sql?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Token IDs come in format "contract:tokenId", extract the tokenId part
    const tokenIds = data.map((row: any) => {
      const parts = row.token_id.split(':');
      return '0x' + parseInt(parts[1], 16).toString(16);
    });

    console.log(`[Torii] Found ${tokenIds.length} tokens owned by player`);
    return tokenIds;
  } catch (error) {
    console.error('[Torii] Error querying player tokens:', error);
    return [];
  }
}

